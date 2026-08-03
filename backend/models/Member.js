const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  member_id: {
    type: String,
    unique: true,
    sparse: true, // sparse because it can be null initially
  },
  serial_number: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  joining_year: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ['General', 'Executive', 'Admin', 'Superuser'],
    default: 'General',
    index: true,
  },
  requestedRole: {
    type: String,
    enum: ['General', 'Executive'],
    default: 'General',
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'fee_pending', 'approved', 'blocked', 'rejected'],
    default: 'pending',
    index: true,
  },
  interview_called: {
    type: Boolean,
    default: false,
  },
  interviewDetails: {
    venue: { type: String, default: '' },
    message: { type: String, default: '' },
    dressCode: { type: String, default: '' },
    arrivalTime: { type: String, default: '' },
    guideNotes: { type: String, default: '' },
    focusAreas: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
  },
  interviewResult: {
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
    note: { type: String, default: '' },
    updatedAt: { type: Date },
    updatedBy: { type: String, default: '' },
  },
  feeStatus: {
    type: String,
    enum: ['not_requested', 'requested', 'submitted', 'verified', 'waived'],
    default: 'not_requested',
  },
  feePayment: {
    transactionId: { type: String, default: '' },
    paymentChannel: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: '' },
    waivedAt: { type: Date },
    waivedBy: { type: String, default: '' },
    waivedReason: { type: String, default: '' },
    amount: { type: Number },
    deadline: { type: Date },
    validityMonths: { type: Number },
    requestedChannels: { type: mongoose.Schema.Types.Mixed, default: [] },
    adminMessage: { type: String, default: '' },
  },
  membershipValidUntil: { type: Date },
  profile_pic_url: {
    type: String,
  },
  certificate_url: {
    type: String,
  },
  father_name: {
    type: String,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', ''],
    default: '',
  },
  whatsapp: {
    type: String,
  },
  education_level: {
    type: String,
    enum: ['Matric', 'Inter', 'Bachelor', 'Master', 'PhD', 'Other'],
  },
  /** Who is registering: university / college / school student, or not a student */
  applicant_type: {
    type: String,
    enum: ['university', 'college', 'school', 'not_student'],
    default: 'university',
  },
  program: {
    type: String,
  },
  passing_year: {
    type: String,
  },
  university: {
    type: String,
  },
  /** Free-text school/college/workplace when not using university list */
  institution_name: {
    type: String,
    default: '',
  },
  occupation: {
    type: String,
    default: '',
  },
  address: {
    type: String,
  },
  province: {
    type: String,
  },
  district: {
    type: String,
  },
  tehsil: {
    type: String,
  },
  city: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  sls_official_id: { type: String, default: "" },
  cnic_number:     { type: String, default: "" },
  certificateIssuedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);
