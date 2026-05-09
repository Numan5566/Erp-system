const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Billing.jsx');
const raw = fs.readFileSync(p, 'utf-8');
const lines = raw.split(/\\r?\\n/);

// We need to remove from approx line 372 to 388
// Let's locate them by content to be 100% safe and precise.
// We want to delete ONE instance of the duplicated block.
const duplicatedText = `    // Master Inventory Lockdown Check
    let exceedsLimit = false;
    let brokenItemName = "";
    cart.forEach(item => {
      const p = products.find(x => String(x.id) === String(item.id));
      const stock = p ? parseFloat(p.stock_quantity || 0) : 0;
      if (parseFloat(item.qty || 0) > stock) {
        exceedsLimit = true;
        brokenItemName = item.name;
      }
    });

    if (exceedsLimit) {
      alert(\`ERROR: Cannot complete sale. \${brokenItemName} quantity exceeds available stock limit! Please fix the cart first.\`);
      return;
    }`;

// Let's split by that string. If it appears twice, we combine with one instance.
const splitParts = raw.split(duplicatedText);
if (splitParts.length > 2) {
    // It's duplicated! Join with only one instance separator!
    console.log("Detected duplication! Collapsing to single instance...");
    const corrected = splitParts[0] + duplicatedText + splitParts.slice(2).join(duplicatedText);
    fs.writeFileSync(p, corrected, 'utf-8');
    console.log("FIXED! Duplicate removed safely.");
} else {
    console.log("Duplicated block not found by literal string match. Trying alternative method...");
    // Fallback: search for indices of 'let exceedsLimit = false;'
    const first = raw.indexOf('let exceedsLimit = false;');
    const second = raw.lastIndexOf('let exceedsLimit = false;');
    if (first !== -1 && second !== -1 && first !== second) {
       console.log("Found multiple exceedsLimit declarations by index!");
       // Find the block boundaries surrounding the second occurrence
       const secondBlockStart = raw.lastIndexOf('// Master Inventory Lockdown Check', second);
       const secondBlockEnd = raw.indexOf('return;', second) + 8; // approximately end of the block
       const cleaned = raw.substring(0, secondBlockStart) + raw.substring(secondBlockEnd);
       fs.writeFileSync(p, cleaned, 'utf-8');
       console.log("FIXED! Duplicate excised by index search.");
    }
}
