const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Expenses.jsx');
const raw = fs.readFileSync(p, 'utf-8');
const lines = raw.split(/\r?\n/);

// Based on the view file, we want to delete the block from line 259 to 294 (1-indexed).
// In 0-indexed, that is index 258 to 293.
// Let's confirm content check:
console.log("Target starting line content check:", lines[258]); // should be <div className="pos-stat-card">
console.log("Target ending line content check:", lines[293]);   // should be </div>

if (lines[258].includes('pos-stat-card') && lines[293].trim() === '</div>') {
   console.log("Found exact target range. Slicing...");
   // Keep 0 up to index 258 (which is BEFORE line 259). Then keep from index 294 (AFTER line 294) to the end.
   const keptLines = lines.slice(0, 258).concat(lines.slice(294));
   fs.writeFileSync(p, keptLines.join('\n'), 'utf-8');
   console.log("REDUNDANT DUPLICATES REMOVED! File clean.");
} else {
   console.log("Safety check failed. Did not find exact tags. Falling back to string search...");
   // Fallback to string search based on visual fingerprint
   const target = `<div className="pos-stat-card">
          <div className="icon orange"><Home size={24} /></div>
          <div className="info">
            <span className="label">House Total</span>
            <span className="value">Rs. {filtered.filter(r => r.expense_type === "House" && r.payment_type !== 'Pending').reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString()}</span>
          </div>
        </div>`;
   
   const first = raw.indexOf(target);
   if (first !== -1) {
      // Wait! We have two of these now. The second one is the duplicate.
      const second = raw.lastIndexOf(target);
      if (second !== -1 && second !== first) {
         // Calculate chunk from start of duplicate to nearest end </div>
         const endMark = raw.indexOf('<div className="pos-table-actions"', second);
         const cleanOut = raw.substring(0, second) + raw.substring(endMark);
         fs.writeFileSync(p, cleanOut, 'utf-8');
         console.log("Fallback string cleanout successful!");
      }
   }
}
