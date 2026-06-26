const express = require('express');

const router = express.Router();

const Member = require('../models/Member');

const FeeRecord = require('../models/FeeRecord');

const SystemSetting = require('../models/SystemSetting');

const authMiddleware = require('../middlewares/authMiddleware');

const { isAdmin } = require('../middlewares/adminMiddlewares');

const asyncHandler = require('../middlewares/asyncHandler');

const { createUpload, getFileUrl } = require('../utils/storage');

const {

    sendFeeRequestedEmail,

    sendFeeRejectedEmail,

    sendFeeWaivedEmail,

    sendFeeVerifiedEmail,

} = require('../utils/emailService');



const feeUpload = createUpload('fees', 8 * 1024 * 1024);



const getSettingValue = async (key, fallback = '') => {

    const doc = await SystemSetting.findOne({ key });

    return doc?.value ?? fallback;

};



const parseChannels = (raw) => {

    try {

        const parsed = JSON.parse(raw || '[]');

        return Array.isArray(parsed) ? parsed : [];

    } catch {

        return [];

    }

};



const createFeeRecord = async ({

    recordType = 'membership_fee',

    member,

    admin,

    action,

    amount,

    paymentChannel = '',

    transactionId = '',

    screenshotUrl = '',

    note = '',

    donorName = '',

}) => FeeRecord.create({

    recordType,

    memberId: member?._id,

    memberName: member?.name || donorName || '',

    member_id_str: member?.member_id || member?.email || donorName || '',

    donorName,

    adminId: admin?._id,

    adminName: admin?.name || (action === 'fee_submitted' ? member?.name : 'System'),

    action,

    amount,

    paymentChannel,

    transactionId,

    screenshotUrl,

    note,

});



const getAdminActor = async (req) => {

    const admin = await Member.findById(req.user.memberId).select('name member_id role');

    if (!admin) {

        const err = new Error('Admin account not found.');

        err.status = 404;

        throw err;

    }

    return admin;

};



const resolveFeeDeadline = async (bodyDeadline) => {

    if (bodyDeadline) {

        const d = new Date(bodyDeadline);

        if (!Number.isNaN(d.getTime()) && d > new Date()) return d;

    }

    const defaultDays = parseInt(await getSettingValue('default_fee_deadline_days', '7'), 10) || 7;

    const deadline = new Date();

    deadline.setDate(deadline.getDate() + defaultDays);

    deadline.setHours(23, 59, 59, 999);

    return deadline;

};



// POST /api/fees/request/:memberId

router.post('/request/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const member = await Member.findById(req.params.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found' });



    if (member.interviewResult?.status !== 'passed') {

        return res.status(400).json({ error: 'Fee can only be requested after the member has passed the interview.' });

    }

    if (!['pending', 'fee_pending'].includes(member.status)) {

        return res.status(400).json({ error: 'Member is not eligible for a fee request.' });

    }

    if (member.feeStatus !== 'not_requested') {

        return res.status(400).json({ error: 'Fee has already been requested for this member.' });

    }



    const bodyAmount = Number(req.body.amount);

    const defaultAmount = Number(await getSettingValue('membership_fee', '0')) || 0;

    const amount = bodyAmount > 0 ? bodyAmount : defaultAmount;

    if (!amount || amount <= 0) {

        return res.status(400).json({ error: 'A valid membership fee amount is required.' });

    }



    const defaultMonths = parseInt(await getSettingValue('membership_validity_months', '12'), 10) || 12;

    const validityMonths = Number(req.body.validityMonths) > 0 ? Number(req.body.validityMonths) : defaultMonths;



    const deadline = await resolveFeeDeadline(req.body.deadline);

    const admin = await getAdminActor(req);



    let channels = Array.isArray(req.body.channels) ? req.body.channels : [];

    if (!channels.length) {

        const channelsRaw = await getSettingValue('membership_fee_channels', '[]');

        channels = parseChannels(channelsRaw);

        if (!channels.length) {

            channels = parseChannels(await getSettingValue('donation_channels', '[]'));

        }

    }



    const adminMessage = (req.body.message || '').trim();



    member.feeStatus = 'requested';

    member.status = 'fee_pending';

    member.feePayment = member.feePayment || {};

    member.feePayment.amount = amount;

    member.feePayment.deadline = deadline;

    member.feePayment.validityMonths = validityMonths;

    member.feePayment.requestedChannels = channels;

    member.feePayment.adminMessage = adminMessage;

    await member.save();



    await createFeeRecord({

        member,

        admin,

        action: 'fee_requested',

        amount,

        note: `Deadline: ${deadline.toISOString()} | Validity: ${validityMonths}mo`,

    });



    sendFeeRequestedEmail(

        member.email,

        member.name,

        amount,

        channels,

        deadline,

        validityMonths,

        adminMessage

    ).catch(console.error);



    res.json({ message: 'Fee request sent', amount, deadline, validityMonths });

}));



