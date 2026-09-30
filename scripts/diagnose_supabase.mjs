import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Testing Supabase Connection & Tables ===");

  const tablesToCheck = [
    'profiles', 'projects', 'contractors', 'milestones', 'tasks',
    'field_updates', 'issues', 'budget_transactions', 'documents',
    'project_photos', 'alerts', 'notifications', 'audit_logs',
    'ai_predictions', 'inspections', 'activity_logs', 'project_updates'
  ];

  for (const tbl of tablesToCheck) {
    const { data, error } = await supabase.from(tbl).select('*').limit(1);
    if (error) {
      console.log(`Table '${tbl}': ERROR -> ${error.code}: ${error.message}`);
    } else {
      console.log(`Table '${tbl}': OK (rows: ${data ? data.length : 0})`);
    }
  }

  console.log("\n=== Testing Auth signup with test account ===");
  const testEmail = `test_${Date.now()}@citytrack.test`;
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: "Password123!@",
    options: {
      data: {
        role: "Administrator",
        full_name: "Test Admin"
      }
    }
  });
  if (signUpErr) {
    console.log("Sign up test error:", signUpErr);
  } else {
    console.log("Sign up test success:", signUpData.user?.id, signUpData.user?.email);
  }
}

run();
