const Event = require('../models/Event');
const mongoose = require('mongoose');

const FRONTEND = () => process.env.FRONTEND_URL || 'https://serveandlead.org';
const API_HOST = () => process.env.API_PUBLIC_URL || 'https://api.serveandlead.org';

const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const absoluteImage = (imageUrl) => {
  if (!imageUrl) return `${FRONTEND()}/logo.png`;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${API_HOST()}${path}`;
};

const formatDate = (d) => {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const renderEventSharePreview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Event not found');
    const event = await Event.findOne({ _id: req.params.id, is_active: true }).lean();
    if (!event) return res.status(404).send('Event not found');

    const joinUrl = `${FRONTEND()}/events/${event._id}`;
    const image = absoluteImage(event.image_url);
    const dateLabel = formatDate(event.date);
    const title = event.title || 'Serve & Lead Society Event';
    const description = [
      event.description,
      `Date: ${dateLabel}`,
      `Time: ${event.time || 'TBA'}`,
      `Venue: ${event.location || 'TBA'}`,
    ].filter(Boolean).join(' · ').slice(0, 300);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(joinUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(joinUrl)}" />
  <link rel="canonical" href="${escapeHtml(joinUrl)}" />
</head>
<body>
  <p>Opening <a href="${escapeHtml(joinUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('Unable to load event');
  }
};

module.exports = { renderEventSharePreview };
