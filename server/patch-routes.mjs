import fs from 'fs';

const file = 'routes.js';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Supabase import
if (!code.includes('createClient')) {
  code = code.replace(
    "import { askDoubt, summariseContent } from './aiService.js';",
    "import { askDoubt, summariseContent } from './aiService.js';\nimport { createClient } from '@supabase/supabase-js';"
  );
}

// 2. Initialize Supabase Client
if (!code.includes('const supabase =')) {
  code = code.replace(
    "const router = express.Router();",
    "const router = express.Router();\n\nconst supabaseUrl = process.env.SUPABASE_URL || '';\nconst supabaseKey = process.env.SUPABASE_ANON_KEY || '';\nconst supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;\n"
  );
}

// 3. Update Register Endpoint
const insertLogic = `
    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    // Supabase Lead Sync
    if (supabase) {
      try {
        const { error } = await supabase
          .from('leads')
          .insert([
            { name: user.name, email: user.email, role: user.role }
          ]);
        if (error) {
          console.error('Failed to sync lead to Supabase:', error.message);
        } else {
          console.log('Successfully synced lead to Supabase:', user.email);
        }
      } catch (sbErr) {
        console.error('Supabase integration error:', sbErr);
      }
    }`;

code = code.replace(
    `    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });`,
    insertLogic
);

fs.writeFileSync(file, code);
console.log('Patched routes.js');
