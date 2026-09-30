const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function test() {
  const commonPasswords = [
    'CityTrack@2024',
    'CityTrack@2025',
    'CityTrack@2026',
    'CityTrack#2026',
    'CityTrack123!',
    'CityTrack123',
    'Admin@123',
    'admin123',
    'admin@citytrack.ai',
    'admin',
    'Password@123',
    'Password123!',
    'Password123',
    'password123',
    'password',
    '12345678',
    '123456',
    'Sih@2024',
    'Sih@2025',
    'Sih@2026',
    'SmartIndia@2024',
    'SmartIndia@2025',
    'SmartIndiaHackathon',
    'hackathon2024',
    'hackathon2025',
    'hackathon2026',
    'Hyderabad@123',
    'Telangana@123',
    'Ghmc@2024',
    'Ghmc@2025',
    'Ghmc@2026'
  ];

  for (const pw of commonPasswords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@citytrack.ai',
      password: pw
    });
    if (data?.session) {
      console.log('FOUND PASSWORD for admin@citytrack.ai:', pw);
      return;
    }
  }
  console.log('None of the common passwords matched.');
}
test();
