/**
 * Convert the first page of a PDF File into a PNG File for template upload/calibration.
 */
export async function pdfFileToPngFile(pdfFile) {
  const pdfjs = await import('pdfjs-dist');
  const { getDocument, GlobalWorkerOptions } = pdfjs;

  try {
    GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Worker may fail in some bundlers; getDocument still works for small files
  }

  const data = new Uint8Array(await pdfFile.arrayBuffer());
  const loadingTask = getDocument({ data, disableWorker: true });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const baseViewport = page.getViewport({ scale: 1 });
  const targetWidth = 2048;
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PDF conversion failed'))),
      'image/png',
      0.95
    );
  });

  const baseName = (pdfFile.name || 'template.pdf').replace(/\.pdf$/i, '');
  return new File([blob], `${baseName}.png`, { type: 'image/png' });
}

export function isPdfFile(file) {
  if (!file) return false;
  return (
    file.type === 'application/pdf'
    || /\.pdf$/i.test(file.name || '')
  );
}
