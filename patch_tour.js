const fs = require('fs');
let content = fs.readFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', 'utf8');

const oldTourStart = content.indexOf('{tourActive && (\\n        <div style={{\\n          position: \\'fixed\\',');
const oldTourEndStr = '      {/* ----------------------------------------------------------- */}';
const oldTourEnd = content.indexOf(oldTourEndStr, oldTourStart);

if (oldTourStart !== -1 && oldTourEnd !== -1) {
  const spotlightTourCode = \`{tourActive && tourRect && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99999 }}>
          
          {/* Spotlight Hole */}
          <div style={{
            position: 'absolute',
            top: tourRect.top - 12,
            left: tourRect.left - 12,
            width: tourRect.width + 24,
            height: tourRect.height + 24,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none'
          }} />
          
          {/* Spotlight Tooltip / Popover */}
          <div style={{
            position: 'absolute',
            top: (tourRect.top + tourRect.height + 340 > document.documentElement.scrollHeight) 
                 ? (tourRect.top - 320) 
                 : (tourRect.top + tourRect.height + 24),
            left: Math.max(20, Math.min(tourRect.left, window.innerWidth - 380)),
            width: '340px',
            pointerEvents: 'auto',
            background: 'linear-gradient(135deg, #0e1526 0%, #131d33 100%)',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(16, 185, 129, 0.25)',
            animation: 'fadeIn 0.2s ease-out',
            transition: 'top 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Step Counter Badge & Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#10b981', color: '#000000', fontSize: '11px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px' }}>
                  GUIDED TOUR
                </span>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                  STEP {tourStep + 1} OF 6
                </span>
              </div>

              <button
                onClick={skipTour}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Skip</span>
                <X size={16} />
              </button>
            </div>

            {/* Tour Step Content */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                {tourStep === 0 && 'Live WebSockets Ticks'}
                {tourStep === 1 && 'Bayesian Alpha Gating'}
                {tourStep === 2 && 'Verifiable Video Proof'}
                {tourStep === 3 && 'Instant Fact-Checker'}
                {tourStep === 4 && 'P&L Portfolio Simulator'}
                {tourStep === 5 && 'Master Audited Dataset'}
              </h3>
              
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6', marginTop: '10px' }}>
                {tourStep === 0 && 'Direct sub-millisecond price ticks streaming from the NSE via WebSockets. No page reloads needed.'}
                {tourStep === 1 && 'Our core innovation. One click activates the Bayesian XGBoost model, eliminating negative expected value calls.'}
                {tourStep === 2 && 'Every audited call is matched with exact entry/target levels and verifiable timestamps.'}
                {tourStep === 3 && 'Copy-paste any tip from WhatsApp to extract symbols and prices in under 1.56ms.'}
                {tourStep === 4 && 'Execute sub-10ms Monte Carlo backtests across all 995 calls or create your own setups.'}
                {tourStep === 5 && 'Full institutional transparency. Download the entire CSV data lake for your own research.'}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 1, 2, 3, 4, 5].map(dot => (
                  <div
                    key={dot}
                    onClick={() => {
                      setTourStep(dot);
                      if (dot <= 2) setActiveTab('FEED');
                      if (dot === 3) setActiveTab('CHECKER');
                      if (dot === 4) setActiveTab('SIMULATOR');
                      if (dot === 5) setActiveTab('DATASET');
                    }}
                    style={{
                      width: dot === tourStep ? '20px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: dot === tourStep ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {tourStep > 0 && (
                  <button
                    onClick={() => {
                      const prev = tourStep - 1;
                      setTourStep(prev);
                      if (prev <= 2) setActiveTab('FEED');
                      if (prev === 3) setActiveTab('CHECKER');
                      if (prev === 4) setActiveTab('SIMULATOR');
                      if (prev === 5) setActiveTab('DATASET');
                    }}
                    style={{ background: '#162032', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                )}

                <button
                  onClick={() => {
                    const next = tourStep + 1;
                    if (next < 6) {
                      setTourStep(next);
                      if (next <= 2) setActiveTab('FEED');
                      if (next === 3) setActiveTab('CHECKER');
                      if (next === 4) setActiveTab('SIMULATOR');
                      if (next === 5) setActiveTab('DATASET');
                    } else {
                      skipTour();
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#000000',
                    border: 'none',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {tourStep === 5 ? 'Finish' : 'Next →'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
\n\` + oldTourEndStr;

  content = content.substring(0, oldTourStart) + spotlightTourCode + content.substring(oldTourEnd + oldTourEndStr.length);
  fs.writeFileSync('/Users/dhruvgourisaria/marketprobe/frontend/src/MarketProbeApp.jsx', content);
  console.log("Tour successfully replaced.");
} else {
  console.log("Could not find tour boundaries.");
}
