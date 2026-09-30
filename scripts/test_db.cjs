const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function test() {
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles);

  const { data: alerts, error: alertErr } = await supabase.from('alerts').select('*');
  console.log('Alerts:', alerts);

  const { data: contractors, error: contErr } = await supabase.from('contractors').select('*');
  console.log('Contractors count:', contractors ? contractors.length : 0);
  if (contractors && contractors.length > 0) {
    console.log('Contractor[0]:', { id: contractors[0].id, code: contractors[0].code, name: contractors[0].name, data_json: contractors[0].data_json });
  }

  const { data: projects, error: projErr } = await supabase.from('projects').select('*');
  console.log('Projects count:', projects ? projects.length : 0);
}
test();
