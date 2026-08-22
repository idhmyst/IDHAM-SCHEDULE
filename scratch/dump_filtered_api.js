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
      if (i - start > 1) {
        const s = buf.toString('utf8', start, i);
        results.push(s);
      }
      start = i + 1;
    }
  }
}

const interesting = results.filter(s => 
  !s.includes('com/google') &&
  !s.includes('android/') &&
  !s.includes('androidx/') &&
  !s.includes('kotlin/') &&
  (
    s.includes('gateway') || 
    s.includes('presence') || 
    s.includes('Attendance') || 
    s.includes('latitude') || 
    s.includes('longitude') ||
    s.includes('device') ||
    s.includes('token') ||
    s.includes('nis') ||
    s.includes('email') ||
    s.includes('password') ||
    s.includes('http') ||
    s.includes('v1') ||
    s.includes('api')
  )
);

console.log(Array.from(new Set(interesting)));
