/* Rasterize the Takenotes SVG mark and pack it into a Windows .ico (PNG-in-ICO). */
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), 'utf8');
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = sizes.map((s) => {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: s }, background: '#FDFCF8' });
  return { size: s, png: r.render().asPng() };
});

const headerSize = 6 + 16 * pngs.length;
let offset = headerSize;
const entries = [];
for (const { size, png } of pngs) {
  entries.push({
    width: size === 256 ? 0 : size,
    height: size === 256 ? 0 : size,
    colorCount: 0,
    reserved: 0,
    planes: 1,
    bitCount: 32,
    bytesInRes: png.length,
    imageOffset: offset,
    png,
  });
  offset += png.length;
}

const out = Buffer.alloc(offset);
out.writeUInt16LE(0, 0);
out.writeUInt16LE(1, 2);
out.writeUInt16LE(pngs.length, 4);
let p = 6;
for (const e of entries) {
  out.writeUInt8(e.width, p);
  out.writeUInt8(e.height, p + 1);
  out.writeUInt8(e.colorCount, p + 2);
  out.writeUInt8(e.reserved, p + 3);
  out.writeUInt16LE(e.planes, p + 4);
  out.writeUInt16LE(e.bitCount, p + 6);
  out.writeUInt32LE(e.bytesInRes, p + 8);
  out.writeUInt32LE(e.imageOffset, p + 12);
  p += 16;
}
for (const e of entries) {
  e.png.copy(out, e.imageOffset);
}
const dest = path.join(__dirname, 'icon.ico');
fs.writeFileSync(dest, out);
console.log('wrote', dest, out.length, 'bytes');
