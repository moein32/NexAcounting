const fs = require('fs');
const path = 'src/services/documentService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/items\.map/g, "(items || []).map");
content = content.replace(/productLines\.map/g, "(productLines || []).map");
content = content.replace(/bizDocs\.map/g, "(bizDocs || []).map");

fs.writeFileSync(path, content, 'utf8');
