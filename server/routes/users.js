const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');
const { formatUser } = require('../utils/formatter');

const router = express.Router();

// GET /api/users - List all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by created_at DESC
    users.sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      return tB - tA;
    });

    res.json({ success: true, data: users.map(formatUser) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users - Create a new user (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
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

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { email, phone, role } = req.body;
    const full_name = req.body.full_name || req.body.fullName;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    updateData.updated_at = new Date().toISOString();

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const user = { id: updatedDoc.id, ...updatedDoc.data() };

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE_USER',
      details: `Updated user: ${user.username}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: formatUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const username = doc.data().username;

    // Prevent deleting self
    if (doc.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    await docRef.delete();

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'DELETE_USER',
      details: `Deleted user: ${username}`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
