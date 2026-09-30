const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

function toValidUuid(id) {
  if (!id) return '00000000-0000-4000-8000-000000000001';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const clean = (id.replace(/[^a-f0-9]/gi, '') + hex1 + hex2 + '0123456789abcdef0123456789abcdef').slice(0, 32);
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-4${clean.slice(13, 16)}-a${clean.slice(17, 20)}-${clean.slice(20, 32)}`.toLowerCase();
}

function mapAlertToDb(alert) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.id);
  const uuid = isUuid ? alert.id.toLowerCase() : toValidUuid(alert.id);
  const isProjUuid = Boolean(alert.projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.projectId));
  const projUuid = (isProjUuid && alert.projectId) ? alert.projectId.toLowerCase() : '7e633688-93d3-4dc3-9720-f00d1e21db6f';

  return {
    id: uuid,
    project_id: projUuid,
    project_name: alert.projectName || 'Infrastructure Project',
    type: alert.severity || 'Warning',
    title: alert.title || 'System Alert',
    message: alert.message || 'Notification broadcast',
    severity: (alert.severity === 'Critical' || alert.severity === 'Warning' || alert.severity === 'Info') ? alert.severity : 'Warning',
    category: alert.category || 'AI Delay',
    alert_type: alert.category || 'AI Delay',
    is_read: Boolean(alert.isRead),
    data_json: alert
  };
}

async function addAlertToSupabase(alert) {
  try {
    const payload = mapAlertToDb(alert);
    const { data: aData, error } = await supabase.from('alerts').upsert(payload, { onConflict: 'id' }).select();
    if (error) {
      console.error('Error adding alert to Supabase:', error.message);
      return { success: false, error: error.message };
    }

    // Also persist corresponding notification record in public.notifications
    try {
      const notifUuid = toValidUuid(`NOTIF-${Date.now()}`);
      await supabase.from('notifications').insert({
        id: notifUuid,
        project_id: payload.project_id,
        title: alert.title,
        message: alert.message,
        target_role: alert.targetRole || null,
        user_id: alert.targetUserId || null,
        is_read: false
      });
    } catch (notifErr) {
      console.warn('Notice adding notification record for alert:', notifErr);
    }

    return { success: true, error: null, data: aData };
  } catch (err) {
    console.error('Exception adding alert to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to add alert' };
  }
}

async function test() {
  const newAlert = {
    id: toValidUuid('alert-' + Date.now()),
    title: 'Monsoon Preparedness Directive',
    message: 'Executive directive to clear stormwater channels across all active road corridors.',
    severity: 'Critical',
    category: 'Issue Escalated',
    projectName: 'Urban Road Improvement Project'
  };

  const res = await addAlertToSupabase(newAlert);
  console.log('addAlertToSupabase result:', res);
}
test();
