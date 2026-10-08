const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/start.sh', 'utf8');
content = content.replace(
    'npx serve -s dist -l tcp://0.0.0.0:"$FRONTEND_PORT"',
    'npx serve -s dist -l "$FRONTEND_PORT"'
);
fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/start.sh', content);
