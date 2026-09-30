const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testAlertAndNotification() {
  const alertId = 'a0000000-0000-0000-0000-' + Date.now().toString().slice(-12);
  const notifId = 'b0000000-0000-0000-0000-' + Date.now().toString().slice(-12);
  const projectId = '7e633688-93d3-4dc3-9720-f00d1e21db6f';

  console.log('Testing alert insert...');
  const res = await supabase.from('alerts').insert({
    id: alertId,
    project_id: projectId,
    project_name: 'Metro Line Extension',
    title: 'Test Admin Live Alert',
    message: 'Test message for validation',
    severity: 'Warning',
    category: 'Contractor Alert',
    alert_type: 'Contractor Alert',
    is_read: false
  }).select();

  console.log('Insert alert result:', res.error ? JSON.stringify(res.error) : 'SUCCESS');

  console.log('Testing notification insert...');
  const notifRes = await supabase.from('notifications').insert({
    id: notifId,
    project_id: projectId,
    title: 'Test Admin Live Alert',
    message: 'Test message for validation',
    target_role: 'Field Officer',
    is_read: false
  }).select();

  console.log('Insert notification result:', notifRes.error ? JSON.stringify(notifRes.error) : 'SUCCESS');

  // Clean up
  await supabase.from('alerts').delete().eq('id', alertId);
  await supabase.from('notifications').delete().eq('id', notifId);
  console.log('Cleaned up test records');
}

testAlertAndNotification();
