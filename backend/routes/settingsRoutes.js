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

const ABOUT_DEFAULTS = {
  about_badge: 'Who We Are',
  about_title: 'About Us',
  about_subtitle: 'Building Leaders Through Service and Growth.',
  about_section_heading: 'Advantages',
  about_paragraph_1:
    'Our vision is to empower students by creating a dynamic platform where potential meets opportunity. We are dedicated to providing meaningful internships, job placements, and career counseling sessions that guide students toward success and self-discovery. Beyond professional growth, we are equally committed to student welfare — supporting deserving individuals by helping with university fees, ensuring that no financial challenge hinders their educational journey.',
  about_paragraph_2:
    'In addition, we aim to organize industrial tours and educational trips that bridge the gap between academic learning and practical experience, inspiring students to explore, learn, and grow beyond the classroom. Through these collective efforts, we aspire to cultivate a generation of capable, confident, and compassionate students who not only achieve personal success but also contribute positively to the community around them.',
  about_tags: 'Internships, Career Counseling, Welfare Support, Industrial Tours, Leadership',
};

const { createUpload, getFileUrl } = require('../utils/storage');

function parseJsonSetting(raw, fallback = {}) {
  if (!raw) return fallback;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/** Resolve WA invite links for a member by province + gender targeting. */
function resolveWhatsAppLinks({ province, gender, defaultLink, provinceGroups = {}, genderGroups = {} }) {
  const links = [];
  const seen = new Set();
  const add = (key, label, url) => {
    const u = String(url || '').trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    links.push({ key, label, url: u });
  };

  if (province && provinceGroups[province]) {
    add('province', `${province} WhatsApp Group`, provinceGroups[province]);
  }

  const g = String(gender || '').toLowerCase();
  if (g === 'male' && genderGroups.male) {
    add('gender', 'Male WhatsApp Group', genderGroups.male);
  } else if (g === 'female' && genderGroups.female) {
    add('gender', 'Female WhatsApp Group', genderGroups.female);
  }

  if (genderGroups.all) {
    add('all', 'All Members WhatsApp Group', genderGroups.all);
  }

  if (!links.length && defaultLink) {
    add('default', 'WhatsApp Group', defaultLink);
  }

  return links;
}

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
    Object.entries(ABOUT_DEFAULTS).forEach(([key, value]) => {
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
    const province = req.query.province;
    const gender = req.query.gender;
    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      if (s.key) settingsMap[s.key] = s.value;
    });

    const groups = parseJsonSetting(settingsMap.whatsapp_groups_by_province, {});
    const genderGroups = parseJsonSetting(settingsMap.whatsapp_groups_by_gender, {
      male: '',
      female: '',
      all: '',
    });

    // Fallback default from legacy findOne document field OR key-value if present
    const legacyDoc = settings.find((s) => s.whatsappGroupLink) || settings[0];
    const defaultLink =
      settingsMap.whatsappGroupLink ||
      legacyDoc?.whatsappGroupLink ||
      '';

    const links = resolveWhatsAppLinks({
      province,
      gender,
      defaultLink,
      provinceGroups: groups,
      genderGroups,
    });

    res.json({
      link: links[0]?.url || '',
      links,
      groups,
      genderGroups,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

/** Authenticated: WA groups that apply to the logged-in member's province + gender */
router.get('/my-whatsapp-groups', authMiddleware, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const member = await Member.findById(req.user.memberId || req.user.id)
      .select('province gender')
      .lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      if (s.key) settingsMap[s.key] = s.value;
    });

    const groups = parseJsonSetting(settingsMap.whatsapp_groups_by_province, {});
    const genderGroups = parseJsonSetting(settingsMap.whatsapp_groups_by_gender, {
      male: '',
      female: '',
      all: '',
    });
    const legacyDoc = settings.find((s) => s.whatsappGroupLink) || settings[0];
    const defaultLink =
      settingsMap.whatsappGroupLink ||
      legacyDoc?.whatsappGroupLink ||
      '';

    const links = resolveWhatsAppLinks({
      province: member.province,
      gender: member.gender,
      defaultLink,
      provinceGroups: groups,
      genderGroups,
    });

    res.json({ links, province: member.province || '', gender: member.gender || '' });
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
    const { link, groups, genderGroups } = req.body;
    if (link !== undefined) {
      await SystemSetting.findOneAndUpdate({}, { whatsappGroupLink: link }, { upsert: true });
    }
    if (groups !== undefined && groups !== null && typeof groups === 'object') {
      await SystemSetting.findOneAndUpdate(
        { key: 'whatsapp_groups_by_province' },
        { $set: { key: 'whatsapp_groups_by_province', value: JSON.stringify(groups) } },
        { upsert: true, new: true, runValidators: true }
      );
    }
    if (genderGroups !== undefined && genderGroups !== null && typeof genderGroups === 'object') {
      const normalized = {
        male: String(genderGroups.male || '').trim(),
        female: String(genderGroups.female || '').trim(),
        all: String(genderGroups.all || '').trim(),
      };
      await SystemSetting.findOneAndUpdate(
        { key: 'whatsapp_groups_by_gender' },
        { $set: { key: 'whatsapp_groups_by_gender', value: JSON.stringify(normalized) } },
        { upsert: true, new: true, runValidators: true }
      );
    }
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
