function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Certificate template not found.'));
    img.src = src + '?v=' + Date.now();
  });
}

export async function generateCertificate(memberData, template) {
  try {
    if (!window.jspdf?.jsPDF) {
      throw new Error('PDF library not loaded. Check connection.');
    }

    await document.fonts.ready;
    if (!document.fonts.check("12px 'Great Vibes'")) {
      await document.fonts.load("90px 'Great Vibes'");
    }

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1436;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = await loadImage(template.file);
    ctx.drawImage(img, 0, 0, 2048, 1436);

    const { top, bottom, centerX } = template.nameZone;
    const safeHeight = bottom - top;
    let fontSize = 90;
    ctx.font = `${fontSize}px 'Great Vibes', cursive`;
    let metrics = ctx.measureText(memberData.name);
    let textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    let attempts = 0;
    while (
      (textHeight > safeHeight * 0.92 || metrics.width > 2048 * 0.75)
      && attempts < 15
    ) {
      fontSize -= 4;
      ctx.font = `${fontSize}px 'Great Vibes', cursive`;
      metrics = ctx.measureText(memberData.name);
      textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      attempts++;
    }

    const nameY = top + (safeHeight / 2) + (textHeight / 2) - metrics.actualBoundingBoxDescent + 10;
    ctx.fillStyle = template.textColor;
    ctx.textAlign = 'center';
    ctx.fillText(memberData.name, centerX, nameY);

    ctx.fillStyle = template.barColor;
    ctx.fillRect(200, 1340, 700, 60);
    ctx.fillRect(1100, 1340, 748, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = "28px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    const dateStr = memberData.approvedAt
      ? new Date(memberData.approvedAt).toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-PK', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
    ctx.fillText(dateStr, 220, 1378);
    ctx.textAlign = 'right';
    ctx.fillText(`ID: ${memberData.memberId}`, 1828, 1378);

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const pageH = 210;
    const ratio = Math.min(pageW / 2048, pageH / 1436);
    const drawW = 2048 * ratio;
    const drawH = 1436 * ratio;
    const offsetX = (pageW - drawW) / 2;
    const offsetY = (pageH - drawH) / 2;
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
    const filename = memberData.name.replace(/\s+/g, '_') + '_SLS_Certificate.pdf';
    pdf.save(filename);
  } catch (err) {
    if (err.message?.includes('template not found')) {
      throw err;
    }
    if (err.message?.includes('PDF library')) {
      throw err;
    }
    if (err.name === 'NetworkError' || err.message?.includes('font')) {
      throw new Error('Font loading failed. Try refreshing.');
    }
    console.error('Certificate generation error:', err);
    throw err;
  }
}
