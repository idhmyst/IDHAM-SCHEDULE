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

// Find strings around ApiService, login, presence, endpoint
const interesting = results.filter(s => 
  s.includes('/api') || 
  s.includes('gateway') || 
  s.includes('presence') || 
  s.includes('Attendance') || 
  s.includes('latitude') || 
  s.includes('longitude') ||
  s.includes('device') ||
  s.includes('Authorization') ||
  s.includes('Bearer') ||
  s.includes('student') ||
  s.includes('nis') ||
  s.includes('email') ||
  s.includes('password') ||
  s.includes('token')
);

console.log(Array.from(new Set(interesting)));
