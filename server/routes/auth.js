const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const { formatUser } = require('../utils/formatter');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'inventory-system-secret-key-2024';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Log activity
    await db.collection('activity_log').add({
      user_id: user.id,
      username: user.username,
      action: 'LOGIN',
      details: `User ${user.username} logged in`,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        token,
        user: formatUser(user)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register (admin only)
router.post('/register', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { username, password, email, phone, role } = req.body;
    const full_name = req.body.full_name || req.body.fullName;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const usersRef = db.collection('users');
    const existingSnap = await usersRef.where('username', '==', username).limit(1).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const docRef = await usersRef.add({
      username,
      password: hashedPassword,
      full_name: full_name || null,
      email: email || null,
      phone: phone || null,
      role: role || 'user',
      avatar: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CREATE_USER',
      details: `Created user: ${username}`,
      created_at: new Date().toISOString()
    });

    const newUserDoc = await docRef.get();
    const newUser = { id: newUserDoc.id, ...newUserDoc.data() };

    res.status(201).json({
      success: true,
      data: formatUser(newUser)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
