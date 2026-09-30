import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Testing standard email signup (@gmail.com) ===");
  const testEmail = `citytrack.admin.${Date.now()}@gmail.com`;
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testEmail,
    password: "Password123!@#",
    options: {
      data: {
        role: "Administrator",
        full_name: "CityTrack Admin"
      }
    }
  });

  if (signUpErr) {
    console.log("Sign up error:", signUpErr);
  } else {
    console.log("Sign up success:", {
      id: signUpData.user?.id,
      email: signUpData.user?.email,
      session: !!signUpData.session
    });
  }

  // Let's inspect the columns of existing tables: projects, alerts, notifications, inspections, profiles
  console.log("\n=== Inspecting existing table columns ===");
  const tables = ['projects', 'alerts', 'notifications', 'inspections', 'profiles'];
  for (const t of tables) {
    // Try inserting an empty object or dummy object to trigger Postgres error detailing columns or schema
    const { error } = await supabase.from(t).insert([{}]);
    console.log(`Insert to '${t}':`, error ? error.message : "Success with defaults");
  }
}

run();
