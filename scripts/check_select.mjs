import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Checking SELECT on all tables ===");
  const tables = ['profiles', 'projects', 'alerts', 'notifications', 'inspections'];
  for (const t of tables) {
    const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' });
    if (error) {
      console.log(`SELECT ${t} error:`, error.message);
    } else {
      console.log(`SELECT ${t}: found ${data?.length} rows, exact count: ${count}`, data);
    }
  }
}

run();
