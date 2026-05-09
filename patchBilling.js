const fs = require('fs');
const path = require('path');

const targetPath = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Billing.jsx');

if (!fs.existsSync(targetPath)) {
  console.error("File not found at: " + targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf-8');
const originalLen = content.length;

// 1. Replace addToCart
const oldAdd = `  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price } : item
      ));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: parseFloat(product.price), 
        qty: 1, 
        subtotal: parseFloat(product.price) 
      }]);
    }
  };`;

const newAdd = `  const addToCart = (product) => {
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
  };`;

// 2. Replace updateQty
const oldUpd = `  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const currentQty = parseFloat(item.qty) || 0;
        const newQty = Math.max(1, currentQty + delta);
        return { ...item, qty: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };`;

const newUpd = `  const updateQty = (id, delta) => {
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
  };`;

// 3. Replace setQtyDirect
const oldDirect = `  const setQtyDirect = (id, value) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const parsed = parseFloat(value);
        const newQty = isNaN(parsed) ? '' : Math.max(0, parsed);
        const subtotalQty = newQty === '' ? 0 : newQty;
        return { ...item, qty: value, subtotal: subtotalQty * item.price };
      }
      return item;
    }));
  };`;

const newDirect = `  const setQtyDirect = (id, value) => {
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

// Standardize line breaks to simplify replacement
const normalized = content.replace(/\\r\\n/g, '\\n');
let final = normalized.replace(oldAdd.trim(), newAdd.trim());
final = final.replace(oldUpd.trim(), newUpd.trim());
final = final.replace(oldDirect.trim(), newDirect.trim());

if (final.length === normalized.length) {
  console.log("FAILURE: String.replace could not locate target blocks.");
  process.exit(1);
} else {
  fs.writeFileSync(targetPath, final, 'utf-8');
  console.log("SUCCESS: Applied React stock checking logic safely using Node.js!");
}
