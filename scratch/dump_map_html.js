const fs = require('fs');
const path = require('path');

const buf = fs.readFileSync(path.join(__dirname, 'absenin_extracted', 'classes5.dex'));
const str = buf.toString('latin1');

// Find HTML strings or Leaflet strings inside classes5.dex
const idx = str.indexOf('getMapHTML');
if (idx !== -1) {
  console.log('--- FOUND getMapHTML around index', idx, '---');
  console.log(str.substring(Math.max(0, idx - 500), Math.min(str.length, idx + 2000)));
} else {
  // Search for html / leaflet
  const idx2 = str.indexOf('<!DOCTYPE html>');
  if (idx2 !== -1) {
    console.log('--- FOUND DOCTYPE at', idx2);
    console.log(str.substring(idx2, idx2 + 1500));
  }
}
