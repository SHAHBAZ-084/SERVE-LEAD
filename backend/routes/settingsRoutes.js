const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SystemSetting = require('../models/SystemSetting');
const authMiddleware = require('../middlewares/authMiddleware');

const FOOTER_DEFAULTS = {
  footer_email: 'serveandleadsociety@serveandlead.org',
  footer_address: 'Ghoray Shah Road Near UET Lahore',
  footer_phone1: '0314-1683402',
  footer_phone2: '0325-6604404',
  footer_copyright: '© 2025 Serve & Lead Society. All rights reserved.',
  footer_org_name: 'Serve & Lead Society',
  footer_developer_credits: 'Designed & Built by Shahbaz & Ali',
  footer_extra_text:
    'Building a strong community of motivated individuals who learn, serve, and lead for a better future.',
};

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
    Object.entries(FOOTER_DEFAULTS).forEach(([key, value]) => {
      if (settingsMap[key] === undefined || settingsMap[key] === null) {
        settingsMap[key] = value;
      }
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
        { $set: { key, value: String(value ?? '') } },
        { upsert: true, new: true, runValidators: true }
      );
      results.push(setting);
    }

    res.json({ message: 'Settings updated successfully', settings: results });
  } catch (error) {
    console.error('Settings Update Error:', error);
    res.status(500).json({ error: 'Server Error during settings update' });
  }
});

// Add a GET route (public) to fetch the link:
router.get('/whatsapp-link', async (req, res) => {
  try {
    const setting = await SystemSetting.findOne();
    res.json({ link: setting?.whatsappGroupLink || "" });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/terms', async (req, res) => {
  try {
    const setting = await SystemSetting.findOne();
    res.json({ terms: setting?.termsAndConditions || "" });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});


// Add a PUT route (admin only) to update it:
router.put('/whatsapp-link', authMiddleware, async (req, res) => {
  try {
    const { link } = req.body;
    await SystemSetting.findOneAndUpdate({}, { whatsappGroupLink: link }, { upsert: true });
    res.json({ message: "WhatsApp link updated successfully." });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.put('/terms', authMiddleware, async (req, res) => {
  try {
    const { terms } = req.body;
    await SystemSetting.findOneAndUpdate({}, { termsAndConditions: terms }, { upsert: true });
    res.json({ message: "Terms updated successfully." });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});


module.exports = router;
