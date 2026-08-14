/**
 * Default zone coordinates tuned for SLS membership certificate layout
 * (2048×1436). Values sit on placeholder slots — not labels — to avoid overlap.
 * Admin can fine-tune in ZoneCalibrator after upload.
 */
function detectZones(imageWidth = 2048, imageHeight = 1436) {
  const W = imageWidth;
  const H = imageHeight;
  const ink = '#002147';
  const erase = '#F7F3EB';

  return {
    // Center hero name over "MEMBER NAME" placeholder
    name: {
      x: Math.round(W * 0.5),
      y: Math.round(H * 0.47),
      maxWidth: Math.round(W * 0.72),
      maxHeight: Math.round(H * 0.08),
      align: 'center',
      fontSize: Math.round(W * 0.031),
      color: ink,
      eraseColor: erase,
      eraseMode: 'none',
    },
    // Top-right date value (covers "Issued on: …" sample date)
    date: {
      x: Math.round(W * 0.92),
      y: Math.round(H * 0.105),
      maxWidth: Math.round(W * 0.28),
      maxHeight: Math.round(H * 0.035),
      align: 'right',
      fontSize: Math.round(W * 0.011),
      color: ink,
      eraseColor: erase,
      eraseMode: 'none',
      prefix: 'Issued on: ',
    },
    // Optional mobile line under name / above member info strip
    mobile: {
      x: Math.round(W * 0.5),
      y: Math.round(H * 0.545),
      maxWidth: Math.round(W * 0.4),
      maxHeight: Math.round(H * 0.03),
      align: 'center',
      fontSize: Math.round(W * 0.01),
      color: ink,
      eraseColor: erase,
      eraseMode: 'none',
    },
    // Left column — Membership ID value under label
    memberId: {
      x: Math.round(W * 0.22),
      y: Math.round(H * 0.635),
      maxWidth: Math.round(W * 0.22),
      maxHeight: Math.round(H * 0.035),
      align: 'center',
      fontSize: Math.round(W * 0.012),
      color: ink,
      eraseColor: erase,
      eraseMode: 'none',
    },
    // Middle column — Membership Session / joining year
    joiningYear: {
      x: Math.round(W * 0.5),
      y: Math.round(H * 0.635),
      maxWidth: Math.round(W * 0.18),
      maxHeight: Math.round(H * 0.035),
      align: 'center',
      fontSize: Math.round(W * 0.013),
      color: ink,
      eraseColor: erase,
      eraseMode: 'none',
    },
    // Right column — Status (General Member / Executive Member)
    membershipStatus: {
      x: Math.round(W * 0.78),
      y: Math.round(H * 0.635),
      maxWidth: Math.round(W * 0.22),
      maxHeight: Math.round(H * 0.035),
      align: 'center',
      fontSize: Math.round(W * 0.011),
      color: ink,
      eraseColor: erase,
      eraseMode: 'none',
    },
  };
}

/**
 * Merge stored zones with defaults.
 * - Uncalibrated / empty: return full default set
 * - Calibrated: keep ONLY keys admin saved (do not re-add removed fields)
 */
function mergeZonesWithDefaults(storedZones, canvasWidth = 2048, canvasHeight = 1436, calibrated = false) {
  const defaults = detectZones(canvasWidth, canvasHeight);
  if (!storedZones || typeof storedZones !== 'object' || Object.keys(storedZones).length === 0) {
    return defaults;
  }

  if (calibrated) {
    const out = {};
    for (const key of Object.keys(storedZones)) {
      out[key] = { ...(defaults[key] || {}), ...storedZones[key] };
    }
    return out;
  }

  const out = {};
  const keys = new Set([...Object.keys(defaults), ...Object.keys(storedZones)]);
  for (const key of keys) {
    out[key] = { ...(defaults[key] || {}), ...(storedZones[key] || {}) };
  }
  return out;
}

module.exports = { detectZones, mergeZonesWithDefaults };
