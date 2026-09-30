const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function test() {
  const users = [
    'admin@citytrack.ai',
    'pm@citytrack.ai',
    'field@citytrack.ai',
    'contractor@citytrack.ai',
    'citytrack.admin.1790703202016@gmail.com'
  ];
  for (const email of users) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: "Password123!@#"
    });
    console.log(`SignIn ${email}:`, data?.user ? `SUCCESS (ID: ${data.user.id})` : error?.message);
  }
}
test();
