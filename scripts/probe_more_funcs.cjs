const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function probeMoreFuncs() {
  const funcs = [
    'create_project', 'insert_project', 'add_project', 'register_project',
    'admin_create_project', 'new_project', 'save_project',
    'exec_sql', 'execute_sql', 'run_sql', 'custom_sql',
    'get_schema', 'current_user_role'
  ];

  for (const f of funcs) {
    // try with no params
    const r1 = await s.rpc(f);
    if (!r1.error || r1.error.code !== 'PGRST202') {
      console.log(`Found function ${f} (no params):`, r1.error ? r1.error.message : r1.data);
    }
    // try with project object
    const r2 = await s.rpc(f, { project: {} });
    if (!r2.error || r2.error.code !== 'PGRST202') {
      console.log(`Found function ${f} (with params):`, r2.error ? r2.error.message : r2.data);
    }
  }
}

probeMoreFuncs();
