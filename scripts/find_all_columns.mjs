import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName, candidateCols) {
  const valid = [];
  for (const c of candidateCols) {
    const { error } = await supabase.from(tableName).select(c).limit(1);
    if (!error) valid.push(c);
  }
  console.log(`VALID columns for '${tableName}':`, valid);
}

async function run() {
  await checkTable('inspections', [
    'id', 'inspection_id', 'project_id', 'project_name', 'project_location',
    'officer_id', 'officer_name', 'field_officer_id', 'field_officer_name',
    'project_manager_id', 'inspection_date', 'timestamp', 'progress', 'remarks',
    'ai_generated_remarks', 'officer_remarks', 'officer_submitted_remarks',
    'severity', 'ai_visual_progress', 'ai_delay_probability', 'ai_risk_level',
    'predicted_delay_days', 'ai_explanation', 'construction_activity',
    'visible_work', 'workers_equipment', 'materials', 'site_condition',
    'safety_concerns', 'quality_concerns', 'safety_quality_concerns',
    'visual_confidence', 'visual_analysis_confidence', 'ai_recommendations',
    'before_image_reference', 'after_image_reference', 'current_image_reference',
    'photo_url', 'status', 'manager_viewed', 'manager_viewed_at', 'manager_remarks',
    'is_demo_prediction', 'created_at', 'updated_at', 'data_json'
  ]);

  await checkTable('alerts', [
    'id', 'project_id', 'project_name', 'type', 'title', 'message',
    'severity', 'priority', 'read', 'is_read', 'timestamp', 'created_at', 'data_json'
  ]);

  await checkTable('notifications', [
    'id', 'user_id', 'project_id', 'project_name', 'type', 'title', 'message',
    'severity', 'priority', 'read', 'is_read', 'timestamp', 'created_at', 'data_json'
  ]);

  await checkTable('profiles', [
    'id', 'email', 'full_name', 'role', 'phone', 'department', 'status', 'avatar_url',
    'created_at', 'updated_at'
  ]);
}

run();
