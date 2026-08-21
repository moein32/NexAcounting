const fs = require('fs');
const path = 'src/services/testEnvironmentService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const records = db.queryAll<any>\(table\);/g, "const records = db.queryAll<any>(table as keyof DBState);");
content = content.replace(/db.deleteRecord\(table, row.id \|\| row.business_id\);/g, "db.deleteRecord(table as keyof DBState, row.id || row.business_id);");

fs.writeFileSync(path, content, 'utf8');
