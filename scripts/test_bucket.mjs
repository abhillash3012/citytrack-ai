import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
  const { data, error } = await supabase.storage.createBucket('inspections', { public: true });
  console.log("Create bucket 'inspections':", { error: error?.message, data });

  // Test upload dummy file
  const testBuffer = Buffer.from("test photo data", "utf-8");
  const { data: upData, error: upError } = await supabase.storage.from('inspections').upload('test.txt', testBuffer, { upsert: true });
  console.log("Upload test.txt:", { error: upError?.message, upData });
}

testBucket();
