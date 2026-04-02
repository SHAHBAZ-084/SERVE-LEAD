const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SystemSetting = require('../models/SystemSetting');
const authMiddleware = require('../middlewares/authMiddleware');

const { createUpload, getFileUrl } = require('../utils/storage');

// Multer Config (Hybrid: Local/Cloud)
const upload = createUpload('team');

// Middleware to check if user is Superuser
const isSuperuser = async (req, res, next) => {
  if (req.user && req.user.role === 'Superuser') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Superuser only.' });
  }
};

// GET all public settings
router.get('/', async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST upload team image (SUPERUSER ONLY)
router.post('/upload', authMiddleware, isSuperuser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const imageUrl = getFileUrl(req.file, 'team');
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// PUT update or create settings (SUPERUSER ONLY)
router.put('/', authMiddleware, isSuperuser, async (req, res) => {
  try {
    const updates = req.body; // Expecting { key: value, ... }
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      const setting = await SystemSetting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
      results.push(setting);
    }

    res.json({ message: 'Settings updated successfully', settings: results });
  } catch (error) {
    console.error('Settings Update Error:', error);
    res.status(500).json({ error: 'Server Error during settings update' });
  }
});

module.exports = router;
