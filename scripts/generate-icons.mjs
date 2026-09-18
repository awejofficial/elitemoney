// Generates every icon size from public/favicon.svg (full-bleed) and a
// maskable-safe-zone variant. Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");

const masterSvg = readFileSync(path.join(publicDir, "favicon.svg"));
const maskableSvg = readFileSync(path.join(root, "design", "icon-maskable.svg"));

async function render(svgBuffer, size, outPath, { flatten = true } = {}) {
  let img = sharp(svgBuffer, { density: 384 }).resize(size, size);
  if (flatten) img = img.flatten({ background: "#8b8262" });
  await img.png().toFile(outPath);
  console.log("wrote", path.relative(root, outPath));
}

await render(masterSvg, 16, path.join(publicDir, "favicon-16x16.png"));
await render(masterSvg, 32, path.join(publicDir, "favicon-32x32.png"));
await render(masterSvg, 180, path.join(iconsDir, "apple-touch-icon.png"));
await render(masterSvg, 192, path.join(iconsDir, "icon-192.png"));
await render(masterSvg, 512, path.join(iconsDir, "icon-512.png"));
await render(maskableSvg, 192, path.join(iconsDir, "maskable-icon-192.png"));
await render(maskableSvg, 512, path.join(iconsDir, "maskable-icon-512.png"));

console.log("done");
