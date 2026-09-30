const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const s = createClient(url, key);

async function testInserts() {
  const adminId = '3af4d4bf-e205-40d8-9648-4f570d9e20f0';
  const pmId = 'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea';
  const foId = '0bc0bb36-1638-467e-a92b-86ff28c81559';

  const testPayloads = [
    { label: 'with created_by admin', data: { created_by: adminId } },
    { label: 'with user_id admin', data: { user_id: adminId } },
    { label: 'with project_manager_id', data: { project_manager_id: pmId } },
    { label: 'with field_officer_id', data: { field_officer_id: foId } },
    { label: 'with both PM and FO', data: { project_manager_id: pmId, field_officer_id: foId } },
    { label: 'with all IDs', data: { created_by: adminId, user_id: adminId, project_manager_id: pmId, field_officer_id: foId } },
  ];

  for (const t of testPayloads) {
    const id = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    const { data, error } = await s.from('projects').insert({
      id,
      name: 'Test Project ' + t.label,
      department: 'Municipal Administration (GHMC)',
      location: 'Hyderabad',
      ...t.data
    }).select();

    if (error) {
      console.log(`Payload [${t.label}]: FAILED -> [${error.code}] ${error.message}`);
    } else {
      console.log(`Payload [${t.label}]: SUCCESS!`);
      await s.from('projects').delete().eq('id', id);
    }
  }
}

testInserts();
