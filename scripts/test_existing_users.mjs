import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogins() {
  const emails = [
    'admin@citytrack.gov.in',
    'admin@citytrack.ai',
    'admin@citytrack.com',
    'pm@citytrack.gov.in',
    'officer@citytrack.gov.in',
    'contractor@citytrack.gov.in',
    'demo@citytrack.ai',
    'admin@example.com'
  ];

  const passwords = [
    'CityTrack@2026',
    'Password123!',
    'Admin123!',
    'Admin@123',
    'citytrack123',
    '12345678'
  ];

  for (const email of emails) {
    for (const password of passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data.user) {
        console.log(`FOUND WORKING USER! Email: ${email}, Password: ${password}`);
        return;
      }
    }
  }
  console.log("No default user found with standard passwords.");
}

testLogins();
