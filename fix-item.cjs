const fs = require('fs');
const path = 'src/services/itemService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/list\.map/g, "(list || []).map");
content = content.replace(/input\.prices\.map/g, "(input.prices || []).map");
content = content.replace(/input\.attributes\.map/g, "(input.attributes || []).map");
content = content.replace(/prices\.map/g, "(prices || []).map");

fs.writeFileSync(path, content, 'utf8');
