const express = require('express');
const router = express.Router();
const Member = require('../../models/Member');
const Event = require('../../models/Event');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isAdmin } = require('../../middlewares/adminMiddlewares');

// GET Dashboard stats
router.get('/dashboard', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const [totalMembers, pendingMembers, totalAdmin, totalEvents, activeEvents] = await Promise.all([
        Member.countDocuments({ status: 'approved', role: 'General' }),
        Member.countDocuments({ status: 'pending' }),
        Member.countDocuments({ role: 'Admin', status: 'approved' }),
        Event.countDocuments(),
        Event.countDocuments({ is_active: true })
    ]);

    const resObj = {
        total_members: totalMembers,
        pending_members: pendingMembers,
        total_events: totalEvents,
        active_events: activeEvents,
    };

    if (req.user.role === 'Superuser') resObj.total_admins = totalAdmin;
    res.json(resObj);
}));

module.exports = router;
