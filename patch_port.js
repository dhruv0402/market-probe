const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', 'utf8');

if (content.includes('8080/api')) {
   content = content.replace(/8080\/api/g, '8081/api');
   fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', content);
   console.log("Patched 8080 to 8081");
} else if (content.includes('8080')) {
   content = content.replace(/8080/g, '8081');
   fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', content);
   console.log("Patched generic 8080 to 8081");
} else {
   console.log("Not found.");
}
