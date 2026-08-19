/**
 * Génère les icônes PWA à partir du logo de marque (public/noken-logo.png).
 *
 * Ni sharp ni canvas ne sont installés : le PNG est décodé et réencodé à la
 * main (zlib + CRC32), et le redimensionnement se fait par moyenne de boîte —
 * suffisant et net pour une réduction.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync, inflateSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "public/noken-logo.png");

/** Bleu de marque relevé sur le logo. */
const BRAND = [0, 144, 255];
const WHITE = [255, 255, 255];

/* ------------------------------------------------------------------- CRC32 */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ------------------------------------------------------------------ décodage */

function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error("Profondeur 8 bits attendue");
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`Type de couleur non géré : ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // Défiltrage ligne à ligne (filtres PNG 0 à 4).
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = value & 255;
    }
  }

  // Normalisation en RGBA.
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const src = i * channels;
    const dst = i * 4;
    if (channels >= 3) {
      rgba[dst] = out[src];
      rgba[dst + 1] = out[src + 1];
      rgba[dst + 2] = out[src + 2];
      rgba[dst + 3] = channels === 4 ? out[src + 3] : 255;
    } else {
      rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = out[src];
      rgba[dst + 3] = channels === 2 ? out[src + 1] : 255;
    }
  }

  return { width, height, rgba };
}

/* ------------------------------------------------------------------ encodage */

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- traitements */

/** Boîte englobante du contenu visible : le logo source a de larges marges. */
function contentBounds({ width, height, rgba }) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const alpha = rgba[o + 3];
      const isWhite = rgba[o] > 245 && rgba[o + 1] > 245 && rgba[o + 2] > 245;
      if (alpha < 16 || isWhite) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  return { minX, minY, maxX, maxY };
}

/** Réduction par moyenne de boîte, avec alpha prémultiplié. */
function sampleBox(source, sx0, sy0, sx1, sy1) {
  const { width, rgba } = source;
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let count = 0;

  for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) {
    for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) {
      const o = (y * width + x) * 4;
      const alpha = rgba[o + 3] / 255;
      r += rgba[o] * alpha;
      g += rgba[o + 1] * alpha;
      b += rgba[o + 2] * alpha;
      a += alpha;
      count++;
    }
  }

  if (count === 0 || a === 0) return [0, 0, 0, 0];
  return [r / a, g / a, b / a, a / count];
}

function insideRoundedRect(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * @param {boolean} maskable  fond plein bord à bord et logo réduit, pour
 *                            survivre au rognage des lanceurs Android.
 */
function renderIcon(source, bounds, size, maskable) {
  const out = Buffer.alloc(size * size * 4);

  // Le logo occupe 60 % du carré en maskable (zone de sécurité), 76 % sinon.
  const ratio = maskable ? 0.6 : 0.76;
  const srcW = bounds.maxX - bounds.minX + 1;
  const srcH = bounds.maxY - bounds.minY + 1;
  const scale = (size * ratio) / Math.max(srcW, srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const originX = (size - drawW) / 2;
  const originY = (size - drawH) / 2;

  const radius = maskable ? 0 : size * 0.22;
  // Maskable : fond bleu, logo en blanc. Sinon : fond blanc, logo d'origine.
  const background = maskable ? BRAND : WHITE;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;

      const inBg = maskable
        ? true
        : insideRoundedRect(x + 0.5, y + 0.5, size, radius);
      if (!inBg) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
        continue;
      }

      let [r, g, b, a] = [background[0], background[1], background[2], 1];

      if (x >= originX && x < originX + drawW && y >= originY && y < originY + drawH) {
        const u0 = bounds.minX + ((x - originX) / drawW) * srcW;
        const v0 = bounds.minY + ((y - originY) / drawH) * srcH;
        const u1 = bounds.minX + ((x + 1 - originX) / drawW) * srcW;
        const v1 = bounds.minY + ((y + 1 - originY) / drawH) * srcH;

        const [sr, sg, sb, sa] = sampleBox(source, u0, v0, u1, v1);
        if (sa > 0) {
          // En maskable, le fond est bleu : aplatir le logo en blanc ferait
          // disparaître le mot « NOKEN », déjà blanc dans la source. On inverse
          // donc les deux teintes — la silhouette passe en blanc, le lettrage
          // reprend le bleu de marque — ce qui préserve le mot.
          let fg = [sr, sg, sb];
          if (maskable) {
            const luminance = (sr + sg + sb) / 3;
            fg = luminance > 170 ? BRAND : WHITE;
          }
          r = fg[0] * sa + r * (1 - sa);
          g = fg[1] * sa + g * (1 - sa);
          b = fg[2] * sa + b * (1 - sa);
        }
      }

      out[o] = Math.round(r);
      out[o + 1] = Math.round(g);
      out[o + 2] = Math.round(b);
      out[o + 3] = Math.round(a * 255);
    }
  }

  return encodePng(size, size, out);
}

/* --------------------------------------------------------------------- main */

const source = decodePng(readFileSync(SOURCE));
const bounds = contentBounds(source);
console.log(
  `source ${source.width}×${source.height} — contenu utile ` +
    `${bounds.maxX - bounds.minX + 1}×${bounds.maxY - bounds.minY + 1}`,
);

const outputs = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/icon-maskable-512.png", 512, true],
  ["src/app/icon.png", 256, false],
  ["src/app/apple-icon.png", 180, true],
];

for (const [relativePath, size, maskable] of outputs) {
  const target = resolve(ROOT, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  const png = renderIcon(source, bounds, size, maskable);
  writeFileSync(target, png);
  console.log(`${relativePath} — ${size}×${size}, ${(png.length / 1024).toFixed(1)} Ko`);
}
