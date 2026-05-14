const express = require('express');
const router = express.Router();
const Member = require('../../models/Member');
const Event = require('../../models/Event');
const Counter = require('../../models/Counter');
const Log = require('../../models/Log');
const Announcement = require('../../models/Announcement');
const Certificate = require('../../models/Certificate');
const EventCertificate = require('../../models/EventCertificate');
const SystemSetting = require('../../models/SystemSetting');
const Task = require('../../models/Task');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isSuperuser } = require('../../middlewares/adminMiddlewares');
const logActivity = require('../../utils/activityLogger');

// GET Full Database Backup JSON (Superuser only)
router.get('/backup', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const backup = {
        members: await Member.find().select('-password').lean(),
        events: await Event.find().lean(),
        counters: await Counter.find().lean(),
        logs: await Log.find().lean(),
        announcements: await Announcement.find().lean(),
        certificates: await Certificate.find().lean(),
        eventCertificates: await EventCertificate.find().lean(),
        systemSettings: await SystemSetting.find().lean(),
        tasks: await Task.find().lean(),
        backupDate: new Date().toISOString(),
        version: "1.0"
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="Full_DB_Backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
    logActivity(req.user.memberId, 'SYSTEM_BACKUP', 'Full database snapshot downloaded');
}));

module.exports = router;
