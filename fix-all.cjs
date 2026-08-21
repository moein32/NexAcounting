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
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
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
    
    // Pattern to catch common unprotected data sets
    // e.g. setCategories(data) -> setCategories(data || [])
    // but only if not already protected
    
    // Instead of complex regex, let's just protect the maps
    // like {items.map -> {(items || []).map
    // and item.prices?.map
    
    // Wait, the easier way is to just do a safe replacement of `.map` on common arrays in rendering.
    // Or replace `setItems(data)` with `setItems(data || [])`.
    
    content = content.replace(/set([A-Z][a-zA-Z0-9]*)\((data|result\.data|cats|lists)\)/g, "set$1($2 || [])");
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
    }
}
console.log(`Changed ${changedFiles} files`);
