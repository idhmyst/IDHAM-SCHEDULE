const fs = require('fs');
const path = require('path');

const buf = fs.readFileSync(path.join(__dirname, 'absenin_extracted', 'classes5.dex'));
const str = buf.toString('latin1');

const idx = str.indexOf('basemaps.cartocdn.com');
if (idx !== -1) {
  console.log('--- FOUND MAP HTML ---');
  console.log(str.substring(Math.max(0, idx - 400), Math.min(str.length, idx + 800)));
}
