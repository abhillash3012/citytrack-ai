import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== Testing Project INSERT ===");

  const testPayload = {
    name: "Test Infra Project " + Date.now(),
    department: "Municipal Administration (GHMC)",
    project_type: "Roads",
    location: "Banjara Hills, Hyderabad",
    total_budget_cr: 12.5,
    allocated_budget_cr: 12.5,
    spent_budget_cr: 1.0,
    actual_progress_percentage: 10,
    expected_progress_percentage: 20,
    status: "On Track",
    risk_level: "Low",
    priority: "High"
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(testPayload)
    .select()
    .single();

  if (error) {
    console.error("PROJECT CREATE ERROR:", error);
  } else {
    console.log("PROJECT CREATED SUCCESSFULLY:", data.id, data.name);
    // clean up test project
    await supabase.from('projects').delete().eq('id', data.id);
    console.log("Cleaned up test project");
  }
}

test();
