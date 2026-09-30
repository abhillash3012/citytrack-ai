const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('inspections').select('id, inspection_id, project_id, officer_id, status, remarks, created_at');
  if (error) console.error(error);
  else console.log('Current Supabase inspections:', JSON.stringify(data, null, 2));
}
check();
