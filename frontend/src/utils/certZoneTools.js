/** Catalog of certificate fields that map to member data. Admin enables any subset. */
export const CERT_FIELD_CATALOG = [
  { key: 'name', label: 'Member Name', defaultAlign: 'center', defaultFontSize: 64 },
  { key: 'date', label: 'Issue Date', defaultAlign: 'right', defaultFontSize: 20 },
  { key: 'mobile', label: 'Mobile Number', defaultAlign: 'center', defaultFontSize: 18 },
  { key: 'memberId', label: 'Member ID', defaultAlign: 'center', defaultFontSize: 22 },
  { key: 'joiningYear', label: 'Joining Year', defaultAlign: 'center', defaultFontSize: 22 },
  { key: 'membershipStatus', label: 'Membership Status', defaultAlign: 'center', defaultFontSize: 20 },
];

export const ZONE_ACCENT = {
  name: '#00bcd4',
  date: '#22c55e',
  mobile: '#f97316',
  memberId: '#3b82f6',
  joiningYear: '#a855f7',
  membershipStatus: '#ef4444',
};

export function getFieldLabel(key) {
  return CERT_FIELD_CATALOG.find((f) => f.key === key)?.label || key;
}

export function createDefaultZone(key, canvasW = 2048, canvasH = 1436, index = 0) {
  const meta = CERT_FIELD_CATALOG.find((f) => f.key === key);
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: Math.round(canvasW * (0.25 + col * 0.25)),
    y: Math.round(canvasH * (0.35 + row * 0.12)),
    maxWidth: Math.round(canvasW * 0.28),
    maxHeight: Math.round(canvasH * 0.045),
    align: meta?.defaultAlign || 'center',
    fontSize: meta?.defaultFontSize || 22,
    color: '#002147',
    eraseColor: '#F7F3EB',
  };
}

export function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return { r: 0, g: 33, b: 71 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Sample a single pixel from the template image at display click coords.
 * displayRect = getBoundingClientRect of the rendered <img>
 * clientX/Y = mouse event coords
 */
export function samplePixelAt(img, displayRect, clientX, clientY, canvasW = 2048, canvasH = 1436) {
  if (!img || !displayRect?.width) {
    return { hex: '#002147', r: 0, g: 33, b: 71 };
  }

  const relX = (clientX - displayRect.left) / displayRect.width;
  const relY = (clientY - displayRect.top) / displayRect.height;
  const px = Math.max(0, Math.min(1, relX));
  const py = Math.max(0, Math.min(1, relY));

  const sampleW = Math.min(img.naturalWidth || canvasW, 1600);
  const sampleH = Math.round(sampleW * ((img.naturalHeight || canvasH) / (img.naturalWidth || canvasW)));
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, sampleW, sampleH);

  const x = Math.min(sampleW - 1, Math.max(0, Math.floor(px * sampleW)));
  const y = Math.min(sampleH - 1, Math.max(0, Math.floor(py * sampleH)));

  // Average a small 5x5 neighborhood for stable sampling
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let n = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const sx = Math.min(sampleW - 1, Math.max(0, x + dx));
      const sy = Math.min(sampleH - 1, Math.max(0, y + dy));
      const d = ctx.getImageData(sx, sy, 1, 1).data;
      rSum += d[0];
      gSum += d[1];
      bSum += d[2];
      n++;
    }
  }
  const r = Math.round(rSum / n);
  const g = Math.round(gSum / n);
  const b = Math.round(bSum / n);
  return { hex: rgbToHex(r, g, b), r, g, b, x: Math.round(px * canvasW), y: Math.round(py * canvasH) };
}

export const PREVIEW_SAMPLE_TEXT = {
  name: 'MUHAMMAD SHAHBAZ',
  date: 'Issued on: 12/07/2026',
  mobile: '0300-1234567',
  memberId: '2024-SLS-0098',
  joiningYear: '2024',
  membershipStatus: 'General Member',
};

/**
 * Sample pixels under a zone to suggest erase fill, ink color, and font size.
 * Uses the template image (HTMLImageElement or CanvasImageSource).
 */
export function sampleZoneStyleFromImage(img, zone, canvasW = 2048, canvasH = 1436) {
  if (!img || !zone) {
    return { eraseColor: '#F7F3EB', color: '#002147', fontSize: zone?.fontSize || 22 };
  }

  const w = zone.maxWidth || 200;
  const h = Math.max(zone.maxHeight || 40, 24);
  let left = zone.x;
  if (zone.align === 'center') left = zone.x - w / 2;
  else if (zone.align === 'right') left = zone.x - w;
  const top = zone.y - h;

  const sampleW = 320;
  const sampleH = Math.round(sampleW * (canvasH / canvasW));
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, sampleW, sampleH);

  const sx = Math.max(0, Math.floor((left / canvasW) * sampleW));
  const sy = Math.max(0, Math.floor((top / canvasH) * sampleH));
  const sw = Math.max(4, Math.floor((w / canvasW) * sampleW));
  const sh = Math.max(4, Math.floor((h / canvasH) * sampleH));

  let data;
  try {
    data = ctx.getImageData(
      Math.min(sx, sampleW - 1),
      Math.min(sy, sampleH - 1),
      Math.min(sw, sampleW - sx),
      Math.min(sh, sampleH - sy)
    ).data;
  } catch {
    return { eraseColor: '#F7F3EB', color: '#002147', fontSize: Math.round(h * 0.55) };
  }

  const lights = [];
  const darks = [];
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    const lum = luminance(r, g, b);
    if (lum > 180) lights.push([r, g, b]);
    else if (lum < 120) darks.push([r, g, b]);
  }

  const avg = (arr) => {
    if (!arr.length) return null;
    const n = arr.length;
    let r = 0;
    let g = 0;
    let b = 0;
    for (const p of arr) {
      r += p[0];
      g += p[1];
      b += p[2];
    }
    return rgbToHex(r / n, g / n, b / n);
  };

  const eraseColor = avg(lights) || '#F7F3EB';
  const color = avg(darks) || '#002147';
  const fontSize = Math.max(12, Math.min(96, Math.round(h * 0.58)));

  return { eraseColor, color, fontSize };
}

/** Auto-fill style for all zones from the template image. */
export function autoDetectAllZoneStyles(img, zones, canvasW, canvasH, { overwrite = false } = {}) {
  const next = {};
  for (const key of Object.keys(zones || {})) {
    const sampled = sampleZoneStyleFromImage(img, zones[key], canvasW, canvasH);
    const prev = zones[key] || {};
    next[key] = {
      ...prev,
      eraseColor: overwrite || !prev.eraseColor ? sampled.eraseColor : prev.eraseColor,
      color: overwrite || !prev.color ? sampled.color : prev.color,
      fontSize: overwrite || !prev.fontSize ? sampled.fontSize : prev.fontSize,
    };
  }
  return next;
}
