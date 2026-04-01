const mongoose = require('mongoose');

const eventCertificateSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  certificate_url: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Ensure unique certificate per user per event
eventCertificateSchema.index({ event: 1, member: 1 }, { unique: true });

module.exports = mongoose.model('EventCertificate', eventCertificateSchema);
