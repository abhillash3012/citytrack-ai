import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpcs() {
  const rpcs = [
    'exec_sql', 'exec', 'execute_sql', 'run_sql',
    'get_current_user_role', 'is_admin', 'is_assigned_to_project',
    'handle_new_user'
  ];

  for (const r of rpcs) {
    const { data, error } = await supabase.rpc(r);
    console.log(`RPC '${r}':`, error ? `${error.code}: ${error.message}` : "Success: " + JSON.stringify(data));
  }
}

testRpcs();
