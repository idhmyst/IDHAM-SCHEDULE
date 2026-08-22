const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'absenin_extracted');
const dexFiles = fs.readdirSync(dir).filter(f => f.endsWith('.dex'));

for (const dex of dexFiles) {
  const buf = fs.readFileSync(path.join(dir, dex));
  const str = buf.toString('latin1');
  if (str.includes('Friend') || str.includes('SavedLocation') || str.includes('QRCode') || str.includes('MapPicker')) {
    console.log(`\n=== MATCH IN ${dex} ===`);
    const regex = /[a-zA-Z0-9_\-\.\:\/\?=&%{}"]{4,80}/g;
    let match;
    const items = new Set();
    while ((match = regex.exec(str)) !== null) {
      const s = match[0];
      if (s.includes('Friend') || s.includes('Location') || s.includes('QR') || s.includes('Map') || s.includes('presence') || s.includes('attendance')) {
        items.add(s);
      }
    }
    console.log(Array.from(items).slice(0, 30));
  }
}
