const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function test() {
  const { data: projects, error } = await supabase.from('projects').select('id, name, field_officer_id');
  console.log('Projects count:', projects ? projects.length : 'null', 'Error:', error);

  const { data: alerts, error: alertErr } = await supabase.from('alerts').select('*');
  console.log('Alerts count:', alerts ? alerts.length : 'null', 'Error:', alertErr);

  const { data: contractors, error: contErr } = await supabase.from('contractors').select('*');
  console.log('Contractors count:', contractors ? contractors.length : 'null', 'Error:', contErr);

  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  console.log('Profiles count:', profiles ? profiles.length : 'null', 'Error:', profErr);
}
test();
