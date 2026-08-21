const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // item.(prices || []).length -> (item.prices || []).length
    content = content.replace(/([a-zA-Z0-9_]+)\.\(([a-zA-Z0-9_]+) \|\| \[\]\)\.length/g, "($1.$2 || []).length");
    
    // item?.(prices || []).length -> (item?.prices || []).length
    content = content.replace(/([a-zA-Z0-9_]+)\?\.\(([a-zA-Z0-9_]+) \|\| \[\]\)\.length/g, "($1?.$2 || []).length");

    // item.prop.(prop2 || []).length -> (item.prop.prop2 || []).length
    content = content.replace(/([a-zA-Z0-9_\.]+)\.\(([a-zA-Z0-9_]+) \|\| \[\]\)\.length/g, "($1.$2 || []).length");
    
    // e.target.value fallback revert
    content = content.replace(/\(e\.target\.value \|\| \[\]\)\.length/g, "e.target.value.length");
    content = content.replace(/\(searchTerm \|\| \[\]\)\.length/g, "searchTerm.length");

    fs.writeFileSync(file, content, 'utf8');
}
console.log('Fixed lengths!');
