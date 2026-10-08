const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', 'utf8');

// 1. Remove LOGIN from nav bar mapping
const navItemToRemove = "              { id: 'LOGIN', label: 'Login', icon: UserCircle },";
content = content.replace(navItemToRemove, "");

// 2. Remove the actual LOGIN tab view code
const loginStart = content.indexOf("{/* FULL PAGE LOGIN VIEW */}");
const loginEndStr = "{/* PRIVACY POLICY */}";
const loginEnd = content.indexOf(loginEndStr);

if (loginStart !== -1 && loginEnd !== -1) {
    content = content.substring(0, loginStart) + content.substring(loginEnd);
}

// 3. Update the 404 guard to remove LOGIN from the valid tabs (it wasn't in it anyway, which caused 404, but let's make sure it's clean)
content = content.replace(
    "{(activeTab === '404' || !['FEED', 'STOCKS', 'SIMULATOR', 'CHECKER', 'CREATORS', 'DATASET', 'HOW_IT_WORKS', 'PRIVACY', 'TERMS'].includes(activeTab)) && (",
    "{(activeTab === '404' || !['FEED', 'STOCKS', 'SIMULATOR', 'CHECKER', 'CREATORS', 'DATASET', 'HOW_IT_WORKS', 'PRIVACY', 'TERMS'].includes(activeTab)) && ("
); // Same thing, just confirming it matches

fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', content);
console.log("Login page removed successfully.");
