const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function testSignup() {
  const email = `admin.verify.${Date.now()}@citytrack.ai`;
  const password = 'Password@12345!';
  console.log('Testing sign up with:', email);
  const { data, error } = await s.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'Administrator',
        full_name: 'CityTrack Administrator'
      }
    }
  });

  if (error) {
    console.log('Sign up error:', error);
  } else {
    console.log('Sign up result user:', data.user?.id, 'Session:', Boolean(data.session));
    if (data.session) {
      console.log('Session access_token present! Testing insert project with authenticated client...');
      const authClient = createClient(url, key, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          }
        }
      });
      const id = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
      const ins = await authClient.from('projects').insert({
        id,
        name: 'Authenticated Test Project',
        department: 'Municipal Administration (GHMC)',
        location: 'Hyderabad'
      }).select();
      console.log('Authenticated Insert result:', ins.error ? ins.error : 'SUCCESS!');
      if (!ins.error) {
        await authClient.from('projects').delete().eq('id', id);
      }
    }
  }
}

testSignup();
