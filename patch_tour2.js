const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', 'utf8');

const oldTourStart = content.indexOf('{tourActive && (\\n        <div style={{\\n          position: \\'fixed\\',');
console.log(oldTourStart);
