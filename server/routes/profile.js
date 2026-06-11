const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { formatUser } = require('../utils/formatter');

const router = express.Router();

// GET /api/profile - Get own profile
router.get('/', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: formatUser({ id: doc.id, ...doc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/profile - Update own profile
router.put('/', authenticate, async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.user.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { email, phone, avatar } = req.body;
    const full_name = req.body.full_name || req.body.fullName;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;
    updateData.updated_at = new Date().toISOString();

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'UPDATE_PROFILE',
      details: `Updated own profile`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, data: formatUser({ id: updatedDoc.id, ...updatedDoc.data() }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/profile/password - Change own password
router.put('/password', authenticate, async (req, res) => {
  try {
    const current_password = req.body.current_password || req.body.currentPassword;
    const new_password = req.body.new_password || req.body.newPassword;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const docRef = db.collection('users').doc(req.user.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = doc.data();

    const isMatch = bcrypt.compareSync(current_password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    await docRef.update({
      password: hashedPassword,
      updated_at: new Date().toISOString()
    });

    // Log activity
    await db.collection('activity_log').add({
      user_id: req.user.id,
      username: req.user.username,
      action: 'CHANGE_PASSWORD',
      details: `Changed own password`,
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
