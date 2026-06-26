import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { CERT_CANVAS } from "../pages/CertTemplates";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap";

/**
 * Captures #cert-export-node (or given element id) into an A4 landscape PDF.
 * Caller must set export data and wait for React to render before invoking.
 */
export async function captureCertificatePdf(sourceElementId, { fileName = "SLS_Certificate.pdf" } = {}) {
  const W = CERT_CANVAS.width;
  const H = CERT_CANVAS.height;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = `position:fixed;top:0;left:0;width:${W}px;height:${H}px;opacity:0;pointer-events:none;z-index:-1000`;
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html><html><head>
    <link href="${FONT_LINK}" rel="stylesheet">
    <style>
      body{margin:0;padding:0;background:#fff}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      h1,h2,h3,p{margin:0;padding:0}
    </style></head><body><div id="sandbox-root"></div></body></html>`);
  iframeDoc.close();

  await new Promise((r) => setTimeout(r, 1000));
  await iframeDoc.fonts.ready;

  const sourceElement = document.getElementById(sourceElementId);
  if (!sourceElement) {
    document.body.removeChild(iframe);
    throw new Error("Export engine not found in DOM");
  }

  const clonedNode = sourceElement.cloneNode(true);
  Object.assign(clonedNode.style, {
    opacity: "1",
    visibility: "visible",
    display: "block",
    position: "static",
    transform: "none",
    left: "auto",
    top: "auto",
  });
  iframeDoc.getElementById("sandbox-root").appendChild(clonedNode);

  const canvas = await html2canvas(clonedNode, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: W,
    windowHeight: H,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  pdf.addImage(imgData, "PNG", 0, 0, 297, 210, undefined, "FAST");
  pdf.save(fileName);

  document.body.removeChild(iframe);
}
