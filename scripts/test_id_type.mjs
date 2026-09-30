import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIdType() {
  // Test query with string id
  const { data: d1, error: e1 } = await supabase.from('projects').select('id').eq('id', 'PRJ-GHMC-2026-001');
  console.log("Query with text id 'PRJ-GHMC-2026-001':", { error: e1?.message, data: d1 });

  // Test query with uuid
  const { data: d2, error: e2 } = await supabase.from('projects').select('id').eq('id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  console.log("Query with uuid:", { error: e2?.message, data: d2 });
}

testIdType();
