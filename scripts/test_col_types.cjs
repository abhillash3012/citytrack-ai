const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testCols() {
  const { data: d1, error: e1 } = await supabase.from('projects').select('project_manager_id').eq('project_manager_id', 'not-a-uuid');
  console.log('project_manager_id with text:', e1?.message || 'OK');

  const { data: d2, error: e2 } = await supabase.from('projects').select('field_officer_id').eq('field_officer_id', 'not-a-uuid');
  console.log('field_officer_id with text:', e2?.message || 'OK');

  const { data: d3, error: e3 } = await supabase.from('projects').select('contractor_id').eq('contractor_id', 'CON-001');
  console.log('contractor_id with text:', e3?.message || 'OK');
}
testCols();
