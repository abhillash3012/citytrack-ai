import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAlertsAndNotifs() {
  console.log("==================================================");
  console.log("CITYTRACK AI — ALERTS & NOTIFICATIONS VERIFICATION");
  console.log("==================================================\n");

  const testAlertUuid = 'a0000000-0000-4000-8000-' + Math.floor(Date.now() / 1000).toString().padStart(12, '0');
  const alertPayload = {
    id: testAlertUuid,
    project_id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    project_name: 'Urban Road Development Phase 1',
    type: 'Critical',
    title: 'Monsoon Preparedness Drainage Clear Order',
    message: 'Mandatory structural clearance required before seasonal heavy rains begin.',
    severity: 'Critical',
    category: 'Issue Escalated',
    alert_type: 'Issue Escalated',
    is_read: false,
    data_json: { targetRole: 'Project Manager' }
  };

  // 1. Insert Alert
  const { data: alertRes, error: alertErr } = await supabase.from('alerts').insert(alertPayload).select().single();
  if (alertErr) {
    console.error("❌ Alert insert failed:", alertErr.message);
    process.exit(1);
  }
  console.log(`✓ PASS: Alert inserted with UUID: ${alertRes.id}`);

  // 2. Insert Notification
  const notifUuid = 'b0000000-0000-4000-8000-' + Math.floor(Date.now() / 1000).toString().padStart(12, '0');
  const { data: notifRes, error: notifErr } = await supabase.from('notifications').insert({
    id: notifUuid,
    project_id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    title: alertPayload.title,
    message: alertPayload.message,
    target_role: 'Project Manager',
    is_read: false
  }).select().single();

  if (notifErr) {
    console.error("❌ Notification insert failed:", notifErr.message);
    process.exit(1);
  }
  console.log(`✓ PASS: Notification inserted with UUID: ${notifRes.id}`);

  // 3. Mark alert as read
  const { error: updateErr } = await supabase.from('alerts').update({ is_read: true }).eq('id', testAlertUuid);
  if (updateErr) {
    console.error("❌ Alert mark read failed:", updateErr.message);
    process.exit(1);
  }

  // 4. Verify read status persisted
  const { data: checkAlert } = await supabase.from('alerts').select('id, is_read').eq('id', testAlertUuid).single();
  if (checkAlert && checkAlert.is_read === true) {
    console.log(`✓ PASS: Alert marked as read persisted in Supabase.`);
  } else {
    console.error("❌ Alert is_read was not true.");
    process.exit(1);
  }

  console.log("\nALL ALERTS & NOTIFICATIONS CHECKS PASSED!");
}

verifyAlertsAndNotifs();
