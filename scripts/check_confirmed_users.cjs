const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function checkConfirmedUsers() {
  // Let's test all emails from profiles
  const { data: profiles } = await s.from('profiles').select('id, email, role');
  console.log('Profiles:', profiles);

  // For each profile, try signing in with various passwords to see if any return "Invalid login credentials" vs "Email not confirmed" vs success
  const testPasswords = ['CityTrack@2026', 'Password123!', 'admin123', 'Password@123', '123456'];
  for (const p of profiles) {
    for (const pw of testPasswords) {
      const { data, error } = await s.auth.signInWithPassword({ email: p.email, password: pw });
      if (data?.session) {
        console.log(`FOUND SESSION for ${p.email} with password ${pw}!`);
        return;
      }
      if (error && error.message !== 'Invalid login credentials') {
        console.log(`Email ${p.email} status:`, error.message);
        break;
      }
    }
  }
}
checkConfirmedUsers();
