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

// POST /api/logs - Submit log (Public/Mobile)
router.post('/', (req, res) => {
    const {
        project_code,
        name,
        trade,
        car_reg,
        user_type,
        time_in,
        time_out,
        reason,
        date
    } = req.body;

    if (!project_code) return res.status(400).json({ error: 'Project code is missing' });
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!time_in) return res.status(400).json({ error: 'Time In is required' });
    if (!time_out) return res.status(400).json({ error: 'Time Out is required' });
    if (!date) return res.status(400).json({ error: 'Date is required' });

    // Verify project code first
    const stmtProject = db.prepare('SELECT id FROM projects WHERE code = ?');
    const project = stmtProject.get(project_code);

    if (!project) return res.status(400).json({ error: 'Invalid project code' });

    // Calculate hours
    let hours = 0;
    try {
        const start = new Date(`${date}T${time_in}`);
        const end = new Date(`${date}T${time_out}`);
        const diffMs = end - start;
        hours = diffMs / (1000 * 60 * 60);
        if (hours < 0) hours = 0; // Handle overnight or errors? For now assume same day or user handled
        hours = parseFloat(hours.toFixed(2));
    } catch (e) {
        console.error('Time calc error', e);
    }

    try {
        const stmt = db.prepare(`
      INSERT INTO logs (
        project_id, name, trade, car_reg, user_type, time_in, time_out, hours, reason, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            project.id,
            name,
            trade || '',
            car_reg || '',
            user_type || 'Employee',
            time_in,
            time_out,
            hours,
            reason || '',
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

        res.json({ success: true, message: 'Log submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/projects/:id/logs - Get logs for a project (Admin)
router.get('/project/:id', verifyToken, (req, res) => {
    const projectId = req.params.id;

    const stmt = db.prepare('SELECT * FROM logs WHERE project_id = ? ORDER BY date DESC, time_in ASC');
    const logs = stmt.all(projectId);

    // also get project details
    const stmtProj = db.prepare('SELECT * FROM projects WHERE id = ?');
    const project = stmtProj.get(projectId);

    res.json({ project, logs });
});

module.exports = router;
