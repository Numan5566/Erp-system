const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Expenses.jsx');
let src = fs.readFileSync(p, 'utf-8');

// 1. Filter logic
src = src.replace(
  `const matchType = filterType === "All" || r.expense_type === filterType;`,
  `const matchType = filterType === "All" ? true : filterType === "Pending Only" ? r.payment_type === 'Pending' : r.expense_type === filterType;`
);

// 2. Stats grid replacement. We find the stats-grid-pos block.
const gridStart = src.indexOf('<div className="stats-grid-pos"');
const gridEnd = src.indexOf('</div>', src.indexOf('Grand Total', gridStart)) + 20; 
// Let's construct simpler replacement around key anchors.
src = src.replace(
  /<div className="stats-grid-pos" style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(220px, 1fr\)\)', gap: '20px' \}\}>([\s\S]*?)<\/div>(\s*)<\/div>/,
  `<div className="stats-grid-pos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div className="pos-stat-card">
          <div className="icon blue"><Building2 size={24} /></div>
          <div className="info">
            <span className="label">Office Total</span>
            <span className="value">Rs. {filtered.filter(r => r.expense_type === "Office" && r.payment_type !== 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon orange"><Home size={24} /></div>
          <div className="info">
            <span className="label">House Total</span>
            <span className="value">Rs. {filtered.filter(r => r.expense_type === "House" && r.payment_type !== 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon blue" style={{ background: '#ecfeff', color: '#0891b2' }}><Truck size={24} /></div>
          <div className="info">
            <span className="label">Personal Veh.</span>
            <span className="value">Rs. {filtered.filter(r => r.expense_type === "Personal Vehicle" && r.payment_type !== 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon orange" style={{ background: '#fff7ed', color: '#c2410c' }}><Truck size={24} /></div>
          <div className="info">
            <span className="label">Supplier Veh.</span>
            <span className="value">Rs. {filtered.filter(r => (r.expense_type === "Supplier Vehicle" || r.category === 'Transport') && r.payment_type !== 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon red" style={{ background: '#fef2f2', color: '#ef4444' }}><CircleDollarSign size={24} /></div>
          <div className="info">
            <span className="label" style={{color: '#ef4444', fontWeight: 'bold'}}>PENDING TOTAL</span>
            <span className="value" style={{color: '#b91c1c', fontWeight: '900'}}>Rs. {filtered.filter(r => r.payment_type === 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="pos-stat-card">
          <div className="icon green"><Wallet size={24} /></div>
          <div className="info">
            <span className="label">Grand Paid Total</span>
            <span className="value">Rs. {filtered.filter(r => r.payment_type !== 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>`
);

// 3. Filter Tabs List
src = src.replace(
  '["All", "Office", "House", "Personal Vehicle", "Galla Closeout", "Admin Payment"]',
  '["All", "Pending Only", "Supplier Vehicle", "Personal Vehicle", "Office", "House", "Galla Closeout", "Admin Payment"]'
);

// 4. Select Option In Modal
src = src.replace(
  '<option value="Personal Vehicle">Personal Vehicle</option>',
  '<option value="Personal Vehicle">Personal Vehicle</option>\n                      <option value="Supplier Vehicle">Supplier Vehicle</option>'
);

fs.writeFileSync(p, src, 'utf-8');
console.log("Expenses.jsx successfully modified with dynamic Regex and replacements.");
