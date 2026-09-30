import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const s = createClient(supabaseUrl, supabaseKey);

async function testAll() {
  const projId = '7e633688-93d3-4dc3-9720-f00d1e21db6f';

  // 1. Audit logs
  const logUuid = crypto.randomUUID();
  const { data: logData, error: logErr } = await s.from('audit_logs').insert({
    id: logUuid,
    action: 'Test Action',
    user_email: 'admin@citytrack.ai',
    role: 'Administrator',
    project_id: projId,
    details: 'Testing audit log insertion'
  }).select().single();
  console.log('audit_logs:', logData ? Object.keys(logData) : null, 'Error:', logErr?.message);
  if (logData) await s.from('audit_logs').delete().eq('id', logUuid);

  // 2. Documents
  const docUuid = crypto.randomUUID();
  const { data: docData, error: docErr } = await s.from('documents').insert({
    id: docUuid,
    project_id: projId,
    title: 'Test Document',
    category: 'Government Approval',
    file_type: 'PDF',
    file_size: '1.2 MB',
    file_url: 'https://example.com/test.pdf'
  }).select().single();
  console.log('documents:', docData ? Object.keys(docData) : null, 'Error:', docErr?.message);
  if (docData) await s.from('documents').delete().eq('id', docUuid);

  // 3. Notifications
  const notifUuid = crypto.randomUUID();
  const { data: notifData, error: notifErr } = await s.from('notifications').insert({
    id: notifUuid,
    project_id: projId,
    title: 'Test Notification',
    message: 'Test notification message'
  }).select().single();
  console.log('notifications:', notifData ? Object.keys(notifData) : null, 'Error:', notifErr?.message);
  if (notifData) await s.from('notifications').delete().eq('id', notifUuid);

  // 4. Field updates
  const fldUuid = crypto.randomUUID();
  const { data: fldData, error: fldErr } = await s.from('field_updates').insert({
    id: fldUuid,
    project_id: projId,
    officer_name: 'Test Officer',
    reported_progress_percentage: 25,
    remarks: 'Test field update remarks'
  }).select().single();
  console.log('field_updates:', fldData ? Object.keys(fldData) : null, 'Error:', fldErr?.message);
  if (fldData) await s.from('field_updates').delete().eq('id', fldUuid);

  // 5. Milestones
  const mUuid = crypto.randomUUID();
  const { data: mData, error: mErr } = await s.from('milestones').insert({
    id: mUuid,
    project_id: projId,
    name: 'Test Milestone'
  }).select().single();
  console.log('milestones:', mData ? Object.keys(mData) : null, 'Error:', mErr?.message);
  if (mData) await s.from('milestones').delete().eq('id', mUuid);
}

testAll();
