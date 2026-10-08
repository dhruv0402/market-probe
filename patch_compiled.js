const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', 'utf8');

// The active tab variable is likely minified. But the string array is likely intact.
// Let's search for "['FEED','STOCKS','SIMULATOR','CHECKER','CREATORS','DATASET','HOW_IT_WORKS','PRIVACY','TERMS'].includes"
const regex = /!\['FEED','STOCKS','SIMULATOR','CHECKER','CREATORS','DATASET','HOW_IT_WORKS','PRIVACY','TERMS'\]\.includes\([a-zA-Z0-9_$]+\)/;
if (regex.test(content)) {
    // Add 'LOGIN' to the valid array to prevent 404s when old cached state hits it
    content = content.replace(regex, "!['FEED','STOCKS','SIMULATOR','CHECKER','CREATORS','DATASET','HOW_IT_WORKS','PRIVACY','TERMS','LOGIN'].includes(" + content.match(regex)[0].split('.includes(')[1]);
    fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', content);
    console.log("Patched 404 guard in compiled bundle!");
} else {
    console.log("Regex not found.");
}
