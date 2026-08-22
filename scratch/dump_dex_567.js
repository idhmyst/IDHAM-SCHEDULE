const fs = require('fs');
const path = require('path');

for (const dex of ['classes5.dex', 'classes6.dex', 'classes7.dex']) {
  const buf = fs.readFileSync(path.join(__dirname, 'absenin_extracted', dex));
  console.log(`\n=== ALL STRINGS IN ${dex} ===`);
  const strings = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] < 32 || buf[i] > 126) {
      if (i - start > 1) {
        const s = buf.toString('utf8', start, i);
        strings.push(s);
      }
      start = i + 1;
    }
  }
  console.log(Array.from(new Set(strings)).filter(s => !s.startsWith('Ljava') && !s.startsWith('Landroid')));
}
