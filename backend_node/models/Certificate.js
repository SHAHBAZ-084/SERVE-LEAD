const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null, // Optional, since some might be general appreciation
  },
  category: {
    type: String,
    required: true,
    enum: ['Appreciation', 'Achievement', 'Participation', 'Excellence', 'Other'],
  },
  title: {
    type: String,
    default: 'CERTIFICATE OF MEMBERSHIP',
  },
  awardType: {
    type: String,
    default: 'Official Membership',
  },
  customCategory: {
    type: String,
    // Required only if category is 'Other'
  },
  description: {
    type: String,
    required: false,
  },
  chairmanName: {
    type: String,
    required: true,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member', // Admin who issued it
    required: true,
  },
}, { timestamps: true });

// Ensure unique certificate per user per event, if it's tied to an event. 
// If it's a general certificate, this index wouldn't strictly prevent duplicates, 
// which might be desired (e.g. general appreciation given multiple times over years),
// but we'll leave it out for flexibility and handle duplicates cleanly if needed.

module.exports = mongoose.model('Certificate', certificateSchema);
