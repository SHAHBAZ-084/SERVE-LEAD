const mongoose = require('mongoose');

const executiveApplicationSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    unique: true,
  },
  memberName: { type: String, required: true },
  member_id_str: { type: String, required: true },
  name: { type: String, required: true },
  father_name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  mission_statement: { type: String, required: true, minlength: 50 },
  short_term_goals: { type: String, required: true, minlength: 30 },
  long_term_goals: { type: String, required: true, minlength: 30 },
  area_of_interest: { type: String, required: true },
  skills: { type: String, required: true },
  previous_volunteer_experience: { type: String, default: '' },
  why_executive: { type: String, required: true, minlength: 50 },
  availability: { type: Number, required: true, min: 1, max: 40 },
  linkedin_url: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  reviewedAt: { type: Date },
  reviewedBy: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ExecutiveApplication', executiveApplicationSchema);
