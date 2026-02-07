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

// POST /api/requests - Create a new permission request
router.post('/', (req, res) => {
    const { project_code, user_name, requested_date, reason } = req.body;

    if (!project_code || !user_name || !requested_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO date_requests (project_code, user_name, requested_date, reason)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(project_code, user_name, requested_date, reason || '');
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/pending', verifyToken, (req, res) => {
    try {
        const stmt = db.prepare("SELECT * FROM date_requests WHERE status = 'pending' ORDER BY created_at DESC");
        const requests = stmt.all();
        res.json(requests);
    } catch (err) {
        console.error('[Requests Pending Error]', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/requests/:id/status - Update request status (Admin only)
router.put('/:id/status', verifyToken, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const stmt = db.prepare('UPDATE date_requests SET status = ? WHERE id = ?');
        stmt.run(status, id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /api/requests/status - Check status of a specific request (User polling)
// We use query params ?project_code=...&user_name=...&date=... OR by ID if we returned it
// Let's use ID for simplicity if the client stores it, but checking by fields is more robust if they reload.
// Let's support checking by ID.
router.get('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare('SELECT status FROM date_requests WHERE id = ?');
        const request = stmt.get(id);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json({ status: request.status });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
