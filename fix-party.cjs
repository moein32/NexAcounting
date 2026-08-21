const fs = require('fs');
const path = 'src/services/partyService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/list\.map/g, "(list || []).map");
content = content.replace(/rolesToInsert\.map/g, "(rolesToInsert || []).map");
content = content.replace(/input\.contacts\.map/g, "(input.contacts || []).map");
content = content.replace(/input\.addresses\.map/g, "(input.addresses || []).map");
content = content.replace(/roles\.map/g, "(roles || []).map");
content = content.replace(/rawEntries\.map/g, "(rawEntries || []).map");

fs.writeFileSync(path, content, 'utf8');
