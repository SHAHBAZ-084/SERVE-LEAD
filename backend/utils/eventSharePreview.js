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

const formatTime = (time) => {
  if (!time) return 'TBA';
  const [h, m] = String(time).split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${String(m || '00').padStart(2, '0')} ${suffix}`;
};

const dateBadge = (d) => {
  if (!d) return 'TBA';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const renderEventSharePreview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).send('Event not found');
    const event = await Event.findOne({ _id: req.params.id, is_active: true }).lean();
    if (!event) return res.status(404).send('Event not found');

    const joinUrl = `${FRONTEND()}/events/${event._id}`;
    const pageUrl = `${API_HOST()}/share/event/${event._id}`;
    const image = absoluteImage(event.image_url);
    const title = event.title || 'Serve & Lead Society Event';
    const dateLabel = formatDate(event.date);
    const endLabel = event.endDate && new Date(event.endDate).toDateString() !== new Date(event.date).toDateString()
      ? ` – ${formatDate(event.endDate)}`
      : '';
    const timeLabel = formatTime(event.time);
    const venue = event.location || 'TBA';
    const description = event.description || '';
    const ogDescription = `${dateLabel}${endLabel} · ${timeLabel} · ${venue}`.slice(0, 180);
    const endStamp = new Date(`${new Date(event.endDate || event.date).toISOString().split('T')[0]}T${event.time || '23:59'}:00`);
    const isLive = Date.now() < endStamp.getTime();

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=120');
    res.set('Content-Security-Policy', "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https://fonts.gstatic.com; frame-ancestors 'none'");
    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Serve &amp; Lead Society</title>
  <meta name="description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Serve &amp; Lead Society" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="canonical" href="${escapeHtml(joinUrl)}" />
</head>
<body style="margin:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
  <div style="max-width:480px;margin:24px auto;padding:0 16px 40px;">
    <p style="text-align:center;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#0891b2;margin:0 0 16px;">Serve &amp; Lead Society</p>
    <div style="background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 20px 50px rgba(15,23,42,0.08);">
      <div style="position:relative;background:#0f172a;">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />
        <div style="position:absolute;top:18px;left:18px;background:rgba(255,255,255,0.94);padding:8px 14px;border-radius:14px;font-size:12px;font-weight:800;">${escapeHtml(dateBadge(event.date))}</div>
        ${isLive ? '<div style="position:absolute;top:18px;right:18px;background:#06b6d4;color:#fff;padding:8px 12px;border-radius:12px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">Live</div>' : ''}
      </div>
      <div style="padding:28px 24px 32px;">
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;letter-spacing:-0.03em;">${escapeHtml(title)}</h1>
        ${description ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#475569;white-space:pre-wrap;">${escapeHtml(description)}</p>` : ''}
        <div style="background:#f8fafc;border-radius:18px;padding:16px;margin-bottom:12px;border:1px solid #f1f5f9;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Date</p>
          <p style="margin:0;font-size:14px;font-weight:700;">${escapeHtml(dateLabel + endLabel)}</p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:24px;">
          <div style="flex:1;background:#f8fafc;border-radius:18px;padding:16px;border:1px solid #f1f5f9;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Time</p>
            <p style="margin:0;font-size:14px;font-weight:700;">${escapeHtml(timeLabel)}</p>
          </div>
          <div style="flex:1;background:#f8fafc;border-radius:18px;padding:16px;border:1px solid #f1f5f9;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Venue</p>
            <p style="margin:0;font-size:14px;font-weight:700;">${escapeHtml(venue)}</p>
          </div>
        </div>
        <a href="${escapeHtml(joinUrl)}" style="display:block;text-align:center;background:#002147;color:#ffffff;text-decoration:none;padding:16px 20px;border-radius:16px;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">Join this event</a>
      </div>
    </div>
  </div>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('Unable to load event');
  }
};

module.exports = { renderEventSharePreview };
