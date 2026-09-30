const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function testEmails() {
  const emails = [
    'citytrack.admin@gmail.com',
    'admin@citytrack.org',
    'admin@citytrack.in',
    'admin@citytrack.com'
  ];
  for (const em of emails) {
    const { data, error } = await s.auth.signUp({
      email: em,
      password: 'Password@123'
    });
    console.log(`Signup ${em}:`, data?.user ? 'OK, confirmed=' + data.user.confirmed_at : error?.message);
    if (data?.session) {
      console.log(`SESSION GRANTED for ${em}!`);
    }
  }
}
testEmails();
