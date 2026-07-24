// Rasterize the app icon (rosa mexicano tile + white pin) into every size the
// PWA needs. Uses sharp, which ships with Next. Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#E4007C"/>
  <path fill="#FFFFFF" d="M256 88c-72 0-124 54-124 120 0 92 124 216 124 216s124-124 124-216c0-66-52-120-124-120zm0 166a46 46 0 1 1 0-92 46 46 0 0 1 0 92z"/>
</svg>`;

await mkdir("public/icons", { recursive: true });
const out = [
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["app/icon.png", 512],
  ["app/apple-icon.png", 180],
];
for (const [path, size] of out) {
  await sharp(Buffer.from(svg(size))).resize(size, size).png().toFile(path);
  console.log("wrote", path);
}
