const Log = require('../models/Log');
const Member = require('../models/Member');

const logActivity = async (adminId, action, details, targetId = null) => {
    try {
        const admin = await Member.findById(adminId).select('name');
        if (!admin) return;

        await Log.create({
            admin_id: adminId,
            admin_name: admin.name,
            action,
            details,
            target_id: targetId
        });
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
};

module.exports = logActivity;
