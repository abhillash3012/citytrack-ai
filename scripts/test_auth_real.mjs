import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log("=== Testing signInWithPassword for admin@citytrack.ai ===");
  const testPasswords = ['CityTrack@2026', 'Password123!', 'Admin@123', 'admin123', 'citytrack', '123456'];
  for (const pw of testPasswords) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@citytrack.ai',
      password: pw
    });
    if (!error && data.session) {
      console.log(`✓ PASSWORD FOUND: "${pw}"`);
      console.log("User id:", data.user.id);
      return;
    }
  }
  console.log("None of the test passwords worked for admin@citytrack.ai");

  console.log("\n=== Testing signUp for admin@citytrack.ai ===");
  const { data: upData, error: upErr } = await supabase.auth.signUp({
    email: 'admin@citytrack.ai',
    password: 'CityTrack@2026!'
  });
  console.log("SignUp result:", { error: upErr?.message, user: upData?.user?.id, session: !!upData?.session });

  console.log("\n=== Testing signInWithOtp (email) ===");
  const { data: otpData, error: otpErr } = await supabase.auth.signInWithOtp({
    email: 'admin@citytrack.ai'
  });
  console.log("signInWithOtp result:", { error: otpErr?.message, otpData });
}

testAuth();
