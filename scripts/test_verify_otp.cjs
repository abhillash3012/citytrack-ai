const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function testVerify() {
  const { data, error } = await s.auth.verifyOtp({
    email: 'citytrack.admin.1790703202016@gmail.com',
    token: '123456',
    type: 'signup'
  });
  console.log('VerifyOtp result:', { data, error: error?.message });
}
testVerify();
