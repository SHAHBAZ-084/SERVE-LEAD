function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Template image could not be loaded'));
    img.src = src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now();
  });
}

function drawZoneText(ctx, text, zone, fontFamily) {
  if (!zone || text == null || text === '') return;
  const fontSize = zone.fontSize || 28;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = zone.color || '#ffffff';
  ctx.textAlign = zone.align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(text), zone.x, zone.y);
}

async function ensureFonts() {
  await document.fonts.ready;
  try {
    if (!document.fonts.check("12px 'Great Vibes'")) {
      await document.fonts.load("90px 'Great Vibes'");
    }
  } catch {
    throw new Error('Font loading failed. Try refreshing.');
  }
}

/**
 * Draws certificate onto a canvas and returns PNG data URL.
 * template: { fileUrl, zones, canvasWidth, canvasHeight }
 * member: { name, memberId, approvedAt, city }
 */
export async function renderCertificateDataUrl({ template, member }) {
  await ensureFonts();

  const canvasWidth = template.canvasWidth || 2048;
  const canvasHeight = template.canvasHeight || 1436;
  const zones = template.zones || {};

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const img = await loadImage(template.fileUrl);
  ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

  const nameZone = zones.name || {};
  const safeHeight = nameZone.maxHeight || 102;
  const maxWidth = nameZone.maxWidth || canvasWidth * 0.75;
  let fontSize = nameZone.fontSize || 90;
  ctx.font = `${fontSize}px 'Great Vibes', cursive`;
  let metrics = ctx.measureText(member.name || '');
  let textHeight = (metrics.actualBoundingBoxAscent || fontSize * 0.8)
    + (metrics.actualBoundingBoxDescent || fontSize * 0.2);
  let attempts = 0;
  while (
    (textHeight > safeHeight * 0.92 || metrics.width > maxWidth)
    && attempts < 15
  ) {
    fontSize -= 4;
    ctx.font = `${fontSize}px 'Great Vibes', cursive`;
    metrics = ctx.measureText(member.name || '');
    textHeight = (metrics.actualBoundingBoxAscent || fontSize * 0.8)
      + (metrics.actualBoundingBoxDescent || fontSize * 0.2);
    attempts++;
  }

  const nameY = (nameZone.y || 490)
    + (textHeight / 2)
    - (metrics.actualBoundingBoxDescent || 0)
    + 10;
  ctx.fillStyle = nameZone.color || '#ffffff';
  ctx.textAlign = nameZone.align || 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(member.name || '', nameZone.x || canvasWidth / 2, nameY);

  const dateStr = member.approvedAt
    ? new Date(member.approvedAt).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  drawZoneText(ctx, dateStr, zones.date, "'Inter', sans-serif");
  drawZoneText(
    ctx,
    member.memberId ? `ID: ${member.memberId}` : '',
    zones.memberId,
    "'Inter', sans-serif"
  );
  if (zones.city && member.city) {
    drawZoneText(ctx, member.city, zones.city, "'Inter', sans-serif");
  }

  return canvas.toDataURL('image/png');
}

/**
 * @param {{ template: object, member: object }} opts
 */
export async function generateCertificate({ template, member }) {
  try {
    if (!window.jspdf?.jsPDF) {
      throw new Error('PDF library unavailable');
    }

    const imgData = await renderCertificateDataUrl({ template, member });
    const canvasWidth = template.canvasWidth || 2048;
    const canvasHeight = template.canvasHeight || 1436;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const pageH = 210;
    const ratio = Math.min(pageW / canvasWidth, pageH / canvasHeight);
    const drawW = canvasWidth * ratio;
    const drawH = canvasHeight * ratio;
    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
    const filename = (member.name || 'Member').replace(/\s+/g, '_') + '_SLS_Certificate.pdf';
    pdf.save(filename);
  } catch (err) {
    if (
      err.message?.includes('Template image')
      || err.message?.includes('PDF library')
      || err.message?.includes('Font loading')
    ) {
      throw err;
    }
    console.error('Certificate generation error:', err);
    throw err;
  }
}
