const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Info', 'Urgent', 'Success'],
    default: 'Info',
  },
  created_by: {
    type: String,
    default: 'Admin',
  },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
