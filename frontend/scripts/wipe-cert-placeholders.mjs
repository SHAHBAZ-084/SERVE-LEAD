import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "../src/assets/membership-cert-bg.png");
const out = path.join(__dirname, "../src/assets/membership-cert-bg-clean.png");

const PAPER = [253, 249, 246, 255];

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function fillRect(x, y, w, h) {
  for (let py = Math.max(0, y); py < Math.min(height, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(width, x + w); px++) {
      const i = (py * width + px) * channels;
      data[i] = PAPER[0];
      data[i + 1] = PAPER[1];
      data[i + 2] = PAPER[2];
      if (channels === 4) data[i + 3] = PAPER[3];
    }
  }
}

const wipes = [
  { x: 742, y: 44, w: 220, h: 20 }, // issued on + date
  { x: 268, y: 232, w: 488, h: 22 }, // MEMBER NAME
  { x: 198, y: 392, w: 168, h: 18 }, // membership id value
  { x: 420, y: 392, w: 100, h: 18 }, // session value
  { x: 638, y: 392, w: 172, h: 18 }, // status value
  { x: 116, y: 442, w: 788, h: 18 }, // closing line 1
  { x: 144, y: 465, w: 732, h: 16 }, // closing line 2
];

for (const r of wipes) fillRect(r.x, r.y, r.w, r.h);

await sharp(data, { raw: { width, height, channels } }).png({ compressionLevel: 9 }).toFile(out);
console.log("Wrote", out);
