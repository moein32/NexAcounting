const fs = require('fs');
const path = 'src/features/catalog/pages/EditItemPage.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/categories\.map/g, "(categories || []).map");
content = content.replace(/units\.map/g, "(units || []).map");
content = content.replace(/priceLists\.map/g, "(priceLists || []).map");
content = content.replace(/plists\.map/g, "(plists || []).map");
content = content.replace(/item\.attributes\.map/g, "(item.attributes || []).map");
content = content.replace(/attributes\.map/g, "(attributes || []).map");

fs.writeFileSync(path, content, 'utf8');
