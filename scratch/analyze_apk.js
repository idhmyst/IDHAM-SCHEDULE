const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'absenin_extracted');
const dexFiles = fs.readdirSync(dir).filter(f => f.endsWith('.dex'));

const results = new Set();

for (const f of dexFiles) {
  const buf = fs.readFileSync(path.join(dir, f));
  const str = buf.toString('latin1');
  
  // Look for method annotations like @POST("...") or strings starting with api/ or presence/
  const regex = /["'/]([a-zA-Z0-9_\-\.\/]*(?:login|auth|presence|absensi|attendance|token|user|student|school)[a-zA-Z0-9_\-\.\/]*)["'/]/gi;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match[1].length > 3 && match[1].length < 80) {
      results.add(match[1]);
    }
  }
}

console.log('--- FOUND STRINGS IN APK ---');
console.log(Array.from(results).slice(0, 80));
