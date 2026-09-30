const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function findFunctions() {
  const commonFuncs = [
    'sql', 'query', 'execute', 'run', 'seed', 'seed_data', 'seed_database',
    'insert_project', 'create_project', 'setup', 'init', 'migrate', 'migration',
    'get_projects', 'get_alerts', 'get_contractors', 'get_inspections',
    'is_admin', 'current_user_role', 'set_updated_at'
  ];
  for (const fn of commonFuncs) {
    const { data, error } = await s.rpc(fn);
    console.log(`Function '${fn}':`, error ? `${error.code}: ${error.message}` : `SUCCESS: ${JSON.stringify(data)}`);
  }
}
findFunctions();
