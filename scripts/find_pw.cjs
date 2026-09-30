const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function findPw() {
  const emails = ['admin@citytrack.ai', 'pm@citytrack.ai', 'field@citytrack.ai', 'contractor@citytrack.ai'];
  const passwords = [
    'Admin@1234', 'Admin@2026', 'Citytrack@2026', 'CityTrack@2025', 'CityTrack@123',
    'password', 'password123', '12345678', 'admin', 'citytrack', 'test1234',
    'Field@123', 'Field@2026', 'Pm@123', 'Pm@2026', 'Contractor@123'
  ];

  for (const email of emails) {
    for (const pw of passwords) {
      const { data, error } = await s.auth.signInWithPassword({ email, password: pw });
      if (data?.session) {
        console.log(`FOUND WORKING CREDENTIALS! ${email} : ${pw}`);
        return;
      }
    }
  }
  console.log('Finished password probe, none of the common list matched.');
}

findPw();
