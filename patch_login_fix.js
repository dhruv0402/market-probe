const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', 'utf8');

// 1. Remove the LOGIN tab correctly from nav array
const navItemToRemove = "{ id: 'LOGIN', label: 'Login', icon: Shield }";
const navStart = content.indexOf(navItemToRemove);
if (navStart !== -1) {
  // Find the exact line and remove it
  const lines = content.split('\\n');
  content = lines.filter(line => !line.includes("id: 'LOGIN', label: 'Login'")).join('\\n');
} else {
  console.log("Could not find nav item.");
}

// 2. Remove the actual LOGIN view correctly
const loginStart = content.indexOf("{/* TAB 7.5: DEDICATED FULL-PAGE INSTITUTIONAL LOGIN          */}");
const loginEndStr = "{/* ========================================================= */}\\n        {/* TAB 8: PRIVACY POLICY";
const loginEnd = content.indexOf(loginEndStr);

if (loginStart !== -1 && loginEnd !== -1) {
    // Find where the previous block ends (a few lines above loginStart)
    const blockStart = content.lastIndexOf("{/* ========================================================= */}", loginStart);
    if (blockStart !== -1) {
       content = content.substring(0, blockStart) + content.substring(loginEnd);
    }
} else {
  console.log("Could not find login view boundaries.", loginStart, loginEnd);
}

fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', content);
console.log("Fixed Login removal.");
