const fs = require('fs');
const path = require('path');

const searchDir = path.join('d:', 'Erp-System', 'server');

function walkDir(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules') return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf-8');
            
            if (content.includes(".toISOString().split('T')[0]")) {
                console.log(`Fixing pattern in SERVER: ${filePath}`);
                content = content.split(".toISOString().split('T')[0]").join(".toLocaleDateString('en-CA')");
                fs.writeFileSync(filePath, content, 'utf-8');
            } else if (content.includes('.toISOString().split("T")[0]')) {
                console.log(`Fixing double-quote pattern in SERVER: ${filePath}`);
                content = content.split('.toISOString().split("T")[0]').join(".toLocaleDateString('en-CA')");
                fs.writeFileSync(filePath, content, 'utf-8');
            }
        }
    });
}

walkDir(searchDir);
console.log("SUCCESS: Backend fully hardened against ISO drift.");
