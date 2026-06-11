import fs from 'fs';

let content = fs.readFileSync('client/src/components/Reader.jsx', 'utf8');

// Replace scale(1.12) with scale(1.06) to zoom out slightly
content = content.replace(/transform: 'scale\(1\.12\)'/g, "transform: 'scale(1.06)'");

fs.writeFileSync('client/src/components/Reader.jsx', content);

console.log("Refactoring 11 done - zoomed out slightly to 1.06");
