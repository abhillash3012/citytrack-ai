import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Projects count:", data.length);
  for (const p of data) {
    console.log({
      id: p.id,
      name: p.name,
      total_budget: p.total_budget,
      total_budget_cr: p.total_budget_cr,
      allocated_budget_cr: p.allocated_budget_cr,
      spent_budget_cr: p.spent_budget_cr,
      budget: p.budget,
      status: p.status,
      risk_level: p.risk_level,
      actual_progress_percentage: p.actual_progress_percentage,
      expected_progress_percentage: p.expected_progress_percentage,
      data_json: p.data_json ? Object.keys(p.data_json) : null
    });
  }
}

inspect();
