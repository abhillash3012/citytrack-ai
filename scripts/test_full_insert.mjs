import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snpxhrovyogwboydqcmh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNucHhocm92eW9nd2JveWRxY21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzM0MzIsImV4cCI6MjEwNTQwOTQzMn0.WbAr1yCceQ5L9vN-_n4W9IkeQorPo8HuqagazNmXhwg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullInsert() {
  const payload = {
    name: "Full Flow Test Project " + Date.now(),
    project_id: "PRJ-TEST-" + Date.now().toString().slice(-4),
    department: "Municipal Administration (GHMC)",
    project_type: "Roads",
    description: "Full flow testing project creation with all fields",
    location: "Kukatpally, Hyderabad",
    district: "Hyderabad",
    latitude: 17.4875,
    longitude: 78.4158,
    project_manager_id: "c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea",
    manager_name: "Er. PM Sharma",
    field_officer_id: "0bc0bb36-1638-467e-a92b-86ff28c81559",
    contractor_id: "CON-001",
    contractor_name: "Metro Infrastructure Pvt Ltd",
    start_date: "2026-04-01",
    expected_completion_date: "2026-12-31",
    total_budget_cr: 18.5,
    allocated_budget_cr: 18.5,
    spent_budget_cr: 2.5,
    actual_progress_percentage: 15,
    expected_progress_percentage: 20,
    status: "On Track",
    risk_level: "Low",
    priority: "High",
    delay_probability: 12.5,
    predicted_delay_days: 0,
    objectives: ["Deliver high quality roads", "Minimize civic disruption"],
    milestones: [
      { id: "M-1", name: "Survey and Clearances", targetDate: "2026-05-01", status: "In Progress", weightPercentage: 25 },
      { id: "M-2", name: "Excavation and Sub-base", targetDate: "2026-08-01", status: "Pending", weightPercentage: 35 },
      { id: "M-3", name: "Bitumen Laying", targetDate: "2026-11-01", status: "Pending", weightPercentage: 25 },
      { id: "M-4", name: "Handover and Signoff", targetDate: "2026-12-31", status: "Pending", weightPercentage: 15 }
    ],
    documents: [
      { id: "DOC-1", title: "Administrative Sanction Order", fileType: "PDF", uploadedBy: "Administrator", uploadedAt: "2026-04-01" }
    ],
    health_score: { overall: 85, schedule: 85, budget: 90, quality: 85, risk: 80, contractor: 85, statusText: "Low Risk" },
    ai_prediction: {
      delayProbability: 12.5,
      riskLevel: "Low",
      predictedDelayDays: 0,
      explanation: "Initial project parameters within safe margins.",
      riskFactors: [],
      recommendations: ["Ensure timely aggregate delivery"]
    }
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("INSERT FAILED:", error);
  } else {
    console.log("INSERT SUCCEEDED! Project ID:", data.id);
    console.log("Inserted Name:", data.name);
    console.log("Inserted Milestones:", data.milestones);

    // Clean up
    await supabase.from('projects').delete().eq('id', data.id);
    console.log("Cleaned up successfully");
  }
}

testFullInsert();
