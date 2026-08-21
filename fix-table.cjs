const fs = require('fs');
const path = 'src/components/ui/DataTable.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/return data;/g, "return data || [];");
content = content.replace(/return data.filter/g, "return (data || []).filter");

fs.writeFileSync(path, content, 'utf8');
