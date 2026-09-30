const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function test() {
  const { data } = await supabase.from('contractors').select('id, data_json').eq('id', 'CON-001');
  console.log('CON-001 data_json:', JSON.stringify(data[0].data_json, null, 2));
}
test();
