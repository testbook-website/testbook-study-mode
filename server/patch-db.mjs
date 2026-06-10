import fs from 'fs';
import path from 'path';

const file = 'db.js';
let code = fs.readFileSync(file, 'utf8');

// Change db-data to .db-data
code = code.replace(
  "const DATA_DIR = path.join(__dirname, 'db-data');",
  "const DATA_DIR = path.join(__dirname, '.db-data');"
);

fs.writeFileSync(file, code);

// Move the directory if it exists
if (fs.existsSync('db-data')) {
  if (!fs.existsSync('.db-data')) {
    fs.renameSync('db-data', '.db-data');
  }
}
console.log('Patched db.js and moved db-data to .db-data');
