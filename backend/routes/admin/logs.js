const express = require('express');
const router = express.Router();
const Log = require('../../models/Log');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isSuperuser } = require('../../middlewares/adminMiddlewares');

// GET Logs Export CSV (Superuser only)
router.get('/logs/export', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const logs = await Log.find()
        .populate('target_id', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    const headers = ['Timestamp', 'Administrator', 'Action', 'Details', 'Target'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
        let targetStr = '';
        if (log.target_id) {
            targetStr = log.target_id.name || log.target_id.email || log.target_id._id || log.target_id;
            targetStr = targetStr.toString().replace(/"/g, '""');
        }
        
        const detailsStr = (log.details || '').replace(/"/g, '""');
        
        const row = [
            `"${new Date(log.createdAt).toISOString()}"`,
            `"${log.admin_name || 'System'}"`,
            `"${log.action || ''}"`,
            `"${detailsStr}"`,
            `"${targetStr}"`
        ];
        csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="system_audit_logs.csv"');
    res.send(csvRows.join('\n'));
}));

// GET Logs (Superuser only)
router.get('/logs', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;

    const logs = await Log.find()
        .populate('target_id', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();
    
    const count = await Log.countDocuments();
    res.json({ logs, totalPages: Math.ceil(count / limit), currentPage: page });
}));

module.exports = router;
