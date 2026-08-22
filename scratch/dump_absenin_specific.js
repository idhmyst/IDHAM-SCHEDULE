const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'absenin_extracted');
const dexFiles = fs.readdirSync(dir).filter(f => f.endsWith('.dex'));

const results = [];

for (const f of dexFiles) {
  const buf = fs.readFileSync(path.join(dir, f));
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] < 32 || buf[i] > 126) {
      if (i - start > 2) {
        const s = buf.toString('utf8', start, i);
        if (s.includes('simpleapp') || s.includes('ypt.or.id') || s.includes('telkomschools') || s.includes('absenin')) {
          results.push(s);
        }
      }
      start = i + 1;
    }
  }
}

const unique = Array.from(new Set(results));
console.log('--- FOUND ABSENIN AJA STRINGS ---');
console.log(unique);
