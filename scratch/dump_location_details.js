const fs = require('fs');
const path = require('path');

const buf5 = fs.readFileSync(path.join(__dirname, 'absenin_extracted', 'classes5.dex'));
const buf6 = fs.readFileSync(path.join(__dirname, 'absenin_extracted', 'classes6.dex'));

for (const [name, buf] of [['classes5.dex', buf5], ['classes6.dex', buf6]]) {
  const str = buf.toString('latin1');
  const regex = /([a-zA-Z0-9_\-\.\:\/\?=&%{}"]{4,120})/g;
  let m;
  const found = new Set();
  while ((m = regex.exec(str)) !== null) {
    const s = m[0];
    if (s.toLowerCase().includes('locat') || s.toLowerCase().includes('nominatim') || s.toLowerCase().includes('geo') || s.toLowerCase().includes('map') || s.toLowerCase().includes('coord')) {
      found.add(s);
    }
  }
  console.log(`\n--- ${name} ---`);
  console.log(Array.from(found));
}
