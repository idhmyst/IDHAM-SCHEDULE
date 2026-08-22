const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'absenin_extracted');
const dexFiles = fs.readdirSync(dir).filter(f => f.endsWith('.dex'));

const results = [];

for (const f of dexFiles) {
  const buf = fs.readFileSync(path.join(dir, f));
  // Find all UTF-8 / ASCII strings of length > 2
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] < 32 || buf[i] > 126) {
      if (i - start > 3) {
        const s = buf.toString('utf8', start, i);
        if (s.includes('api') || s.includes('presence') || s.includes('gateway') || s.includes('telkomschools') || s.includes('ypt') || s.includes('Token') || s.includes('auth') || s.includes('login')) {
          results.push(s);
        }
      }
      start = i + 1;
    }
  }
}

const unique = Array.from(new Set(results));
console.log('Total matches:', unique.length);
console.log(unique.filter(s => !s.startsWith('Landroid') && !s.startsWith('Lcom/google')).slice(0, 100));
