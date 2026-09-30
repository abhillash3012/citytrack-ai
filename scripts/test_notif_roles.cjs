const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testNotifRoles() {
  const roles = ['Administrator', 'Project Manager', 'Field Officer', 'Contractor', 'ALL', null, undefined];
  for (const r of roles) {
    const id = '00000000-0000-4000-8000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    const { data, error } = await supabase.from('notifications').insert({
      id,
      project_id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
      title: 'Test',
      message: 'Test message',
      target_role: r
    }).select();
    if (error) {
      console.log(`target_role '${r}': ERROR ->`, error.message);
    } else {
      console.log(`target_role '${r}': OK`);
      await supabase.from('notifications').delete().eq('id', id);
    }
  }
}
testNotifRoles();
