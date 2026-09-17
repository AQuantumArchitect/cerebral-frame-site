import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// Minimal 1200x630 PNG in paper + ink so OG has a bitmap even without a renderer.
const W = 1200;
const H = 630;
const paper = [246, 241, 232];
const ink = [28, 25, 22];
const accent = [140, 74, 31];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

const rows = [];
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W * 3);
  for (let x = 0; x < W; x++) {
    let [r, g, b] = paper;
    if (x >= 72 && x < 100 && y >= 72 && y < 100) {
      const edge = x < 76 || x >= 96 || y < 76 || y >= 96;
      if (edge) [r, g, b] = accent;
    }
    if (y >= 460 && y < 520 && x >= 72 && x < 700) [r, g, b] = accent;
    if (y >= 220 && y < 300 && x >= 72 && x < 1100) [r, g, b] = ink;
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  rows.push(row);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join(process.cwd(), "public", "og.png");
fs.writeFileSync(out, png);
console.log("wrote", out, png.length);
