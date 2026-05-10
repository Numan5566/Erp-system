const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'server', 'server.js');
let content = fs.readFileSync(p, 'utf-8');

// The exact injected block:
const regex = /const pool = require\('\.\/config\/db'\);\s*app\.get\('\/api\/auth\/emergency-cloud-nuke-data-wipe-x99'[\s\S]*?\}\);\s*const PORT/;

content = content.replace(regex, 'const PORT');

fs.writeFileSync(p, content, 'utf-8');
console.log("VULNERABILITY SEALED: Cloud Wipe Route has been permanently excised.");
