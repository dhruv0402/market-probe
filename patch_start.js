const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/start.sh', 'utf8');

// Replace "npx vite --port $FRONTEND_PORT" with "npx serve -s dist -p $FRONTEND_PORT"
content = content.replace(
    'npx vite --port "$FRONTEND_PORT" --strictPort false',
    'npx serve -s dist -l tcp://0.0.0.0:"$FRONTEND_PORT"'
);

fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/start.sh', content);
