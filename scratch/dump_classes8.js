const fs = require('fs');
const path = require('path');

const buf = fs.readFileSync(path.join(__dirname, 'absenin_extracted', 'classes8.dex'));
const str = buf.toString('latin1');

// Find all strings in classes8.dex
const matches = str.match(/[a-zA-Z0-9_\-\.\:\/\?=&%{}"]{3,}/g) || [];
const filtered = matches.filter(s => 
  s.includes('gateway') || 
  s.includes('telkomschools') || 
  s.includes('presence') || 
  s.includes('login') || 
  s.includes('auth') || 
  s.includes('Attendance') ||
  s.includes('api/')
);

console.log(Array.from(new Set(filtered)));
