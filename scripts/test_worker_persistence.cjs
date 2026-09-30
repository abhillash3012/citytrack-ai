const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testWorkerPersistence() {
  const initialWorkers = [
    { id: 'W-01', name: 'Ramesh Patel', trade: 'Master Mason / Structural Lead', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98234 11029' },
    { id: 'W-02', name: 'Sunil Verma', trade: 'Certified Steel & Rebar Welder', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98450 88231' },
    { id: 'W-03', name: 'Abdul Sheikh', trade: 'Heavy Tower Crane Operator', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 97120 44910' },
    { id: 'W-04', name: 'Dinesh Kumar', trade: 'Concrete Pump Specialist', shift: 'Evening Shift (15:30 - 23:00)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98901 22340' },
    { id: 'W-05', name: 'Sohan Lal', trade: 'Site Electrician & Heavy Wiring', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 99122 55670' },
    { id: 'W-06', name: 'Kavita Singh', trade: 'Site Quality & Safety Marshal', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98776 33412' }
  ];

  // 1. Save to CON-001
  const { data: updateData, error: upErr } = await supabase
    .from('contractors')
    .update({ data_json: { workers: initialWorkers }, updated_at: new Date().toISOString() })
    .eq('id', 'CON-001')
    .select();
  console.log('Update CON-001 workers:', upErr ? upErr.message : 'SUCCESS');

  // 2. Add a new 7th worker (like user would in UI)
  const newWorker = {
    id: 'W-07',
    name: 'Prakash Rao',
    trade: 'Heavy Earthmover Driver',
    shift: 'Morning Shift (07:00 - 15:30)',
    status: 'On Site',
    safetyCertified: true,
    contactNumber: '+91 98111 22233'
  };
  const updatedWorkers = [newWorker, ...initialWorkers];
  const { error: addErr } = await supabase
    .from('contractors')
    .update({ data_json: { workers: updatedWorkers }, updated_at: new Date().toISOString() })
    .eq('id', 'CON-001');
  console.log('Add 7th worker:', addErr ? addErr.message : 'SUCCESS');

  // 3. Query back (like browser refresh)
  const { data: qData, error: qErr } = await supabase
    .from('contractors')
    .select('id, name, data_json')
    .eq('id', 'CON-001')
    .single();
  console.log('Reload after refresh:', qData?.data_json?.workers?.length, 'workers found! First worker:', qData?.data_json?.workers[0]?.name);
}
testWorkerPersistence();
