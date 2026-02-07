const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// POST /api/logs - Submit log (Public/Mobile Check-in)
router.post('/', (req, res) => {
    const {
        project_code,
        name,
        trade,
        car_reg,
        user_type,
        time_in,
        date
    } = req.body;

    if (!project_code) return res.status(400).json({ error: 'Project code is missing' });
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!time_in) return res.status(400).json({ error: 'Time In is required' });
    if (!date) return res.status(400).json({ error: 'Date is required' });

    // Verify project code first (Case-insensitive and trimmed)
    const stmtProject = db.prepare('SELECT id FROM projects WHERE UPPER(TRIM(code)) = ?');
    const project = stmtProject.get(project_code.trim().toUpperCase());

    if (!project) {
        console.log('[Logs POST] Invalid project code:', project_code);
        return res.status(400).json({ error: 'Invalid project code' });
    }

    console.log('[Logs POST] Matching project found:', project.id, 'for code:', project_code);

    try {
        const stmt = db.prepare(`
      INSERT INTO logs (
        project_id, name, trade, car_reg, user_type, time_in, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            project.id,
            name,
            trade || '',
            car_reg || '',
            user_type || 'Employee',
            time_in,
            date
        );
        // Emit real-time notification to admins
        const io = req.app.get('io');
        if (io) {
            io.emit('newAttendance', {
                name,
                project_code,
                date,
                time_in
            });
        }

        res.json({ success: true, message: 'Check-in successful' });
    } catch (err) {
        console.error('[Logs Submission Error]', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// POST /api/logs/manual - Submit log manually (Admin)
router.post('/manual', verifyToken, (req, res) => {
    const {
        project_id,
        name,
        trade,
        car_reg,
        user_type,
        time_in,
        time_out,
        date
    } = req.body;

    if (!project_id || !name || !time_in || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate hours if time_out is provided
    let hours = 0;
    if (time_out) {
        try {
            const start = new Date(`${date}T${time_in}`);
            const end = new Date(`${date}T${time_out}`);
            const diffMs = end - start;
            hours = diffMs / (1000 * 60 * 60);
            if (hours < 0) hours = 0;
            hours = parseFloat(hours.toFixed(2));
        } catch (e) {
            console.error('Time calc error', e);
        }
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO logs (
                project_id, name, trade, car_reg, user_type, time_in, time_out, hours, date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            project_id,
            name,
            trade || '',
            car_reg || '',
            user_type || 'Employee',
            time_in,
            time_out || null,
            hours,
            date
        );

        res.json({ success: true, message: 'Log created manually' });
    } catch (err) {
        console.error('[Manual Log Error]', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/logs/active/:projectCode - Get active logs for a project (Guard/Admin)
router.get('/active/:projectCode', (req, res) => {
    const { projectCode } = req.params;

    const stmtProject = db.prepare('SELECT id FROM projects WHERE code = ?');
    const project = stmtProject.get(projectCode);
    if (!project) return res.status(400).json({ error: 'Invalid project' });

    const stmt = db.prepare('SELECT * FROM logs WHERE project_id = ? AND time_out IS NULL ORDER BY date DESC, time_in ASC');
    const logs = stmt.all(project.id);
    res.json(logs);
});

// POST /api/logs/:id/checkout - Finalize checkout (Guard/Admin)
router.post('/:id/checkout', (req, res) => {
    const logId = req.params.id;
    const now = new Date();
    const timeOut = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    try {
        const getLog = db.prepare('SELECT * FROM logs WHERE id = ?');
        const log = getLog.get(logId);

        if (!log) return res.status(404).json({ error: 'Log not found' });

        // Calculate hours
        let hours = 0;
        try {
            const start = new Date(`${log.date}T${log.time_in}`);
            const end = new Date(`${log.date}T${timeOut}`);
            const diffMs = end - start;
            hours = diffMs / (1000 * 60 * 60);
            if (hours < 0) hours = 0;
            hours = parseFloat(hours.toFixed(2));
        } catch (e) {
            console.error('Time calc error', e);
        }

        const stmt = db.prepare('UPDATE logs SET time_out = ?, hours = ? WHERE id = ?');
        stmt.run(timeOut, hours, logId);

        res.json({ success: true, message: 'Checkout successful', time_out: timeOut, hours });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/project/:id', verifyToken, (req, res) => {
    const projectId = req.params.id;

    try {
        const stmt = db.prepare('SELECT * FROM logs WHERE project_id = ? ORDER BY date DESC, time_in ASC');
        const logs = stmt.all(projectId);

        // also get project details
        const stmtProj = db.prepare('SELECT * FROM projects WHERE id = ?');
        const project = stmtProj.get(projectId);

        res.json({ project, logs });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/logs/:id - Update log (Admin)
router.put('/:id', verifyToken, (req, res) => {
    const logId = req.params.id;
    const {
        name,
        trade,
        car_reg,
        user_type,
        time_in,
        time_out,
        reason,
        date
    } = req.body;

    if (!name || !time_in || !time_out || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Recalculate hours
    let hours = 0;
    try {
        const start = new Date(`${date}T${time_in}`);
        const end = new Date(`${date}T${time_out}`);
        const diffMs = end - start;
        hours = diffMs / (1000 * 60 * 60);
        if (hours < 0) hours = 0;
        hours = parseFloat(hours.toFixed(2));
    } catch (e) {
        console.error('Time calc error', e);
    }

    try {
        const stmt = db.prepare(`
            UPDATE logs 
            SET name = ?, trade = ?, car_reg = ?, user_type = ?, time_in = ?, time_out = ?, hours = ?, reason = ?, date = ?
            WHERE id = ?
        `);

        const info = stmt.run(
            name,
            trade || '',
            car_reg || '',
            user_type || 'Employee',
            time_in,
            time_out,
            hours,
            reason || '',
            date,
            logId
        );

        if (info.changes === 0) return res.status(404).json({ error: 'Log not found' });

        res.json({ success: true, message: 'Log updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE /api/logs/:id - Delete log (Admin)
router.delete('/:id', verifyToken, (req, res) => {
    const logId = req.params.id;

    try {
        const stmt = db.prepare('DELETE FROM logs WHERE id = ?');
        const info = stmt.run(logId);

        if (info.changes === 0) return res.status(404).json({ error: 'Log not found' });

        res.json({ success: true, message: 'Log deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
