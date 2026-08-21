const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/features');
let changedFiles = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace {variable.map with {(variable || []).map
    // Exclude variables that are already expressions or literals.
    content = content.replace(/\{([a-zA-Z0-9_]+)\.map\(/g, "={($1 || []).map(");
    // Remove the extra = we just added (oops):
    content = content.replace(/=\{\(([a-zA-Z0-9_]+) \|\| \[\]\)\.map\(/g, "{($1 || []).map(");
    
    // Also protect lengths: {variable.length with {(variable || []).length
    content = content.replace(/\{([a-zA-Z0-9_]+)\.length/g, "{($1 || []).length");

    // Also variable?.length > 0 to (variable || []).length > 0
    content = content.replace(/([a-zA-Z0-9_]+)\.length/g, "($1 || []).length");
    content = content.replace(/\(\(([a-zA-Z0-9_]+) \|\| \[\]\)\.length/g, "(($1 || []).length");

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
}
console.log(`Changed ${changedFiles} files`);