// POST /api/fees/request-again/:memberId — updated amount / send more fee (clears prior proof)

router.post('/request-again/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const member = await Member.findById(req.params.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found' });



    if (member.interviewResult?.status !== 'passed') {

        return res.status(400).json({ error: 'Fee can only be re-requested after the member has passed the interview.' });

    }

    if (!['pending', 'fee_pending'].includes(member.status)) {

        return res.status(400).json({ error: 'Member is not eligible for a fee re-request.' });

    }

    if (!['requested', 'submitted'].includes(member.feeStatus)) {

        return res.status(400).json({ error: 'Fee can only be re-requested when payment is pending or proof needs correction.' });

    }



    const previousAmount = member.feePayment?.amount ?? null;

    const bodyAmount = Number(req.body.amount);

    const defaultAmount = Number(await getSettingValue('membership_fee', '0')) || 0;

    const amount = bodyAmount > 0 ? bodyAmount : (previousAmount || defaultAmount);

    if (!amount || amount <= 0) {

        return res.status(400).json({ error: 'A valid membership fee amount is required.' });

    }



    const defaultMonths = parseInt(await getSettingValue('membership_validity_months', '12'), 10) || 12;

    const validityMonths = Number(req.body.validityMonths) > 0 ? Number(req.body.validityMonths) : (member.feePayment?.validityMonths || defaultMonths);

    const deadline = await resolveFeeDeadline(req.body.deadline);

    const admin = await getAdminActor(req);



    let channels = Array.isArray(req.body.channels) ? req.body.channels : [];

    if (!channels.length) {

        channels = member.feePayment?.requestedChannels?.length

            ? member.feePayment.requestedChannels

            : parseChannels(await getSettingValue('membership_fee_channels', '[]'));

    }



    const adminMessage = (req.body.message || '').trim();



    member.feeStatus = 'requested';

    member.status = 'fee_pending';

    member.feePayment = member.feePayment || {};

    member.feePayment.amount = amount;

    member.feePayment.deadline = deadline;

    member.feePayment.validityMonths = validityMonths;

    member.feePayment.requestedChannels = channels;

    member.feePayment.adminMessage = adminMessage;

    member.feePayment.transactionId = '';

    member.feePayment.paymentChannel = '';

    member.feePayment.accountNumber = '';

    member.feePayment.screenshotUrl = '';

    member.feePayment.submittedAt = undefined;

    await member.save();



    await createFeeRecord({

        member,

        admin,

        action: 'fee_requested',

        amount,

        note: `Re-request${previousAmount != null ? ` (was PKR ${previousAmount})` : ''}. Deadline: ${deadline.toISOString()}`,

    });



    sendFeeRequestedEmail(

        member.email,

        member.name,

        amount,

        channels,

        deadline,

        validityMonths,

        adminMessage,

        { isRetry: true, previousAmount }

    ).catch(console.error);



    res.json({ message: 'Updated fee request sent to member', amount, deadline, validityMonths });

}));



// POST /api/fees/waive/:memberId

