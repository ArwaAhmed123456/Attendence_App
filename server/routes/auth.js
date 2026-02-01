const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const stmt = db.prepare('SELECT * FROM admins WHERE email = ?');
    const admin = stmt.get(email);

    if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, admin.password);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email: admin.email } });
});

router.post('/signup', (req, res) => {
    const { email, password, first_name, last_name, phone, organization } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone format (optional but if provided should be valid)
    if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    try {
        const hash = bcrypt.hashSync(password, 10);
        const stmt = db.prepare('INSERT INTO admins (email, password, first_name, last_name, phone, organization) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(email, hash, first_name, last_name, phone || null, organization || null);
        res.status(201).json({ message: 'Admin account created successfully' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});
// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    const stmt = db.prepare('SELECT * FROM admins WHERE email = ?');
    const admin = stmt.get(email);

    if (!admin) {
        // Professional security: don't reveal if email exists
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    const update = db.prepare('UPDATE admins SET reset_token = ?, reset_expires = ? WHERE id = ?');
    update.run(token, expires.toISOString(), admin.id);

    // Mock sending email
    console.log(`[RESET] Token for ${email}: ${token}`);

    res.json({
        message: 'If that email exists, a reset link has been sent.',
        mockToken: token // ONLY for development visibility
    });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    const stmt = db.prepare('SELECT * FROM admins WHERE reset_token = ? AND reset_expires > ?');
    const admin = stmt.get(token, new Date().toISOString());

    if (!admin) {
        return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    const update = db.prepare('UPDATE admins SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?');
    update.run(hash, admin.id);

    res.json({ message: 'Password reset successful' });
});

module.exports = router;
