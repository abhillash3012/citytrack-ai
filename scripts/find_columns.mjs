import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function findColumns() {
  const candidateCols = [
    'id', 'project_id', 'name', 'department', 'project_type', 'description',
    'location', 'district', 'latitude', 'longitude', 'manager_name',
    'project_manager_id', 'field_officer_id', 'contractor_id', 'contractor_name',
    'start_date', 'expected_completion_date', 'actual_completion_date',
    'revised_completion_date', 'total_budget', 'total_budget_cr',
    'allocated_budget', 'allocated_budget_cr', 'spent_budget', 'spent_budget_cr',
    'progress', 'actual_progress_percentage', 'expected_progress', 'expected_progress_percentage',
    'priority', 'status', 'risk_level', 'health_score', 'delay_probability',
    'predicted_delay_days', 'data_json', 'created_at', 'updated_at',
    'milestones', 'photographs', 'issues', 'field_updates', 'documents',
    'ai_prediction', 'objectives'
  ];

  console.log("=== Testing individual columns on 'projects' table ===");
  const validCols = [];
  const invalidCols = [];

  for (const col of candidateCols) {
    const { error } = await supabase.from('projects').select(col).limit(1);
    if (error) {
      invalidCols.push({ col, error: error.message });
    } else {
      validCols.push(col);
    }
  }

  console.log("VALID columns found in 'projects':", validCols);
  console.log("INVALID columns:", invalidCols);
}

findColumns();
