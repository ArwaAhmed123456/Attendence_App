const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateResetToken, sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Middleware to verify Admin Token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET); // Bearer TOKEN
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// GET /api/projects - List all projects (Admin)
router.get('/', verifyToken, (req, res) => {
    const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const projects = stmt.all();
    res.json(projects);
});

// POST /api/projects - Create a new project (Admin)
router.post('/', verifyToken, (req, res) => {
    const { name, code, password, admin_email } = req.body;
    if (!name || !code || !password || !admin_email) {
        return res.status(400).json({ error: 'Name, Code, Password, and Admin Email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const hash = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO projects (name, code, password, admin_email) VALUES (?, ?, ?, ?)');
        const info = stmt.run(name, code, hash, admin_email);
        res.json({ id: info.lastInsertRowid, name, code });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Project code must be unique' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/projects/verify - Verify project code and password (Public/Mobile)
router.post('/verify', (req, res) => {
    const { code, password } = req.body;
    if (!code || !password) return res.status(400).json({ error: 'Code and Password required' });

    const stmt = db.prepare('SELECT * FROM projects WHERE code = ?');
    const project = stmt.get(code);

    if (!project) return res.status(400).json({ error: 'Invalid project code' });

    // Verify password if set
    if (project.password) {
        const valid = bcrypt.compareSync(password, project.password);
        if (!valid) return res.status(401).json({ error: 'Invalid project password' });
    }

    res.json({ valid: true, project: { id: project.id, name: project.name, code: project.code } });
});

// POST /api/projects/verify-code - Verify project code only (Public/Mobile)
router.post('/verify-code', (req, res) => {
    let { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Project code required' });

    code = code.trim().toUpperCase();
    console.log('[VerifyCode] Attempting to verify:', code);

    const stmt = db.prepare('SELECT * FROM projects WHERE UPPER(TRIM(code)) = ?');
    const project = stmt.get(code);

    if (!project) {
        console.log('[VerifyCode] Project not found for:', code);
        return res.status(400).json({ error: 'Invalid project code' });
    }

    console.log('[VerifyCode] Success:', project.code);
    res.json({ valid: true, project: { id: project.id, name: project.name, code: project.code } });
});
// POST /api/projects/:id/verify-access - Admin password check before entry
router.post('/:id/verify-access', verifyToken, (req, res) => {
    const { password } = req.body;
    const { id } = req.params;

    const stmt = db.prepare('SELECT password FROM projects WHERE id = ?');
    const project = stmt.get(id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.password) {
        const valid = bcrypt.compareSync(password, project.password);
        if (!valid) return res.status(401).json({ error: 'Incorrect project password' });
    }

    res.json({ success: true });
});

// POST /api/projects/request-password - Worker forgot password
router.post('/request-password', (req, res) => {
    const { code, workerName } = req.body;
    if (!code) return res.status(400).json({ error: 'Project code required' });

    const io = req.app.get('io');
    if (io) {
        io.emit('passwordRequest', { code, workerName: workerName || 'A worker' });
    }

    res.json({ message: 'Request sent to administrator' });
});
// PUT /api/projects/:id/password - Update project password
router.put('/:id/password', verifyToken, (req, res) => {
    const { password } = req.body;
    const { id } = req.params;

    if (!password) return res.status(400).json({ error: 'Password required' });

    try {
        const hash = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('UPDATE projects SET password = ? WHERE id = ?');
        stmt.run(hash, id);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    console.log(`[DeleteProject] Starting deletion for ID: ${id}`);

    try {
        // Fetch project info first
        const project = db.prepare('SELECT code FROM projects WHERE id = ?').get(id);

        if (!project) {
            console.log(`[DeleteProject] Project with ID ${id} not found`);
            return res.status(404).json({ error: 'Project not found' });
        }

        const projectCode = project.code;
        console.log(`[DeleteProject] Found project code: ${projectCode}`);

        // Start a transaction if possible, or just run them sequentially
        const deleteLogs = db.prepare('DELETE FROM logs WHERE project_id = ?');
        const deleteDateReq = db.prepare('DELETE FROM date_requests WHERE project_code = ?');
        const deleteStaffPins = db.prepare('DELETE FROM staff_pins WHERE project_id = ?');
        const deleteProject = db.prepare('DELETE FROM projects WHERE id = ?');

        // Execute deletions
        const logsResult = deleteLogs.run(id);
        console.log(`[DeleteProject] Deleted ${logsResult.changes} logs`);

        const dateReqResult = deleteDateReq.run(projectCode);
        console.log(`[DeleteProject] Deleted ${dateReqResult.changes} date requests`);

        const staffPinsResult = deleteStaffPins.run(id);
        console.log(`[DeleteProject] Deleted ${staffPinsResult.changes} staff pins`);

        const result = deleteProject.run(id);
        console.log(`[DeleteProject] Project deleted result changes: ${result.changes}`);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project and all associated data deleted successfully' });
    } catch (err) {
        console.error('[DeleteProject] Error during deletion:', err);
        res.status(500).json({ error: 'Database error: ' + err.message });
    }
});

// PUT /api/projects/:id - Update project name and code
router.put('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || !code) {
        return res.status(400).json({ error: 'Name and code are required' });
    }

    try {
        // Check if new code already exists (excluding current project)
        const checkStmt = db.prepare('SELECT id FROM projects WHERE code = ? AND id != ?');
        const existing = checkStmt.get(code, id);

        if (existing) {
            return res.status(400).json({ error: 'Project code already exists' });
        }

        const stmt = db.prepare('UPDATE projects SET name = ?, code = ? WHERE id = ?');
        const result = stmt.run(name, code, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/projects/forgot-password - Initiate password reset
router.post('/forgot-password', async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Project code is required' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM projects WHERE UPPER(TRIM(code)) = ?');
        const project = stmt.get(code.trim().toUpperCase());

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const admin_email = project.admin_email;

        // Generate 6-digit reset token
        const resetToken = generateResetToken();
        const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now

        // Save token to database
        const updateStmt = db.prepare('UPDATE projects SET reset_token = ?, reset_token_expiry = ? WHERE id = ?');
        updateStmt.run(resetToken, expiry, project.id);

        // Send email
        const emailResult = await sendPasswordResetEmail(admin_email, project.name, resetToken);

        if (!emailResult.success) {
            return res.status(500).json({ error: 'Failed to send email. Please check email configuration.' });
        }

        res.json({ message: 'Reset code sent to your email', email: admin_email });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/projects/verify-reset-token - Verify the reset token
router.post('/verify-reset-token', (req, res) => {
    const { code, reset_token } = req.body;

    if (!code || !reset_token) {
        return res.status(400).json({ error: 'Code and Token are required' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM projects WHERE UPPER(TRIM(code)) = ?');
        const project = stmt.get(code.trim().toUpperCase());

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!project.reset_token || !project.reset_token_expiry) {
            return res.status(400).json({ error: 'No reset request found' });
        }

        if (Date.now() > project.reset_token_expiry) {
            return res.status(400).json({ error: 'Reset code has expired' });
        }

        if (project.reset_token !== reset_token) {
            return res.status(400).json({ error: 'Invalid reset code' });
        }

        res.json({ valid: true, message: 'Reset code verified' });
    } catch (err) {
        console.error('Verify token error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/projects/reset-password - Reset password with token
router.post('/reset-password', (req, res) => {
    const { code, reset_token, new_password } = req.body;

    if (!code || !reset_token || !new_password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const stmt = db.prepare('SELECT * FROM projects WHERE UPPER(TRIM(code)) = ?');
        const project = stmt.get(code.trim().toUpperCase());

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!project.reset_token || !project.reset_token_expiry) {
            return res.status(400).json({ error: 'No reset request found' });
        }

        if (Date.now() > project.reset_token_expiry) {
            return res.status(400).json({ error: 'Reset code has expired' });
        }

        if (project.reset_token !== reset_token) {
            return res.status(400).json({ error: 'Invalid reset code' });
        }

        // Update password and clear reset token
        const hash = bcrypt.hashSync(new_password, 10);
        const updateStmt = db.prepare('UPDATE projects SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
        updateStmt.run(hash, project.id);

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
