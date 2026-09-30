const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testAll() {
  const projId = '7e633688-93d3-4dc3-9720-f00d1e21db6f';

  // Test alerts
  const alertId = '00000000-0000-4000-8000-' + Date.now().toString().slice(-12);
  const { data: aData, error: aErr } = await supabase.from('alerts').insert({
    id: alertId,
    project_id: projId,
    title: 'Test Alert',
    message: 'Test message',
    category: 'Issue Escalated',
    severity: 'High'
  }).select();
  console.log('Alert insert:', aData ? 'SUCCESS' : aErr);
  if (aData) await supabase.from('alerts').delete().eq('id', alertId);

  // Test contractors update
  const { data: cData, error: cErr } = await supabase.from('contractors').update({
    updated_at: new Date().toISOString()
  }).eq('id', 'CON-001').select();
  console.log('Contractor update:', cData ? 'SUCCESS' : cErr);

  // Test projects insert
  const { data: pData, error: pErr } = await supabase.from('projects').insert({
    id: '00000000-0000-4000-8000-' + Date.now().toString().slice(-12),
    name: 'Test Project'
  }).select();
  console.log('Project insert:', pData ? 'SUCCESS' : pErr);

  // Test inspections insert
  const { data: iData, error: iErr } = await supabase.from('inspections').insert({
    id: '00000000-0000-4000-8000-' + Date.now().toString().slice(-12),
    project_id: projId,
    status: 'Pending'
  }).select();
  console.log('Inspection insert:', iData ? 'SUCCESS' : iErr);
}
testAll();