router.post('/waive/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const { reason } = req.body;

    if (!reason?.trim() || reason.trim().length < 10) {

        return res.status(400).json({ error: 'A waiver reason of at least 10 characters is required.' });

    }



    const member = await Member.findById(req.params.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found' });



    if (member.interviewResult?.status !== 'passed') {

        return res.status(400).json({ error: 'Fee can only be waived after the member has passed the interview.' });

    }

    if (!['pending', 'fee_pending'].includes(member.status)) {

        return res.status(400).json({ error: 'Member is not eligible for fee waiver.' });

    }



    const admin = await getAdminActor(req);

    member.feeStatus = 'waived';

    member.status = 'fee_pending';

    member.feePayment = member.feePayment || {};

    member.feePayment.waivedAt = new Date();

    member.feePayment.waivedBy = admin.member_id || admin._id.toString();

    member.feePayment.waivedReason = reason.trim();

    await member.save();



    await createFeeRecord({

        member,

        admin,

        action: 'fee_waived',

        amount: member.feePayment.amount,

        note: reason.trim(),

    });



    sendFeeWaivedEmail(member.email, member.name, reason.trim()).catch(console.error);



    res.json({ message: 'Membership fee waived' });

}));



// POST /api/fees/submit

router.post('/submit', authMiddleware, feeUpload.single('screenshot'), asyncHandler(async (req, res) => {

    const member = await Member.findById(req.user.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found' });



    if (member.feeStatus !== 'requested') {

        return res.status(400).json({ error: 'Fee proof can only be submitted when a fee has been requested.' });

    }



    const deadline = member.feePayment?.deadline ? new Date(member.feePayment.deadline) : null;

    if (deadline && deadline < new Date()) {

        return res.status(400).json({ error: 'The payment deadline has passed. Please contact administration.' });

    }



    const { transactionId, paymentChannel, accountNumber } = req.body;

    if (!transactionId?.trim()) return res.status(400).json({ error: 'Transaction ID is required.' });

    if (!paymentChannel?.trim()) return res.status(400).json({ error: 'Payment channel is required.' });

    if (!accountNumber?.trim()) return res.status(400).json({ error: 'Sender account or phone number is required.' });

    if (!req.file) return res.status(400).json({ error: 'Payment screenshot is required.' });



    const screenshotUrl = getFileUrl(req.file, 'fees');

    member.feePayment = member.feePayment || {};

    member.feePayment.transactionId = transactionId.trim();

    member.feePayment.paymentChannel = paymentChannel.trim();

    member.feePayment.accountNumber = accountNumber.trim();

    member.feePayment.screenshotUrl = screenshotUrl;

    member.feePayment.submittedAt = new Date();

    member.feeStatus = 'submitted';

    await member.save();



    await createFeeRecord({

        member,

        admin: null,

        action: 'fee_submitted',

        amount: member.feePayment.amount,

        paymentChannel: paymentChannel.trim(),

        transactionId: transactionId.trim(),

        screenshotUrl,

    });



    res.json({ message: 'Fee proof submitted. Awaiting admin verification.' });

}));



// POST /api/fees/verify/:memberId

router.post('/verify/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const member = await Member.findById(req.params.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found' });



    if (!['submitted', 'waived'].includes(member.feeStatus)) {

        return res.status(400).json({ error: 'Only submitted or waived fee applications can be verified.' });

    }



    const admin = await getAdminActor(req);

    member.feePayment = member.feePayment || {};

    member.feePayment.verifiedAt = new Date();

    member.feePayment.verifiedBy = admin.member_id || admin._id.toString();

    member.feeStatus = 'verified';

    await member.save();



    await createFeeRecord({

        member,

        admin,

        action: 'fee_verified',

        amount: member.feePayment.amount,

        paymentChannel: member.feePayment.paymentChannel,

        transactionId: member.feePayment.transactionId,

        screenshotUrl: member.feePayment.screenshotUrl,

    });



    sendFeeVerifiedEmail(member.email, member.name).catch(console.error);



    res.json({ message: 'Fee verified. You can now approve this member.' });

}));



// POST /api/fees/reject/:memberId

