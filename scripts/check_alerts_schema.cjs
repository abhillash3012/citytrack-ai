const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function check() {
  const { data: a } = await supabase.from('alerts').select('*').limit(1);
  console.log('alerts columns:', a && a[0] ? Object.keys(a[0]) : 'empty');
  if (a && a[0]) console.log('alerts sample:', a[0]);

  const { data: n } = await supabase.from('notifications').select('*').limit(1);
  console.log('notifications columns:', n && n[0] ? Object.keys(n[0]) : 'empty');
  if (n && n[0]) console.log('notifications sample:', n[0]);
}
check();
