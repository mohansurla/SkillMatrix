const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { run, get } = require('../database/db');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    const existing = await get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Only admin can create mentor/admin accounts via registration
    if ((role === 'admin' || role === 'mentor') && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only admins can create mentor or admin accounts.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email.toLowerCase(), password_hash, role]
    );

    const user = await get(
      'SELECT id, name, email, role, avatar_url, bio, created_at FROM users WHERE id = ?',
      [result.lastID]
    );

    const token = jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    res.status(201).json({ success: true, message: 'Registration successful', data: { user, token } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, message: 'Login successful', data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, getMe };
