const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testAuthUsers() {
  const testEmails = [
    'admin@citytrack.ai',
    'pm@citytrack.ai',
    'field@citytrack.ai',
    'contractor@citytrack.ai',
    'citytrack.admin.1790703202016@gmail.com'
  ];
  const testPasswords = ['CityTrack@2026', 'Admin@123', 'Password@123', 'citytrack123', '123456'];

  for (const email of testEmails) {
    for (const pass of testPasswords) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (!error && data.user) {
        console.log(`SUCCESS SIGN IN: ${email} with password: ${pass} -> user ID: ${data.user.id}`);
        return;
      }
    }
  }
  console.log('No default password matched for auth users.');
}

testAuthUsers();
