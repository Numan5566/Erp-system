const fs = require('fs');
const path = "d:\\Erp-System\\client\\src\\Pages\\Billing.jsx";

let content = fs.readFileSync(path, 'utf8');
if (content.indexOf('\r\n') !== -1) content = content.replace(/\r\n/g, '\n');

// 1. Update useEffect to read cache
const targetEffect = "useEffect(() => { fetchData(); }, [activeTab]);";
const replacementEffect = `useEffect(() => {
    // PRE-LOAD CACHE INSTANTLY FOR ZERO SECOND DELAY
    try {
      const cachedProds = localStorage.getItem(\`cache_products_\${activeTab}\`);
      const cachedCusts = localStorage.getItem(\`cache_customers_\${activeTab}\`);
      const cachedVehs = localStorage.getItem(\`cache_vehicles_\${activeTab}\`);
      const cachedSales = localStorage.getItem(\`cache_sales_\${activeTab}\`);
      const cachedBanks = localStorage.getItem(\`cache_banks_list\`);
      
      if (cachedProds) setProducts(JSON.parse(cachedProds));
      if (cachedCusts) setCustomers(JSON.parse(cachedCusts));
      if (cachedVehs) setVehicles(JSON.parse(cachedVehs));
      if (cachedSales) setSales(JSON.parse(cachedSales));
      if (cachedBanks) setBankAccounts(JSON.parse(cachedBanks).filter(b => b.module_type !== 'Admin Recipient'));
    } catch (e) { console.error('Cache read fail', e); }

    fetchData(); 
  }, [activeTab]);`;

content = content.replace(targetEffect, replacementEffect);

// 2. Update fetchData to SAVE to cache at end
const targetSaveArea = `    if (Array.isArray(labours)) {
      setLabourGroups([...new Set(labours.map(l => l.group_name))]);
    }`;

const replacementSaveArea = `    if (Array.isArray(labours)) {
      setLabourGroups([...new Set(labours.map(l => l.group_name))]);
    }
    // PERSIST CACHE SILENTLY FOR NEXT VISIT
    try {
      localStorage.setItem(\`cache_products_\${activeTab}\`, JSON.stringify(prods));
      localStorage.setItem(\`cache_customers_\${activeTab}\`, JSON.stringify(custs));
      localStorage.setItem(\`cache_vehicles_\${activeTab}\`, JSON.stringify(vehs));
      localStorage.setItem(\`cache_sales_\${activeTab}\`, JSON.stringify(sls));
      localStorage.setItem(\`cache_banks_list\`, JSON.stringify(banks));
    } catch (e) { }`;

content = content.replace(targetSaveArea, replacementSaveArea);

fs.writeFileSync(path, content);
console.log("Successfully connected Billing.jsx to Global Pre-loading System!");
