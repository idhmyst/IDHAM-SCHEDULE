const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'absenin_extracted');
const dexFiles = fs.readdirSync(dir).filter(f => f.endsWith('.dex'));

for (const dex of dexFiles) {
  const buf = fs.readFileSync(path.join(dir, dex));
  const str = buf.toString('latin1');
  
  const regex = /["'/]([a-zA-Z0-9_\-\.\/]*(?:location|coordinate|school|address|presence|geo|place|osm|nominatim|ypt|telkomschools)[a-zA-Z0-9_\-\.\/]*)["'/]/gi;
  let match;
  const matches = new Set();
  while ((match = regex.exec(str)) !== null) {
    if (match[1].length > 3 && match[1].length < 120) {
      matches.add(match[1]);
    }
  }
  if (matches.size > 0) {
    console.log(`\n=== LOCATIONS/API MATCHES IN ${dex} ===`);
    console.log(Array.from(matches).slice(0, 50));
  }
}
