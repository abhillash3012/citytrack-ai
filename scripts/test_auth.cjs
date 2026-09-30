const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function test() {
  const passwordsToTry = ['CityTrack@2025', 'CityTrack@2026', 'Admin@123', 'admin123', 'Password@123', 'password'];
  for (const pw of passwordsToTry) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@citytrack.ai',
      password: pw
    });
    console.log(`Trying ${pw}:`, data?.user ? 'SUCCESS' : error?.message);
    if (data?.user) break;
  }
}
test();
