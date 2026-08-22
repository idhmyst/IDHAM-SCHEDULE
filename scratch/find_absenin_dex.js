const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'absenin_extracted');
const dexFiles = fs.readdirSync(dir).filter(f => f.endsWith('.dex'));

for (const f of dexFiles) {
  const buf = fs.readFileSync(path.join(dir, f));
  const str = buf.toString('latin1');
  if (str.includes('com/simpleapp/absenin_aja')) {
    console.log(`Found com/simpleapp/absenin_aja in ${f}! Size: ${buf.length}`);
    
    // Extract strings around simpleapp
    const regex = /([a-zA-Z0-9_\-\.\:\/\?=&%{}"]{4,80})/g;
    let match;
    const items = new Set();
    while ((match = regex.exec(str)) !== null) {
      const s = match[1];
      if (s.includes('api') || s.includes('presence') || s.includes('gateway') || s.includes('telkom') || s.includes('Login') || s.includes('Attendance') || s.includes('auth')) {
        items.add(s);
      }
    }
    console.log('Sample items in ' + f + ':', Array.from(items).slice(0, 40));
  }
}
