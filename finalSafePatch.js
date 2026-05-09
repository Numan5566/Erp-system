const fs = require('fs');
const path = require('path');

const targetPath = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Billing.jsx');
let content = fs.readFileSync(targetPath, 'utf-8');

// 1. Update logic blocks to allow input but provide runtime inspection data
const logicBundle = `  const addToCart = (product) => {
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
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const currentQty = parseFloat(item.qty) || 0;
        const newQty = Math.max(1, currentQty + delta);
        return { ...item, qty: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const setQtyDirect = (id, value) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const parsed = parseFloat(value);
        const finalVal = isNaN(parsed) ? '' : Math.max(0, parsed);
        const subtotalQty = finalVal === '' ? 0 : finalVal;
        return { ...item, qty: finalVal, subtotal: subtotalQty * item.price };
      }
      return item;
    }));
  };`;

// Replace Logic functions (177 to updatePrice start)
const startLogic = content.indexOf('const addToCart = (product) => {');
const endLogic = content.indexOf('const updatePrice = (id, newPrice) => {');

if (startLogic === -1 || endLogic === -1) throw new Error("Could not find logic functions boundaries");

content = content.substring(0, startLogic) + logicBundle.trim() + "\\n\\n  " + content.substring(endLogic);

// 2. Inject Validation into handleCheckout
const checkPoint = content.indexOf('if (cart.length === 0) return alert("Cart is empty!");');
if (checkPoint === -1) throw new Error("Could not find handleCheckout anchor");

const abortInCheckout = `    if (cart.length === 0) return alert("Cart is empty!");
    
    // Master Inventory Lockdown Check
    let exceedsLimit = false;
    let brokenItemName = "";
    cart.forEach(item => {
      const p = products.find(x => x.id === item.id);
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

content = content.replace('if (cart.length === 0) return alert("Cart is empty!");', abortInCheckout);

// 3. Visual Component Map modification (Inline warning)
const mapStart = content.indexOf('return (\\n                    <div key={item.id} className={`cart-item ${compactClass}`}>');
// Wait, that map block uses template literal style. Better lookup by distinct container line.
const specificItemMap = "return (\\n                    <div key={item.id} className={`cart-item ${compactClass}`}>";

// Actually let's use a cleaner approach for the loop inside the JSX.
// We'll find: {cart.map(item => {
// And inject the calculation.

const iteratorAnchor = "{cart.map(item => {";
const newIteratorBody = `{cart.map(item => {
                  const pInfo = products.find(p => p.id === item.id);
                  const maxStock = pInfo ? parseFloat(pInfo.stock_quantity || 0) : 0;
                  const isOver = parseFloat(item.qty || 0) > maxStock;
`;

// Wait, I need to replace just the line AFTER the '{cart.map(item => {'
content = content.replace(iteratorAnchor, newIteratorBody);

// 4. Modify HTML structure for cart-item to support error class & message
const itemTopOld = '<div className="item-top">';
const itemTopNew = '<div className="item-top">'; // Wait, we modify children.

// Find item name span
const nameSpanAnchor = '<span className="name">{item.name}</span>';
const nameSpanNew = '<span className="name" style={{color: isOver ? "#dc2626" : "inherit", fontWeight: isOver ? "700" : "inherit"}}>{item.name} {isOver && <span style={{background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontSize: "0.6rem", marginLeft: "6px"}}>Out of Stock</span>}</span>';

content = content.replace(nameSpanAnchor, nameSpanNew);

// 5. Apply extra border/shadow for failed card row
const cartItemLine = "className={`cart-item ${compactClass}`}";
const cartItemMod = "className={`cart-item ${compactClass} ${isOver ? 'over-stock-row' : ''}`} style={isOver ? {borderColor: '#fecaca', background: '#fffafb', boxShadow: '0 0 0 1px #ef4444 inset'} : {}}";

content = content.replace(cartItemLine, cartItemMod);

// 6. Disable Checkout button dynamically so visually blocked
const btnLabel = 'label={loading ? "Processing..." : "Complete Sale"}';
const btnDisabledOld = 'disabled={loading || cart.length === 0}';
const btnDisabledNew = 'disabled={loading || cart.length === 0 || cart.some(item => { const p = products.find(x => x.id === item.id); return parseFloat(item.qty || 0) > parseFloat(p ? p.stock_quantity : 0); })}';

content = content.replace(btnDisabledOld, btnDisabledNew);

fs.writeFileSync(targetPath, content, 'utf-8');
console.log("SUCCESS: Unified Visual Inline + Checkout Locking system fully installed.");
