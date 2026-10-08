const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/SeismographDrum.jsx', 'utf8');
if (!content.includes('const API_BASE')) {
    content = `const API_BASE = 'http://localhost:8081';\n` + content;
    fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/SeismographDrum.jsx', content);
}
