const fs = require('fs');
const path = require('path');

const targetPath = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Billing.jsx');
let content = fs.readFileSync(targetPath, 'utf-8');

// Comprehensive injection bundle containing the new, fixed logic:
const finalBundle = `  const addToCart = (product) => {
    const maxStock = parseFloat(product.stock_quantity) || 0;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      const newQty = existing.qty + 1;
      if (newQty > maxStock) {
        alert(\`OUT OF STOCK! Maximum available stock for \${product.name} is \${maxStock}.\`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, qty: newQty, subtotal: newQty * item.price } : item
      ));
    } else {
      if (maxStock <= 0) {
        alert(\`OUT OF STOCK! \${product.name} has zero inventory left.\`);
        return;
      }
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: parseFloat(product.price), 
        qty: 1, 
        subtotal: parseFloat(product.price) 
      }]);
    }
  };

  const updateQty = (id, delta) => {
    const pInfo = products.find(prod => prod.id === id);
    const maxAllowed = pInfo ? parseFloat(pInfo.stock_quantity || 0) : Infinity;
    setCart(cart.map(item => {
      if (item.id === id) {
        const currentQty = parseFloat(item.qty) || 0;
        let newQty = currentQty + delta;
        if (newQty > maxAllowed) {
          alert(\`Out of Stock Limit reached! Available: \${maxAllowed}\`);
          newQty = maxAllowed;
        }
        newQty = Math.max(1, newQty);
        return { ...item, qty: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const setQtyDirect = (id, value) => {
    const pInfo = products.find(prod => prod.id === id);
    const maxAllowed = pInfo ? parseFloat(pInfo.stock_quantity || 0) : Infinity;
    setCart(cart.map(item => {
      if (item.id === id) {
        const parsed = parseFloat(value);
        let finalVal = isNaN(parsed) ? '' : Math.max(0, parsed);
        if (finalVal !== '' && finalVal > maxAllowed) {
          alert(\`Cannot exceed stock limit of \${maxAllowed}\`);
          finalVal = maxAllowed;
        }
        const subtotalQty = finalVal === '' ? 0 : finalVal;
        return { ...item, qty: finalVal, subtotal: subtotalQty * item.price };
      }
      return item;
    }));
  };`;

// This Regex finds from the start of addToCart to the end of the 3rd function block
const findRegex = /const addToCart = \([\s\S]*?const setQtyDirect = \([^)]*\) => {[\s\S]*?};\s+};/; 
// Wait, let me write a more precise Regex matching approach.

// Better yet, let's use string indices derived from unambiguous text tokens!
const startIndex = content.indexOf('const addToCart = (product) => {');
// The block ends where updatePrice begins
const endIndex = content.indexOf('const updatePrice = (id, newPrice) => {');

if (startIndex === -1 || endIndex === -1) {
  console.error("FAILURE: Could not establish logical boundaries via string index lookup.");
  process.exit(1);
}

const preBlock = content.substring(0, startIndex);
const postBlock = content.substring(endIndex);

const output = preBlock + finalBundle.trim() + "\\n\\n  " + postBlock;
fs.writeFileSync(targetPath, output, 'utf-8');
console.log("SUCCESS: Final surgery completed! Cart quantity enforcement is LIVE.");
