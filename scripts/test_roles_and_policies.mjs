import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("=== Checking Profiles ===");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.log("Profiles error:", pErr);
  else console.log(`Profiles (${profiles.length}):`, profiles);

  console.log("\n=== Checking Projects ===");
  const { data: projects, error: prjErr } = await supabase.from('projects').select('id, project_id, name, department, project_manager_id, field_officer_id, contractor_id');
  if (prjErr) console.log("Projects error:", prjErr);
  else console.log(`Projects (${projects.length}):`, projects);

  console.log("\n=== Checking Contractors ===");
  const { data: contractors, error: conErr } = await supabase.from('contractors').select('*');
  if (conErr) console.log("Contractors error:", conErr);
  else console.log(`Contractors (${contractors.length}):`, contractors);

  console.log("\n=== Checking Inspections ===");
  const { data: insp, error: inspErr } = await supabase.from('inspections').select('*').limit(3);
  if (inspErr) console.log("Inspections error:", inspErr);
  else console.log(`Inspections (${insp.length}):`, insp);

  console.log("\n=== Checking Alerts ===");
  const { data: alerts, error: aErr } = await supabase.from('alerts').select('*').limit(3);
  if (aErr) console.log("Alerts error:", aErr);
  else console.log(`Alerts (${alerts.length}):`, alerts);

  console.log("\n=== Checking Documents ===");
  const { data: docs, error: dErr } = await supabase.from('documents').select('*').limit(3);
  if (dErr) console.log("Documents error:", dErr);
  else console.log(`Documents (${docs.length}):`, docs);
}

check();
