const fs = require('fs');
const path = 'src/services/inventoryService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/warehouses\.map/g, "(warehouses || []).map");
content = content.replace(/balances\.map/g, "(balances || []).map");
content = content.replace(/docs\.map/g, "(docs || []).map");
content = content.replace(/input\.items\.map/g, "(input.items || []).map");
content = content.replace(/txs\.map/g, "(txs || []).map");
content = content.replace(/bizCounts\.map/g, "(bizCounts || []).map");

fs.writeFileSync(path, content, 'utf8');
