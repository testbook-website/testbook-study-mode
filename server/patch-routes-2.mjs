import fs from 'fs';

const file = 'routes.js';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove top-level initialization
code = code.replace(
  "const supabaseUrl = process.env.SUPABASE_URL || '';\nconst supabaseKey = process.env.SUPABASE_ANON_KEY || '';\nconst supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;\n",
  ""
);

// 2. Add local initialization inside the route
const oldInsertLogic = `    // Supabase Lead Sync
    if (supabase) {`;

const newInsertLogic = `    // Supabase Lead Sync
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
    
    if (supabase) {`;

code = code.replace(oldInsertLogic, newInsertLogic);

fs.writeFileSync(file, code);
console.log('Patched routes.js for lazy Supabase initialization');
