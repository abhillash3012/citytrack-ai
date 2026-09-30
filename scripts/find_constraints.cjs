const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function findConstraints() {
  const projId = '7e633688-93d3-4dc3-9720-f00d1e21db6f';

  // Test severities on alerts
  const severities = ['Critical', 'Major', 'Moderate', 'Minor', 'Warning', 'Info', 'HIGH', 'MEDIUM', 'LOW', 'CRITICAL', 'high', 'medium', 'low', 'critical'];
  for (const sev of severities) {
    const alertId = '00000000-0000-4000-8000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    const { data, error } = await supabase.from('alerts').insert({
      id: alertId,
      project_id: projId,
      title: 'Test Severity',
      message: 'Testing severity ' + sev,
      category: 'Issue Escalated',
      severity: sev
    }).select();
    if (data) {
      console.log('ALLOWED ALERT SEVERITY:', sev);
      await supabase.from('alerts').delete().eq('id', alertId);
    }
  }

  // Test statuses on inspections
  const statuses = ['Pending', 'Approved', 'Rejected', 'Under Review', 'In Progress', 'Scheduled', 'Completed', 'Flagged', 'Reviewed', 'Open', 'Closed', 'SUBMITTED', 'APPROVED', 'REJECTED'];
  for (const st of statuses) {
    const inspId = '00000000-0000-4000-8000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    const { data, error } = await supabase.from('inspections').insert({
      id: inspId,
      project_id: projId,
      status: st
    }).select();
    if (data) {
      console.log('ALLOWED INSPECTION STATUS:', st);
      await supabase.from('inspections').delete().eq('id', inspId);
    }
  }
}
findConstraints();
