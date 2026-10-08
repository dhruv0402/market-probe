const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', 'utf8');

const searchStr = "FEED\",\"STOCKS\",\"SIMULATOR\",\"CHECKER\",\"CREATORS\",\"DATASET\",\"HOW_IT_WORKS\",\"PRIVACY\",\"TERMS\"";
if (content.includes(searchStr)) {
    content = content.replace(searchStr, searchStr + ",\"LOGIN\"");
    fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', content);
    console.log("Patched array!");
} else {
    // maybe it uses single quotes
    const searchStr2 = "'FEED','STOCKS','SIMULATOR','CHECKER','CREATORS','DATASET','HOW_IT_WORKS','PRIVACY','TERMS'";
    if (content.includes(searchStr2)) {
        content = content.replace(searchStr2, searchStr2 + ",'LOGIN'");
        fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', content);
        console.log("Patched array (single quotes)!");
    } else {
        // maybe it uses backticks
        const searchStr3 = "`FEED`,`STOCKS`,`SIMULATOR`,`CHECKER`,`CREATORS`,`DATASET`,`HOW_IT_WORKS`,`PRIVACY`,`TERMS`";
        if (content.includes(searchStr3)) {
            content = content.replace(searchStr3, searchStr3 + ",`LOGIN`");
            fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/dist/assets/index-ZQHcYFpD.js', content);
            console.log("Patched array (backticks)!");
        } else {
             console.log("Not found.");
        }
    }
}
