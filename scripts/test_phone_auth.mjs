import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthMethods() {
  console.log("=== Testing Phone Sign-in / Sign-up ===");
  const testPhone = "+919876543210";
  const { data: phoneData, error: phoneErr } = await supabase.auth.signInWithOtp({
    phone: testPhone
  });
  console.log("Phone OTP send:", { error: phoneErr?.message, data: phoneData });

  console.log("\n=== Testing Phone with password ===");
  const { data: pData, error: pErr } = await supabase.auth.signUp({
    phone: testPhone,
    password: "Password123!@#"
  });
  console.log("Phone signUp:", { error: pErr?.message, pData });
}

testAuthMethods();
