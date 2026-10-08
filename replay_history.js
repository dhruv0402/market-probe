const fs = require('fs');

const transcriptPath = '/Users/dhruvgourisaria/.gemini/antigravity/brain/b0bb9c6b-0944-49e0-9df6-96d06fe02af4/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');

let fileState = {};

for (const line of lines) {
    if (!line.includes('default_api:write_to_file') && !line.includes('default_api:replace_file_content')) continue;
    try {
        const data = JSON.parse(line);
        if (data.source !== 'MODEL' || !data.tool_calls) continue;
        for (const call of data.tool_calls) {
            if (call.name === 'default_api:write_to_file' && call.arguments.TargetFile.endsWith('MarketProbeApp.jsx')) {
                fileState[call.arguments.TargetFile] = call.arguments.CodeContent;
            }
            if (call.name === 'default_api:replace_file_content' && call.arguments.TargetFile.endsWith('MarketProbeApp.jsx')) {
                let content = fileState[call.arguments.TargetFile] || '';
                if (!content && fs.existsSync(call.arguments.TargetFile)) {
                   content = fs.readFileSync(call.arguments.TargetFile, 'utf8');
                }
                const args = call.arguments;
                // replace_file_content replaces TargetContent with ReplacementContent
                const target = args.TargetContent;
                const repl = args.ReplacementContent;
                if (target && repl) {
                    content = content.replace(target, repl);
                    fileState[call.arguments.TargetFile] = content;
                }
            }
        }
    } catch (e) {}
}

const targetFile = '/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx';
if (fileState[targetFile]) {
    console.log("Recovered file length: " + fileState[targetFile].length);
    fs.writeFileSync('/tmp/RecoveredApp.jsx', fileState[targetFile]);
} else {
    console.log("No state found.");
}
