const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendContactEmail } = require('../utils/emailService');

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 contact requests per windowMs
    message: { error: 'Too many inquiries sent from this IP. Please try again after 15 minutes.' }
});

const { validateRequest, schemas } = require('../middlewares/validationMiddleware');

// POST /api/contact - Handle Homepage Inquiries
router.post('/', contactLimiter, validateRequest(schemas.contact), async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Please provide all details (Name, Email, Message).' });
    }

    const { success } = await sendContactEmail(name, email, message);

    if (!success) {
      return res.status(500).json({ error: 'Failed to dispatch email. Please try again later.' });
    }

    res.status(200).json({ message: 'Message delivered successfully! We will contact you soon.' });
  } catch (error) {
    console.error('Contact Route Error:', error);
    res.status(500).json({ error: 'Server error during inquiry submission.' });
  }
});

module.exports = router;
