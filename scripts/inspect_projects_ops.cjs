const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function inspectPolicies() {
  // Test select
  const { data: selData, error: selErr } = await s.from('projects').select('*');
  console.log('SELECT projects:', selData?.length, selErr?.message);

  // Test insert with various payloads
  const { data: insData, error: insErr } = await s.from('projects').insert({
    id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    name: 'Urban Road Improvement Project',
    department: 'Municipal Administration (GHMC)',
    location: 'Kondapur, Hyderabad'
  }).select();
  console.log('INSERT projects:', insData ? 'OK' : insErr);

  // Test update
  const { data: upData, error: upErr } = await s.from('projects').update({
    name: 'Updated'
  }).eq('id', '7e633688-93d3-4dc3-9720-f00d1e21db6f').select();
  console.log('UPDATE projects:', upData ? 'OK' : upErr);

  // Test delete
  const { data: delData, error: delErr } = await s.from('projects').delete().eq('id', '7e633688-93d3-4dc3-9720-f00d1e21db6f').select();
  console.log('DELETE projects:', delData ? 'OK' : delErr);
}
inspectPolicies();
