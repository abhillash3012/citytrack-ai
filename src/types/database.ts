/**
 * Supabase Database Table Schema Types (PostgreSQL)
 * Matches the public schema tables in supabase/schema.sql
 */

export interface DbProfile {
  id: string; // UUID primary key, corresponds to auth.users.id
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'Administrator' | 'Project Manager' | 'Field Officer' | 'Contractor';
  department?: string | null;
  status: 'Active' | 'Inactive';
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string; // UUID primary key
  project_id: string; // TEXT UNIQUE, e.g. 'PRJ-GHMC-2026-001'
  name: string;
  description?: string | null;
  project_type: string;
  department: string;
  location: string;
  district?: string | null;
  latitude: number;
  longitude: number;
  project_manager_id?: string | null;
  field_officer_id?: string | null;
  contractor_id?: string | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  actual_completion_date?: string | null;
  total_budget: number;
  allocated_budget: number;
  spent_budget: number;
  progress: number;
  expected_progress: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Completed';
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  health_score: number;
  delay_probability: number;
  predicted_delay_days: number;
  data_json?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DbMilestone {
  id: string; // UUID
  project_id: string; // UUID
  name: string;
  description?: string | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  status: 'Planning' | 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  progress: number;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string; // UUID
  project_id: string; // UUID
  title: string;
  description?: string | null;
  assigned_to?: string | null; // UUID
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFieldUpdate {
  id: string; // UUID
  project_id: string; // UUID
  field_officer_id?: string | null; // UUID
  progress: number;
  remarks: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  issue_reported: boolean;
  created_at: string;
}

export interface DbIssue {
  id: string; // UUID
  project_id: string; // UUID
  reported_by?: string | null; // UUID
  assigned_to?: string | null; // UUID
  issue_type: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  resolution?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface DbContractor {
  id: string; // UUID
  name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  performance_score: number;
  schedule_score: number;
  quality_score: number;
  budget_score: number;
  reliability_score: number;
  data_json?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DbBudgetTransaction {
  id: string; // UUID
  project_id: string; // UUID
  transaction_type: 'Allocation' | 'Expense' | 'Adjustment' | 'Payment';
  description?: string | null;
  amount: number;
  transaction_date: string;
  category?: string | null;
  created_by?: string | null; // UUID
  created_at: string;
}

export interface DbDocument {
  id: string; // UUID
  project_id: string; // UUID
  uploaded_by?: string | null; // UUID
  name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  mime_type?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DbProjectPhoto {
  id: string; // UUID
  project_id: string; // UUID
  uploaded_by?: string | null; // UUID
  file_path: string;
  photo_type: 'Before' | 'Progress' | 'After' | 'Inspection';
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  captured_at: string;
  created_at: string;
}

export interface DbAlert {
  id: string; // UUID
  project_id?: string | null; // UUID
  user_id?: string | null; // UUID
  title: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info' | 'High' | 'Medium' | 'Low';
  alert_type?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DbNotification {
  id: string; // UUID
  user_id?: string | null; // UUID
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  project_id?: string | null; // UUID
  created_at: string;
}

export interface DbAuditLog {
  id: string; // UUID
  user_id?: string | null; // UUID
  action: string;
  project_id?: string | null; // UUID
  entity_type?: string | null;
  entity_id?: string | null;
  description: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface DbAIPrediction {
  id: string; // UUID
  project_id: string; // UUID
  delay_probability: number;
  predicted_delay_days: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  health_score: number;
  schedule_risk?: string | null;
  budget_risk?: string | null;
  contractor_risk?: string | null;
  procurement_risk?: string | null;
  quality_risk?: string | null;
  explanation?: string | null;
  recommendations?: any[] | null;
  created_at: string;
}

export interface DbInspection {
  id: string; // UUID
  project_id: string; // UUID
  officer_id?: string | null;
  project_manager_id?: string | null;
  inspection_date: string;
  reported_progress: number;
  severity: string;
  ai_visual_progress?: number | null;
  ai_delay_probability?: number | null;
  ai_risk_level?: string | null;
  predicted_delay_days?: number | null;
  ai_explanation?: string | null;
  ai_generated_remarks?: string | null;
  construction_activity?: string | null;
  visible_work?: string | null;
  workers_equipment?: string | null;
  materials?: string | null;
  site_condition?: string | null;
  safety_concerns?: string | null;
  quality_concerns?: string | null;
  visual_confidence?: string | null;
  before_image_url?: string | null;
  after_image_url?: string | null;
  current_image_url?: string | null;
  status: string;
  manager_viewed: boolean;
  manager_viewed_at?: string | null;
  created_at: string;
  updated_at: string;
}
