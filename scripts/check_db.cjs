const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function check() {
  console.log('Testing projects SELECT:');
  const p = await supabase.from('projects').select('id, name, project_id, field_officer_id, project_manager_id');
  console.log('Projects count:', p.data?.length, 'Error:', p.error);
  if (p.data && p.data.length > 0) {
    console.log('Sample project:', p.data[0]);
  }

  console.log('Testing profiles SELECT:');
  const prof = await supabase.from('profiles').select('*');
  console.log('Profiles count:', prof.data?.length, 'Error:', prof.error);
  if (prof.data) {
    console.log('Profiles:', prof.data.map(u => ({ id: u.id, role: u.role, email: u.email })));
  }

  console.log('Testing alerts SELECT:');
  const a = await supabase.from('alerts').select('*');
  console.log('Alerts count:', a.data?.length, 'Error:', a.error);

  console.log('Testing inspections SELECT:');
  const insp = await supabase.from('inspections').select('*');
  console.log('Inspections count:', insp.data?.length, 'Error:', insp.error);
}

check();
