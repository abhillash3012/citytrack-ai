const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function test() {
  const res1 = await s.rpc('current_user_role');
  console.log('current_user_role:', res1);

  // Let's test if there is any custom insert project function or similar
  const funcs = ['create_project', 'insert_project', 'add_project', 'admin_create_project'];
  for (const f of funcs) {
    const res = await s.rpc(f, {});
    console.log(`RPC '${f}':`, res.error ? res.error.message : res.data);
  }
}
test();
