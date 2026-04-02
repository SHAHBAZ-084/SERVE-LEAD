const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
  },
  image_url: {
    type: String,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  time: {
    type: String,
  },
  participants: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    attended: {
      type: Boolean,
      default: false
    }
  }],
}, { timestamps: true });

// Pre-save middleware to generate slug
eventSchema.pre('save', function () {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
});

module.exports = mongoose.model('Event', eventSchema);
