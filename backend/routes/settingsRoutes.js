const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SystemSetting = require('../models/SystemSetting');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddlewares');

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

function pickGroupUrl(live = {}, archived = {}, key) {
  const liveVal = String(live[key] || '').trim();
  if (liveVal) return liveVal;
  return String(archived[key] || '').trim();
}

async function upsertJsonSetting(key, obj) {
  return SystemSetting.findOneAndUpdate(
    { key },
    { $set: { key, value: JSON.stringify(obj && typeof obj === 'object' ? obj : {}) } },
    { upsert: true, new: true, runValidators: true }
  );
}

/** Resolve WA invite links for a member by province + gender + role targeting. */
function resolveWhatsAppLinks({
  province,
  gender,
  role,
  defaultLink,
  provinceGroups = {},
  genderGroups = {},
  roleGroups = {},
  archivedProvinceGroups = {},
  archivedGenderGroups = {},
  archivedRoleGroups = {},
}) {
  const links = [];
  const seen = new Set();
  const add = (key, label, url) => {
    const u = String(url || '').trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    links.push({ key, label, url: u });
  };

  if (defaultLink) {
    add('default', 'Society WhatsApp Group', defaultLink);
  }

  if (province) {
    const provinceUrl = pickGroupUrl(provinceGroups, archivedProvinceGroups, province);
    if (provinceUrl) add('province', `${province} WhatsApp Group`, provinceUrl);
  }

  const g = String(gender || '').toLowerCase();
  if (g === 'male') {
    const maleUrl = pickGroupUrl(genderGroups, archivedGenderGroups, 'male');
    if (maleUrl) add('gender', 'Male WhatsApp Group', maleUrl);
  } else if (g === 'female') {
    const femaleUrl = pickGroupUrl(genderGroups, archivedGenderGroups, 'female');
    if (femaleUrl) add('gender', 'Female WhatsApp Group', femaleUrl);
  }

  const allUrl = pickGroupUrl(genderGroups, archivedGenderGroups, 'all');
  if (allUrl) {
    add('all', 'All Members WhatsApp Group', allUrl);
  }

  const r = String(role || '');
  if (r && r !== 'Admin' && r !== 'Superuser') {
    const roleKey = r === 'Executive' ? 'executive' : r === 'General' ? 'general' : '';
    if (roleKey) {
      const roleUrl = pickGroupUrl(roleGroups, archivedRoleGroups, roleKey);
      if (roleUrl) {
        add('role', `${r} WhatsApp Group`, roleUrl);
      }
    }
  }

  return links;
}

function loadWhatsAppGroupMaps(settingsMap) {
  return {
    groups: parseJsonSetting(settingsMap.whatsapp_groups_by_province, {}),
    genderGroups: parseJsonSetting(settingsMap.whatsapp_groups_by_gender, {
      male: '',
      female: '',
      all: '',
    }),
    roleGroups: parseJsonSetting(settingsMap.whatsapp_groups_by_role, {
      general: '',
      executive: '',
    }),
    archivedProvinceGroups: parseJsonSetting(settingsMap.whatsapp_groups_by_province_archived, {}),
    archivedGenderGroups: parseJsonSetting(settingsMap.whatsapp_groups_by_gender_archived, {}),
    archivedRoleGroups: parseJsonSetting(settingsMap.whatsapp_groups_by_role_archived, {}),
  };
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
    const full = String(req.query.full || '') === '1' || String(req.query.full || '').toLowerCase() === 'true';
    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      if (s.key) settingsMap[s.key] = s.value;
    });

    const {
      groups,
      genderGroups,
      roleGroups,
      archivedProvinceGroups,
      archivedGenderGroups,
      archivedRoleGroups,
    } = loadWhatsAppGroupMaps(settingsMap);

    // Fallback default from legacy findOne document field OR key-value if present
    const legacyDoc = settings.find((s) => s.whatsappGroupLink) || settings[0];
    const defaultLink =
      settingsMap.whatsappGroupLink ||
      legacyDoc?.whatsappGroupLink ||
      '';

    const role = req.query.role;
    const defaultUrl = String(defaultLink || '').trim();
    // Public apply / settings editor: only the society default. Matching groups are /my-whatsapp-groups.
    const links = full
      ? resolveWhatsAppLinks({
          province,
          gender,
          role,
          defaultLink: defaultUrl,
          provinceGroups: groups,
          genderGroups,
          roleGroups,
          archivedProvinceGroups,
          archivedGenderGroups,
          archivedRoleGroups,
        })
      : (defaultUrl ? [{ key: 'default', label: 'Society WhatsApp Group', url: defaultUrl }] : []);

    res.json({
      link: defaultUrl,
      defaultLink: defaultUrl,
      links,
      groups,
      genderGroups,
      roleGroups,
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
      .select('province gender role status')
      .lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (member.status !== 'approved') {
      return res.json({
        links: [],
        province: member.province || '',
        gender: member.gender || '',
        role: member.role || '',
      });
    }

    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      if (s.key) settingsMap[s.key] = s.value;
    });

    const {
      groups,
      genderGroups,
      roleGroups,
      archivedProvinceGroups,
      archivedGenderGroups,
      archivedRoleGroups,
    } = loadWhatsAppGroupMaps(settingsMap);
    const legacyDoc = settings.find((s) => s.whatsappGroupLink) || settings[0];
    const defaultLink =
      settingsMap.whatsappGroupLink ||
      legacyDoc?.whatsappGroupLink ||
      '';

    const links = resolveWhatsAppLinks({
      province: member.province,
      gender: member.gender,
      role: member.role,
      defaultLink,
      provinceGroups: groups,
      genderGroups,
      roleGroups,
      archivedProvinceGroups,
      archivedGenderGroups,
      archivedRoleGroups,
    });

    res.json({
      links,
      province: member.province || '',
      gender: member.gender || '',
      role: member.role || '',
    });
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
    const { link, groups, genderGroups, roleGroups, whatsapp_groups_by_role } = req.body;
    if (link !== undefined) {
      await SystemSetting.findOneAndUpdate({}, { whatsappGroupLink: link }, { upsert: true });
    }
    if (groups !== undefined && groups !== null && typeof groups === 'object') {
      await upsertJsonSetting('whatsapp_groups_by_province', groups);
    }
    if (genderGroups !== undefined && genderGroups !== null && typeof genderGroups === 'object') {
      const normalized = {
        male: String(genderGroups.male || '').trim(),
        female: String(genderGroups.female || '').trim(),
        all: String(genderGroups.all || '').trim(),
      };
      await upsertJsonSetting('whatsapp_groups_by_gender', normalized);
    }
    let incomingRoleGroups = roleGroups;
    if (incomingRoleGroups == null && whatsapp_groups_by_role) {
      incomingRoleGroups = parseJsonSetting(whatsapp_groups_by_role, null);
    }
    if (incomingRoleGroups !== undefined && incomingRoleGroups !== null && typeof incomingRoleGroups === 'object') {
      const normalizedRoles = {
        general: String(incomingRoleGroups.general || '').trim(),
        executive: String(incomingRoleGroups.executive || '').trim(),
      };
      await upsertJsonSetting('whatsapp_groups_by_role', normalizedRoles);
    }
    res.json({ message: "WhatsApp link updated successfully." });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

