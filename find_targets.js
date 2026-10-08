const fs = require('fs');
const content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('key={tip.id} style={{')) {
    console.log(`Feed card line: ${i+1}`);
  }
  if (line.includes('textarea') && line.includes('value={checkText}')) {
    console.log(`Textarea line: ${i+1}`);
  }
  if (line.includes('SIMULATOR CONTROLS')) {
    console.log(`Simulator controls line: ${i+1}`);
  }
  if (line.includes('<table') && lines[i-5].includes('Dataset')) {
    console.log(`Dataset table line: ${i+1}`);
  }
});
