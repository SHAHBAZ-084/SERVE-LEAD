const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true,
  },
  memberName: { type: String, required: true },
  member_id_str: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  adminName: { type: String, default: '' },
  action: {
    type: String,
    enum: ['fee_requested', 'fee_submitted', 'fee_verified', 'fee_rejected', 'fee_waived'],
    required: true,
  },
  amount: { type: Number },
  paymentChannel: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  screenshotUrl: { type: String, default: '' },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