const WA_GROUP_KEY_MAP = {
  province: { live: 'whatsapp_groups_by_province', archived: 'whatsapp_groups_by_province_archived' },
  gender: { live: 'whatsapp_groups_by_gender', archived: 'whatsapp_groups_by_gender_archived' },
  role: { live: 'whatsapp_groups_by_role', archived: 'whatsapp_groups_by_role_archived' },
};

router.delete('/whatsapp-link/:groupKey', authMiddleware, async (req, res) => {
  try {
    const rawKey = decodeURIComponent(req.params.groupKey || '');
    const colon = rawKey.indexOf(':');
    const kind = colon === -1 ? rawKey : rawKey.slice(0, colon);
    const itemKey = colon === -1 ? '' : rawKey.slice(colon + 1);
    const mode = req.body?.mode;
    if (!['remove_now', 'keep_existing'].includes(mode)) {
      return res.status(400).json({ error: "mode must be 'remove_now' or 'keep_existing'." });
    }
    const mapping = WA_GROUP_KEY_MAP[kind];
    if (!mapping || !itemKey) {
      return res.status(400).json({ error: 'Invalid groupKey. Use province:<name>, gender:male|female|all, or role:general|executive.' });
    }

    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach((s) => {
      if (s.key) settingsMap[s.key] = s.value;
    });

    const live = parseJsonSetting(settingsMap[mapping.live], {});
    const archived = parseJsonSetting(settingsMap[mapping.archived], {});
    const value = live[itemKey];

    if (mode === 'keep_existing') {
      if (value) archived[itemKey] = value;
      delete live[itemKey];
    } else {
      delete live[itemKey];
      delete archived[itemKey];
    }

    await upsertJsonSetting(mapping.live, live);
    await upsertJsonSetting(mapping.archived, archived);

    const maps = loadWhatsAppGroupMaps({
      ...settingsMap,
      [mapping.live]: JSON.stringify(live),
      [mapping.archived]: JSON.stringify(archived),
    });

    res.json({
      message: mode === 'remove_now'
        ? 'Group removed. Members lose access immediately.'
        : 'Removed from settings. Existing members keep the link.',
      groups: maps.groups,
      genderGroups: maps.genderGroups,
      roleGroups: maps.roleGroups,
    });
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

// Digital Solutions contact (public GET / admin PUT)
router.get('/digital-solutions-contact', async (req, res) => {
  try {
    const emailSetting = await SystemSetting.findOne({ key: 'digital_solutions_email' });
    const whatsappSetting = await SystemSetting.findOne({ key: 'digital_solutions_whatsapp' });
    res.json({
      email: emailSetting?.value || '',
      whatsapp: whatsappSetting?.value || '',
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.put('/digital-solutions-contact', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { email, whatsapp } = req.body;
    await SystemSetting.findOneAndUpdate(
      { key: 'digital_solutions_email' },
      { $set: { key: 'digital_solutions_email', value: String(email ?? '') } },
      { upsert: true, new: true, runValidators: true }
    );
    await SystemSetting.findOneAndUpdate(
      { key: 'digital_solutions_whatsapp' },
      { $set: { key: 'digital_solutions_whatsapp', value: String(whatsapp ?? '') } },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ message: 'Digital Solutions contact updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});


module.exports = router;
