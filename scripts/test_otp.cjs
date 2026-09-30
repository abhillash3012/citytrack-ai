const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function testOtp() {
  const { data, error } = await s.auth.signInWithOtp({
    email: 'admin@citytrack.ai'
  });
  console.log('signInWithOtp result:', { data, error });
}
testOtp();
