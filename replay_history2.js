const fs = require('fs');

const transcriptPath = '/Users/dhruvgourisaria/.gemini/antigravity/brain/b0bb9c6b-0944-49e0-9df6-96d06fe02af4/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');

let fileState = {};

// Use the old App.jsx as the starting state, or empty if it wasn't used.
if (fs.existsSync('/Users/dhruvgourisaria/marketprobe/frontend/src/App.jsx')) {
   fileState['/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx'] = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/App.jsx', 'utf8');
   fileState['/Users/dhruvgourisaria/nowcasting-project/frontend/src/MarketProbeApp.jsx'] = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/App.jsx', 'utf8');
}

for (const line of lines) {
    if (!line.includes('write_to_file') && !line.includes('replace_file_content')) continue;
    try {
        const data = JSON.parse(line);
        if (data.source !== 'MODEL' || !data.tool_calls) continue;
        for (const call of data.tool_calls) {
            if (call.name.includes('write_to_file') && call.arguments.TargetFile && call.arguments.TargetFile.endsWith('MarketProbeApp.jsx')) {
                fileState[call.arguments.TargetFile] = call.arguments.CodeContent;
                // keep the generic reference updated too
                fileState['MarketProbeApp'] = call.arguments.CodeContent;
            }
            if (call.name.includes('replace_file_content') && call.arguments.TargetFile && call.arguments.TargetFile.endsWith('MarketProbeApp.jsx')) {
                let content = fileState[call.arguments.TargetFile] || fileState['MarketProbeApp'] || '';
                const args = call.arguments;
                const target = args.TargetContent;
                const repl = args.ReplacementContent;
                if (target && repl) {
                    content = content.replace(target, repl);
                    fileState[call.arguments.TargetFile] = content;
                    fileState['MarketProbeApp'] = content;
                }
            }
        }
    } catch (e) {}
}

const finalContent = fileState['MarketProbeApp'] || fileState['/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx'];
if (finalContent) {
    console.log("Recovered file length: " + finalContent.length);
    fs.writeFileSync('/tmp/RecoveredApp.jsx', finalContent);
} else {
    console.log("No state found.");
}
