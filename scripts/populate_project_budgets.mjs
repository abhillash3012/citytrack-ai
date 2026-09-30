import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

const projectUpdates = [
  {
    id: '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    total_budget_cr: 28.5,
    allocated_budget_cr: 28.5,
    spent_budget_cr: 19.8,
    actual_progress_percentage: 68,
    expected_progress_percentage: 75,
    status: 'On Track',
    risk_level: 'Low',
    priority: 'High',
    delay_probability: 12
  },
  {
    id: '61e44f4c-5591-49c1-b371-9586eff9c4ca',
    total_budget_cr: 14.2,
    allocated_budget_cr: 14.2,
    spent_budget_cr: 11.5,
    actual_progress_percentage: 82,
    expected_progress_percentage: 85,
    status: 'On Track',
    risk_level: 'Low',
    priority: 'Medium',
    delay_probability: 8
  },
  {
    id: '516ea385-d2b9-4f38-b4f8-37f1ca81239f',
    total_budget_cr: 36.0,
    allocated_budget_cr: 36.0,
    spent_budget_cr: 22.4,
    actual_progress_percentage: 42,
    expected_progress_percentage: 60,
    status: 'Delayed',
    risk_level: 'High',
    priority: 'Urgent',
    delay_probability: 65
  },
  {
    id: 'e1d8d969-c220-4678-9e6e-f0c06acb6dbd',
    total_budget_cr: 95.0,
    allocated_budget_cr: 95.0,
    spent_budget_cr: 58.0,
    actual_progress_percentage: 55,
    expected_progress_percentage: 58,
    status: 'On Track',
    risk_level: 'Medium',
    priority: 'High',
    delay_probability: 22
  },
  {
    id: 'a89cd346-45f3-42bc-ac08-358fd1219d4e',
    total_budget_cr: 52.5,
    allocated_budget_cr: 52.5,
    spent_budget_cr: 41.2,
    actual_progress_percentage: 71,
    expected_progress_percentage: 80,
    status: 'At Risk',
    risk_level: 'Medium',
    priority: 'High',
    delay_probability: 38
  }
];

async function updateBudgets() {
  console.log("Updating real Supabase database project budgets and progress...");
  for (const p of projectUpdates) {
    const { error } = await supabase
      .from('projects')
      .update(p)
      .eq('id', p.id);
    
    if (error) {
      console.error(`Failed to update ${p.id}:`, error.message);
    } else {
      console.log(`✓ Updated ${p.id} successfully: Budget ₹${p.total_budget_cr} Cr, Progress ${p.actual_progress_percentage}%`);
    }
  }
}

updateBudgets();
