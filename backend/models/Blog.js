const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  images: [{ 
    url: { type: String, required: true },
    caption: { type: String, default: "" }
  }],
  published: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
