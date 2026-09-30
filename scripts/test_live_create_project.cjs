const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testCreateProject() {
  const uuid = 'c0000000-0000-0000-0000-' + Date.now().toString().slice(-12);
  const payload = {
    id: uuid,
    project_id: 'PRJ-TEST-' + Date.now().toString().slice(-4),
    name: 'Live Test Infrastructure Roadway',
    department: 'Municipal Administration (GHMC)',
    project_type: 'Roads',
    description: 'Validation of Supabase project registration pipeline',
    location: 'Banjara Hills Sector 4',
    district: 'Hyderabad',
    latitude: 17.4125,
    longitude: 78.4356,
    manager_name: 'Suresh Verma',
    project_manager_id: 'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    field_officer_id: '0bc0bb36-1638-467e-a92b-86ff28c81559',
    contractor_id: 'CON-001',
    contractor_name: 'L&T Urban Infra Consortium',
    start_date: '2026-04-01',
    expected_completion_date: '2026-12-31',
    total_budget_cr: 24.5,
    allocated_budget_cr: 24.5,
    spent_budget_cr: 0,
    expected_progress_percentage: 10,
    actual_progress_percentage: 5,
    status: 'On Track',
    risk_level: 'Low',
    priority: 'Medium',
    delay_probability: 5,
    predicted_delay_days: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('Inserting project to Supabase...');
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  if (error) {
    console.error('Project insert error:', error);
  } else {
    console.log('Project insert SUCCESS! ID:', data.id, 'Name:', data.name);
  }

  // Test rename project
  console.log('Renaming project in Supabase...');
  const { data: renData, error: renErr } = await supabase.from('projects').update({ name: 'Live Test Infrastructure Roadway (Renamed)' }).eq('id', uuid).select().single();
  if (renErr) {
    console.error('Rename error:', renErr);
  } else {
    console.log('Rename SUCCESS! New name:', renData.name);
  }

  // Test delete project
  console.log('Deleting project from Supabase...');
  const { error: delErr } = await supabase.from('projects').delete().eq('id', uuid);
  if (delErr) {
    console.error('Delete error:', delErr);
  } else {
    console.log('Delete SUCCESS!');
  }
}

testCreateProject();
