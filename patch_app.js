const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', 'utf8');

// 1. Inject tourRect state and effect
const stateInjectionPoint = "const [tourStep, setTourStep] = useState(0);";
const stateCode = `const [tourStep, setTourStep] = useState(0);
  const [tourRect, setTourRect] = useState(null);

  useEffect(() => {
    if (!tourActive) return;
    const updateRect = () => {
      const stepToId = {
        0: 'marketprobe-tape',
        1: 'marketprobe-conviction-btn',
        2: 'marketprobe-tour-feed-card',
        3: 'marketprobe-checker-input',
        4: 'marketprobe-tour-simulator-controls',
        5: 'marketprobe-tour-dataset'
      };
      const el = document.getElementById(stepToId[tourStep]);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTourRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 300);
      } else {
        // Retry once in case element is rendering
        setTimeout(() => {
          const retryEl = document.getElementById(stepToId[tourStep]);
          if (retryEl) {
             retryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
             const rect = retryEl.getBoundingClientRect();
             setTourRect({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height });
          }
        }, 500);
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [tourStep, tourActive, activeTab]);`;
content = content.replace(stateInjectionPoint, stateCode);

// 2. Add IDs to target elements
// Feed Card (first one only)
content = content.replace(
  "                  <div\n                    key={tip.id}\n                    style={{",
  "                  <div\n                    id={tip.id === tipsList[0]?.id ? 'marketprobe-tour-feed-card' : undefined}\n                    key={tip.id}\n                    style={{"
);

// Checker Input
content = content.replace(
  "              <textarea\n                rows={3}\n                value={checkerInput}",
  "              <textarea\n                id=\"marketprobe-checker-input\"\n                rows={3}\n                value={checkerInput}"
);

// Simulator Controls Parent
content = content.replace(
  "        {activeTab === 'SIMULATOR' && (\n          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>",
  "        {activeTab === 'SIMULATOR' && (\n          <div id=\"marketprobe-tour-simulator-controls\" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>"
);

// Dataset Parent
content = content.replace(
  "        {activeTab === 'DATASET' && (\n          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>",
  "        {activeTab === 'DATASET' && (\n          <div id=\"marketprobe-tour-dataset\" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>"
);

fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', content);