router.post('/reject/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const { reason } = req.body;

    if (!reason?.trim()) return res.status(400).json({ error: 'Rejection reason is required.' });



    const member = await Member.findById(req.params.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found' });



    if (member.feeStatus !== 'submitted') {

        return res.status(400).json({ error: 'Only submitted fee proofs can be rejected.' });

    }



    const admin = await getAdminActor(req);

    member.feeStatus = 'requested';

    await member.save();



    await createFeeRecord({

        member,

        admin,

        action: 'fee_rejected',

        amount: member.feePayment?.amount,

        paymentChannel: member.feePayment?.paymentChannel,

        transactionId: member.feePayment?.transactionId,

        screenshotUrl: member.feePayment?.screenshotUrl,

        note: reason.trim(),

    });



    sendFeeRejectedEmail(member.email, member.name, reason.trim()).catch(console.error);



    res.json({ message: 'Fee submission rejected. Member notified.' });

}));



// POST /api/fees/donation — Admin logs a donation

router.post('/donation', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const { donorName, amount, paymentChannel, transactionId, note } = req.body;

    if (!donorName?.trim()) return res.status(400).json({ error: 'Donor name is required.' });

    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Valid donation amount is required.' });



    const admin = await getAdminActor(req);

    const record = await createFeeRecord({

        recordType: 'donation',

        member: null,

        admin,

        action: 'donation_received',

        amount: Number(amount),

        paymentChannel: paymentChannel?.trim() || '',

        transactionId: transactionId?.trim() || '',

        note: note?.trim() || '',

        donorName: donorName.trim(),

    });



    res.status(201).json({ message: 'Donation recorded', record });

}));



// GET /api/fees/records

router.get('/records', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    let { memberId, action, recordType, page = 1, limit = 20 } = req.query;

    page = parseInt(page, 10) || 1;

    limit = Math.min(parseInt(limit, 10) || 20, 100);



    const query = {};

    if (memberId) query.memberId = memberId;

    if (action) query.action = action;

    if (recordType === 'membership_fee') {
        query.$or = [{ recordType: 'membership_fee' }, { recordType: { $exists: false } }];
    } else if (recordType) {
        query.recordType = recordType;
    }



    const [records, total] = await Promise.all([

        FeeRecord.find(query)

            .populate('memberId', 'name member_id email')

            .sort({ createdAt: -1 })

            .limit(limit)

            .skip((page - 1) * limit)

            .lean(),

        FeeRecord.countDocuments(query),

    ]);



    res.json({

        records,

        total,

        totalPages: Math.ceil(total / limit) || 1,

        currentPage: page,

    });

}));



// GET /api/fees/my-fee

router.get('/my-fee', authMiddleware, asyncHandler(async (req, res) => {

    const member = await Member.findById(req.user.memberId)

        .select('feeStatus feePayment status interviewResult interviewDetails')

        .lean();

    if (!member) return res.status(404).json({ error: 'Member not found' });



    res.json({

        feeStatus: member.feeStatus || 'not_requested',

        feePayment: member.feePayment || {},

        amount: member.feePayment?.amount ?? null,

        deadline: member.feePayment?.deadline ?? null,

        validityMonths: member.feePayment?.validityMonths ?? null,

        requestedChannels: member.feePayment?.requestedChannels || [],

        adminMessage: member.feePayment?.adminMessage || '',

        status: member.status,

        interviewResult: member.interviewResult || { status: 'pending' },

        interviewDetails: member.interviewDetails || {},

    });

}));



const MEMBERSHIP_SETTING_KEYS = ['membership_fee', 'membership_fee_channels', 'membership_validity_months', 'default_fee_deadline_days'];



// PUT /api/fees/membership-settings — Admin can configure fee amount, channels, deadline

router.put('/membership-settings', authMiddleware, isAdmin, asyncHandler(async (req, res) => {

    const updates = {};

    for (const key of MEMBERSHIP_SETTING_KEYS) {

        if (req.body[key] !== undefined) updates[key] = String(req.body[key]);

    }

    if (!Object.keys(updates).length) {

        return res.status(400).json({ error: 'No valid membership settings provided.' });

    }

    for (const [key, value] of Object.entries(updates)) {

        await SystemSetting.findOneAndUpdate(

            { key },

            { $set: { key, value } },

            { upsert: true, new: true }

        );

    }

    res.json({ message: 'Membership payment settings updated', settings: updates });

}));



module.exports = router;


