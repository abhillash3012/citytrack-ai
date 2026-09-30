const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    console.log('RPC get_policies error:', error.message);
  } else {
    console.log('Policies:', data);
  }
}

checkPolicies();
