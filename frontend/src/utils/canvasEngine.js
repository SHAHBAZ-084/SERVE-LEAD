import { jsPDF } from 'jspdf';
import { FIELD_DEFAULT_PREFIXES } from './certZoneTools';

const imageCache = new Map();

function getAuthHeaders() {
  const headers = {};
  const memberToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  const token = adminToken || memberToken;
  if (token && token !== 'cookie-auth-active') {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function loadImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const res = await fetch(src, {
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Template image could not be loaded');
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Template image could not be loaded'));
    image.src = objectUrl;
  });

  URL.revokeObjectURL(objectUrl);
  imageCache.set(src, img);
  return img;
}

async function ensureFonts() {
  await document.fonts.ready;
  try {
    await Promise.all([
      document.fonts.load("64px 'Playfair Display'"),
      document.fonts.load("28px 'Inter'"),
    ]);
  } catch {
    // Continue with fallback fonts
  }
}

function eraseZone(ctx, zone) {
  if (!zone) return;
  const padX = 10;
  const padY = 6;
  const w = zone.maxWidth || 200;
  const h = Math.max(zone.maxHeight || zone.fontSize || 28, (zone.fontSize || 28) + 8);
  let left = zone.x;
  if (zone.align === 'center') left = zone.x - w / 2;
  else if (zone.align === 'right') left = zone.x - w;
  ctx.fillStyle = zone.eraseColor || '#F7F3EB';
  ctx.fillRect(left - padX, zone.y - h + padY, w + padX * 2, h + padY);
}

/**
 * Same font fitting used by PDF / Preview Draft — exported so calibrator
 * live preview stays visually identical after save.
 */
export function fitZoneFontSize(text, zone, fontFamily = 'sans-serif') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return fitText(ctx, String(text || ''), zone, fontFamily).fontSize;
}

function fitText(ctx, text, zone, fontFamily) {
  const maxW = zone.maxWidth || 400;
  const maxH = zone.maxHeight || 80;
  let fontSize = zone.fontSize || 28;
  let metrics;
  let textHeight;
  let attempts = 0;
  do {
    ctx.font = `${fontSize}px ${fontFamily}`;
    metrics = ctx.measureText(text);
    textHeight = (metrics.actualBoundingBoxAscent || fontSize * 0.8)
      + (metrics.actualBoundingBoxDescent || fontSize * 0.2);
    if (metrics.width <= maxW && textHeight <= maxH * 0.95) break;
    fontSize -= 2;
    attempts++;
  } while (fontSize > 10 && attempts < 30);
  return { fontSize, metrics, textHeight };
}

function drawZoneText(ctx, text, zone, fontFamily) {
  if (!zone || text == null || String(text).trim() === '') return;
  const value = String(text).trim();
  eraseZone(ctx, zone);
  const { fontSize, metrics, textHeight } = fitText(ctx, value, zone, fontFamily);
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = zone.color || '#002147';
  ctx.textAlign = zone.align || 'left';
  ctx.textBaseline = 'alphabetic';
  // Baseline at zone.y — optically center within erase band
  const y = zone.y - (metrics.actualBoundingBoxDescent || 0) * 0.15;
  ctx.fillText(value, zone.x, y);
  return textHeight;
}

function formatIssueDate(approvedAt) {
  const d = approvedAt ? new Date(approvedAt) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB');
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Returns raw field values — prefixes are applied from zone.prefix when drawing. */
function buildMemberLines(member) {
  return {
    name: member.name || '',
    date: formatIssueDate(member.approvedAt || member.issueDate),
    mobile: member.mobile ? String(member.mobile) : '',
    memberId: member.memberId || '',
    joiningYear: member.joiningYear != null && member.joiningYear !== ''
      ? String(member.joiningYear)
      : '2025',
    membershipStatus: member.membershipStatus || 'General Member',
  };
}

/**
 * @param {{ template: object, member: object, scale?: number }} opts
 * scale < 1 = faster preview (default 1 for PDF quality)
 */
export async function renderCertificateDataUrl({ template, member, scale = 1 }) {
  await ensureFonts();

  const canvasWidth = template.canvasWidth || 2048;
  const canvasHeight = template.canvasHeight || 1436;
  const zones = template.zones || {};
  const s = Math.min(Math.max(scale, 0.25), 1);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(canvasWidth * s);
  canvas.height = Math.round(canvasHeight * s);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(s, s);

  const img = await loadImage(template.fileUrl);
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

  const lines = buildMemberLines(member);
  const serif = "'Playfair Display', 'Times New Roman', serif";
  const sans = "'Inter', 'Helvetica Neue', sans-serif";

  // Draw only zones the admin kept on this template (order preserved)
  const drawOrder = ['date', 'name', 'mobile', 'memberId', 'joiningYear', 'membershipStatus'];
  for (const key of drawOrder) {
    if (!zones[key]) continue;
    const zone = zones[key];
    const font = key === 'name' ? serif : sans;
    const prefix = zone.prefix != null ? zone.prefix : (FIELD_DEFAULT_PREFIXES[key] ?? '');
    drawZoneText(ctx, prefix + (lines[key] ?? ''), zone, font);
  }
  // Any extra custom keys (future) — skip if no member line mapping
  for (const key of Object.keys(zones)) {
    if (drawOrder.includes(key)) continue;
    if (lines[key] != null) {
      const zone = zones[key];
      const prefix = zone.prefix != null ? zone.prefix : '';
      drawZoneText(ctx, prefix + lines[key], zone, sans);
    }
  }

  return canvas.toDataURL('image/png');
}

function resolveJsPdf() {
  if (typeof jsPDF === 'function') return jsPDF;
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  throw new Error('PDF library unavailable. Please refresh the page.');
}

/**
 * @param {{ template: object, member: object, format?: 'pdf' | 'png' }} opts
 */
export async function generateCertificate({ template, member, format = 'pdf' }) {
  try {
    const imgData = await renderCertificateDataUrl({ template, member, scale: 1 });
    const safeName = (member.name || 'Member').replace(/\s+/g, '_');

    if (format === 'png') {
      const a = document.createElement('a');
      a.href = imgData;
      a.download = `${safeName}_SLS_Certificate.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    const JsPDF = resolveJsPdf();
    const canvasWidth = template.canvasWidth || 2048;
    const canvasHeight = template.canvasHeight || 1436;
    const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const pageH = 210;
    const ratio = Math.min(pageW / canvasWidth, pageH / canvasHeight);
    const drawW = canvasWidth * ratio;
    const drawH = canvasHeight * ratio;
    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
    pdf.save(`${safeName}_SLS_Certificate.pdf`);
  } catch (err) {
    if (
      err.message?.includes('Template image')
      || err.message?.includes('PDF library')
      || err.message?.includes('Font loading')
    ) {
      throw err;
    }
    console.error('Certificate generation error:', err);
    throw new Error(err.message || 'Certificate download failed. Try again.');
  }
}

/** Clear cached template images (e.g. after re-upload). */
export function clearCertificateImageCache() {
  imageCache.clear();
}
