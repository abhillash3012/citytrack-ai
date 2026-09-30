const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function test() {
  const sampleProject = {
    id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    name: 'Urban Road Development Phase 1',
    department: 'Roads & Buildings',
    project_type: 'Infrastructure',
    description: '4-lane arterial road widening and stormwater drain construction',
    location: 'Gachibowli to Financial District, Hyderabad',
    district: 'Hyderabad',
    latitude: 17.4401,
    longitude: 78.3489,
    manager_name: 'Suresh Verma',
    project_manager_id: 'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    field_officer_id: '0bc0bb36-1638-467e-a92b-86ff28c81559',
    contractor_id: 'CON-001',
    contractor_name: 'Metro Infrastructure Pvt Ltd',
    start_date: '2024-01-15',
    expected_completion_date: '2025-06-30',
    total_budget: 150000000,
    total_budget_cr: 15.0,
    allocated_budget: 120000000,
    allocated_budget_cr: 12.0,
    spent_budget: 85000000,
    spent_budget_cr: 8.5,
    progress: 58,
    actual_progress_percentage: 58,
    expected_progress: 65,
    expected_progress_percentage: 65,
    priority: 'High',
    status: 'In Progress',
    risk_level: 'Medium',
    health_score: 74,
    delay_probability: 32,
    predicted_delay_days: 14,
    data_json: {
      category: 'Roads & Buildings',
      zone: 'West Zone',
      ward: 'Ward 104'
    }
  };

  const { data, error } = await supabase.from('projects').insert(sampleProject).select();
  console.log('Insert result:', { data, error });
}
test();
