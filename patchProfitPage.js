const fs = require('fs');
const path = "d:\\Erp-System\\client\\src\\Pages\\Profit.jsx";

let content = fs.readFileSync(path, 'utf8');

// Fix 1: States
const stateRegex = /const\s+\[summary,\s*setSummary\]\s*=\s*useState\(null\);\s*const\s+\[loading,\s*setLoading\]\s*=\s*useState\(true\);/;
content = content.replace(stateRegex, `const [summary, setSummary] = useState(() => {
    try {
      const cached = localStorage.getItem('profit_summary_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  });
  const [loading, setLoading] = useState(!summary);
  const [bgLoading, setBgLoading] = useState(false);`);

// Fix 2: loadSummary
const fetchRegex = /const\s+loadSummary\s*=\s*\(from\s*=\s*fromDate,\s*to\s*=\s*toDate\)\s*=>\s*\{[^}]*setLoading\(true\);[^}]*fetch\([^}]*\}\)\s*;\s*\};/s;
// Manual multiline replacement regex is safer. I'll just use split join for safety on specific phrases.
if (content.indexOf("const [summary, setSummary] = useState(null);") === -1) {
    // Attempting normalize
    content = content.replace(/\r\n/g, "\n");
}

// Try replacing directly normalized
content = content.replace(
  "const [summary, setSummary] = useState(null);\n  const [loading, setLoading] = useState(true);",
  "const [summary, setSummary] = useState(() => {\n    try {\n      const cached = localStorage.getItem('profit_summary_cache');\n      return cached ? JSON.parse(cached) : null;\n    } catch (e) { return null; }\n  });\n  const [loading, setLoading] = useState(!summary);\n  const [bgLoading, setBgLoading] = useState(false);"
);

content = content.replace(
  "const loadSummary = (from = fromDate, to = toDate) => {\n    setLoading(true);\n    fetch(SUMMARY_API + buildQS(from, to), { headers })\n      .then(r => r.json())\n      .then(d => { setSummary(d); setLoading(false); })\n      .catch(() => setLoading(false));\n  };",
  `const loadSummary = (from = fromDate, to = toDate) => {
    if (summary) setBgLoading(true);
    else setLoading(true);

    fetch(SUMMARY_API + buildQS(from, to), { headers })
      .then(r => r.json())
      .then(d => { 
        setSummary(d); 
        setLoading(false);
        setBgLoading(false);
        if (from === today() && to === today()) {
          localStorage.setItem('profit_summary_cache', JSON.stringify(d));
        }
      })
      .catch(() => {
        setLoading(false);
        setBgLoading(false);
      });
  };`
);

content = content.replace(
  "<h1>Master Profit &amp; Loss</h1>\n            <p>Click any counter card for full breakdown</p>",
  `<h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              Master Profit &amp; Loss
              {bgLoading && (
                <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              )}
            </h1>
            <p>{bgLoading ? 'Syncing fresh data...' : 'Click any counter card for full breakdown'}</p>`
);

fs.writeFileSync(path, content);
console.log("Patched Profit.jsx successfully!");
