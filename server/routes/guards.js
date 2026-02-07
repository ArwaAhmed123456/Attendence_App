const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// POST /api/guards/signup
router.post('/signup', (req, res) => {
    const { name, email, password, project_id } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        const hash = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO guards (name, email, password, project_id) VALUES (?, ?, ?, ?)');
        stmt.run(name, email, hash, project_id || null);
        res.status(201).json({ success: true, message: 'Guard account created successfully' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Guard Signup error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/guards/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const stmt = db.prepare('SELECT * FROM guards WHERE email = ?');
    const guard = stmt.get(email);

    if (!guard) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, guard.password);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: guard.id, email: guard.email, role: 'guard' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { name: guard.name, email: guard.email, role: 'guard', project_id: guard.project_id } });
});

// Middleware for admin verification
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// GET /api/guards - Get all guards (Admin only)
router.get('/', verifyAdmin, (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT g.id, g.name, g.email, g.project_id, g.created_at, p.name as project_name, p.code as project_code
            FROM guards g
            LEFT JOIN projects p ON g.project_id = p.id
            ORDER BY g.created_at DESC
        `);
        const guards = stmt.all();
        res.json(guards);
    } catch (err) {
        console.error('Error fetching guards:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/guards/:id/assign-project - Assign guard to project (Admin only)
router.put('/:id/assign-project', verifyAdmin, (req, res) => {
    const guardId = req.params.id;
    const { project_id } = req.body;

    try {
        const stmt = db.prepare('UPDATE guards SET project_id = ? WHERE id = ?');
        const result = stmt.run(project_id, guardId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Guard not found' });
        }

        res.json({ success: true, message: 'Guard assigned to project successfully' });
    } catch (err) {
        console.error('Error assigning guard:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
