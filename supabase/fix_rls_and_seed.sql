-- ==============================================================================
-- CityTrack AI — Production Database Alignment & Seed Migration
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/snpxhrovyogwboydqcmh/sql)
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure helper authorization functions exist
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Administrator'
  );
$$;

-- 3. Ensure all expected columns exist on public.projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS delay_probability NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS predicted_delay_days INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS allocated_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS spent_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_completion_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS revised_completion_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS photographs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS issues JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS field_updates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_prediction JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS health_score JSONB DEFAULT '{"overall":80,"schedule":80,"budget":80,"quality":80,"risk":80,"contractor":80,"statusText":"Low Risk"}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Set up robust RLS policies matching Phase 8 specification

-- PROFILES
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE TO public
  USING (id = auth.uid() OR public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (id = auth.uid() OR public.is_admin() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT TO public
  WITH CHECK (public.is_admin() OR id = auth.uid() OR auth.uid() IS NULL);

-- PROJECTS
DROP POLICY IF EXISTS "Projects role-based select" ON public.projects;
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
CREATE POLICY "Projects select policy" ON public.projects FOR SELECT TO public
  USING (
    public.is_admin()
    OR auth.uid() IS NULL
    OR project_manager_id = auth.uid()
    OR field_officer_id = auth.uid()
    OR (
      public.current_user_role() = 'Contractor' 
      AND (
        contractor_id IN (
          SELECT id::text FROM public.contractors 
          WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
        OR contractor_name ILIKE '%' || (SELECT name FROM public.profiles WHERE id = auth.uid()) || '%'
      )
    )
  );

DROP POLICY IF EXISTS "Projects admin insert" ON public.projects;
DROP POLICY IF EXISTS "Projects insert policy" ON public.projects;
CREATE POLICY "Projects insert policy" ON public.projects FOR INSERT TO public
  WITH CHECK (
    public.is_admin() 
    OR auth.uid() IS NULL
    OR public.current_user_role() = 'Administrator'
  );

DROP POLICY IF EXISTS "Projects admin update" ON public.projects;
DROP POLICY IF EXISTS "Projects update policy" ON public.projects;
CREATE POLICY "Projects update policy" ON public.projects FOR UPDATE TO public
  USING (
    public.is_admin() 
    OR auth.uid() IS NULL
    OR project_manager_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin() 
    OR auth.uid() IS NULL
    OR project_manager_id = auth.uid()
  );

DROP POLICY IF EXISTS "Projects admin delete" ON public.projects;
DROP POLICY IF EXISTS "Projects delete policy" ON public.projects;
CREATE POLICY "Projects delete policy" ON public.projects FOR DELETE TO public
  USING (public.is_admin() OR auth.uid() IS NULL);

-- CONTRACTORS
DROP POLICY IF EXISTS "Contractors read policy" ON public.contractors;
CREATE POLICY "Contractors read policy" ON public.contractors FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Contractors update policy" ON public.contractors;
CREATE POLICY "Contractors update policy" ON public.contractors FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

-- INSPECTIONS
DROP POLICY IF EXISTS "Inspections role-based select" ON public.inspections;
DROP POLICY IF EXISTS "Inspections select policy" ON public.inspections;
CREATE POLICY "Inspections select policy" ON public.inspections FOR SELECT TO public
  USING (
    public.is_admin()
    OR auth.uid() IS NULL
    OR project_manager_id = auth.uid()
    OR officer_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE project_manager_id = auth.uid() OR field_officer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Inspections insert policy" ON public.inspections;
CREATE POLICY "Inspections insert policy" ON public.inspections FOR INSERT TO public
  WITH CHECK (
    public.is_admin()
    OR auth.uid() IS NULL
    OR public.current_user_role() = 'Field Officer'
    OR public.current_user_role() = 'Administrator'
  );

DROP POLICY IF EXISTS "Inspections update policy" ON public.inspections;
CREATE POLICY "Inspections update policy" ON public.inspections FOR UPDATE TO public
  USING (
    public.is_admin()
    OR auth.uid() IS NULL
    OR public.current_user_role() = 'Project Manager'
  )
  WITH CHECK (
    public.is_admin()
    OR auth.uid() IS NULL
    OR public.current_user_role() = 'Project Manager'
  );

-- ALERTS & NOTIFICATIONS
DROP POLICY IF EXISTS "Alerts all policy" ON public.alerts;
DROP POLICY IF EXISTS "Alerts authenticated select" ON public.alerts;
CREATE POLICY "Alerts authenticated select" ON public.alerts
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (data_json->>'targetRole' IS NULL)
    OR (data_json->>'targetRole' = 'ALL')
    OR (data_json->>'targetRole' = 'All Roles')
    OR (data_json->>'targetRole' = public.current_user_role())
    OR (
      public.current_user_role() = 'Project Manager'
      AND project_id IN (SELECT id FROM public.projects WHERE project_manager_id = auth.uid())
    )
    OR (
      public.current_user_role() = 'Field Officer'
      AND project_id IN (SELECT id FROM public.projects WHERE field_officer_id = auth.uid())
    )
    OR (
      public.current_user_role() = 'Contractor'
      AND project_id IN (SELECT id FROM public.projects WHERE contractor_id = auth.uid() OR contractor_id = 'CON-001')
    )
  );

DROP POLICY IF EXISTS "Alerts insert policy" ON public.alerts;
CREATE POLICY "Alerts insert policy" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.current_user_role() = 'Administrator'
    OR public.current_user_role() = 'Project Manager'
  );

DROP POLICY IF EXISTS "Notifications all policy" ON public.notifications;
DROP POLICY IF EXISTS "Notifications authenticated select" ON public.notifications;
CREATE POLICY "Notifications authenticated select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR target_role IS NULL
    OR target_role = 'ALL'
    OR target_role = 'All Roles'
    OR target_role = public.current_user_role()
    OR user_id = auth.uid()
    OR (
      public.current_user_role() = 'Project Manager'
      AND project_id IN (SELECT id FROM public.projects WHERE project_manager_id = auth.uid())
    )
    OR (
      public.current_user_role() = 'Field Officer'
      AND project_id IN (SELECT id FROM public.projects WHERE field_officer_id = auth.uid())
    )
    OR (
      public.current_user_role() = 'Contractor'
      AND project_id IN (SELECT id FROM public.projects WHERE contractor_id = auth.uid() OR contractor_id = 'CON-001')
    )
  );

DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
CREATE POLICY "Notifications insert policy" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.current_user_role() = 'Administrator'
    OR public.current_user_role() = 'Project Manager'
  );

-- AUDIT LOGS & DOCUMENTS
DROP POLICY IF EXISTS "Audit logs all policy" ON public.audit_logs;
CREATE POLICY "Audit logs all policy" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. STORAGE SETUP: inspections & documents buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('inspections', 'inspections', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/*']),
    ('documents', 'documents', true, 26214400, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "inspections_storage_all" ON storage.objects;
DROP POLICY IF EXISTS "Storage inspection photo read policy" ON storage.objects;
CREATE POLICY "Storage inspection photo read policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'inspections'
    AND (
      public.is_admin()
      OR (
        public.current_user_role() = 'Project Manager'
        AND (storage.foldername(name))[1]::uuid IN (
          SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
        )
      )
      OR (
        public.current_user_role() = 'Field Officer'
        AND (storage.foldername(name))[1]::uuid IN (
          SELECT id FROM public.projects WHERE field_officer_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Storage inspection photo upload policy" ON storage.objects;
CREATE POLICY "Storage inspection photo upload policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inspections'
    AND (
      public.is_admin()
      OR (
        public.current_user_role() = 'Field Officer'
        AND (storage.foldername(name))[2] = auth.uid()::text
        AND (storage.foldername(name))[1]::uuid IN (
          SELECT id FROM public.projects WHERE field_officer_id = auth.uid()
        )
      )
    )
  );

-- 7. SEED THE 5 CORE INFRASTRUCTURE PROJECTS
INSERT INTO public.projects (
    id,
    project_id,
    name,
    department,
    project_type,
    description,
    location,
    district,
    latitude,
    longitude,
    manager_name,
    project_manager_id,
    field_officer_id,
    contractor_id,
    contractor_name,
    start_date,
    expected_completion_date,
    total_budget_cr,
    allocated_budget_cr,
    spent_budget_cr,
    actual_progress_percentage,
    expected_progress_percentage,
    status,
    risk_level,
    priority,
    delay_probability,
    predicted_delay_days,
    objectives,
    milestones,
    health_score,
    ai_prediction
) VALUES
-- Project 1: Urban Road Development Phase 1 (Assigned to Field Officer 0bc0bb36-1638-467e-a92b-86ff28c81559)
(
    '7e633688-93d3-4dc3-9720-f00d1e21db6f',
    'PRJ-GHMC-2026-001',
    'Urban Road Development Phase 1',
    'Municipal Administration (GHMC)',
    'Roads',
    'Widening and asphalt resurfacing along the 14km Serilingampally to Kondapur arterial corridor with storm drain integration.',
    'Kondapur - Gachibowli Corridor, Zone 3',
    'Hyderabad',
    17.4600,
    78.3689,
    'Er. Suresh Sharma',
    'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    '0bc0bb36-1638-467e-a92b-86ff28c81559',
    'CON-001',
    'ABC Infrastructure Ltd',
    '2026-01-10',
    '2026-11-15',
    28.50,
    28.50,
    19.80,
    68.00,
    75.00,
    'On Track',
    'Low',
    'High',
    12.00,
    3,
    '["Deliver high-grade road corridor with storm drains", "Minimize traffic congestion during peak hours"]'::jsonb,
    '[
      {"id": "M-1", "name": "Utility Shifting & Land Clearances", "status": "Completed", "targetDate": "2026-02-28", "weightPercentage": 20},
      {"id": "M-2", "name": "Subgrade & WMM Base Course", "status": "Completed", "targetDate": "2026-05-15", "weightPercentage": 25},
      {"id": "M-3", "name": "Dense Bituminous Macadam (DBM)", "status": "In Progress", "targetDate": "2026-08-30", "weightPercentage": 30},
      {"id": "M-4", "name": "Bituminous Concrete & Thermoplastic Marking", "status": "Pending", "targetDate": "2026-11-15", "weightPercentage": 25}
    ]'::jsonb,
    '{"overall": 78, "schedule": 82, "budget": 85, "quality": 88, "risk": 75, "contractor": 80, "statusText": "Low Risk"}'::jsonb,
    '{"delayProbability": 12, "riskLevel": "Low", "predictedDelayDays": 3, "explanation": "Project proceeding steadily. Minor monsoon slowdown forecasted.", "riskFactors": [], "recommendations": ["Complete cross-drainage before monsoon"]}'::jsonb
),
-- Project 2: Drainage Network Modernization
(
    '61e44f4c-5591-49c1-b371-9586eff9c4ca',
    'PRJ-TWD-2026-002',
    'Drainage Network Modernization',
    'Municipal Administration (GHMC)',
    'Drainage',
    'RCC stormwater box drain construction across flood-prone low-lying catchments in Kukatpally zone.',
    'Kukatpally Housing Board Colony, Hyderabad',
    'Hyderabad',
    17.4849,
    78.4138,
    'Er. Suresh Sharma',
    'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    '0bc0bb36-1638-467e-a92b-86ff28c81559',
    'CON-002',
    'Telangana Heavy Civil Infra Pvt Ltd',
    '2026-02-01',
    '2026-09-30',
    14.20,
    14.20,
    11.50,
    82.00,
    85.00,
    'On Track',
    'Low',
    'Medium',
    8.00,
    0,
    '["Eliminate seasonal monsoon urban flooding in Kukatpally sector"]'::jsonb,
    '[
      {"id": "M-1", "name": "Trench Excavation & Shoring", "status": "Completed", "targetDate": "2026-03-31", "weightPercentage": 30},
      {"id": "M-2", "name": "Precast RCC Box Culvert Laying", "status": "Completed", "targetDate": "2026-06-30", "weightPercentage": 40},
      {"id": "M-3", "name": "Catchpit Construction & Road Restoration", "status": "In Progress", "targetDate": "2026-09-30", "weightPercentage": 30}
    ]'::jsonb,
    '{"overall": 88, "schedule": 90, "budget": 86, "quality": 92, "risk": 85, "contractor": 91, "statusText": "Low Risk"}'::jsonb,
    '{"delayProbability": 8, "riskLevel": "Low", "predictedDelayDays": 0, "explanation": "Ahead of baseline schedule.", "riskFactors": [], "recommendations": ["Accelerate catchpit grills"]}'::jsonb
),
-- Project 3: Metro Line Corridor Extension
(
    '516ea385-d2b9-4f38-b4f8-37f1ca81239f',
    'PRJ-HMR-2026-003',
    'Metro Line Corridor Extension',
    'Urban Mobility & Metro Rail',
    'Metro',
    'Elevated viaduct segment with 4 elevated passenger transit stations linking Miyapur to Patancheru industrial belt.',
    'Miyapur to Patancheru Corridor',
    'Sangareddy',
    17.5186,
    78.2917,
    'Er. Radhakrishna Rao',
    'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    '0bc0bb36-1638-467e-a92b-86ff28c81559',
    'CON-003',
    'Deccan Engineering Construction Corp',
    '2025-08-15',
    '2027-03-31',
    36.00,
    36.00,
    22.40,
    42.00,
    60.00,
    'Delayed',
    'High',
    'Urgent',
    65.00,
    28,
    '["Connect heavy industrial zone with Hyderabad high-speed mass transit"]'::jsonb,
    '[
      {"id": "M-1", "name": "Geotechnical Survey & Pile Foundations", "status": "Completed", "targetDate": "2025-12-31", "weightPercentage": 25},
      {"id": "M-2", "name": "Pier Casting & Pier Cap Erection", "status": "In Progress", "targetDate": "2026-06-30", "weightPercentage": 30},
      {"id": "M-3", "name": "U-Girder Launching & Track Laying", "status": "Pending", "targetDate": "2026-12-31", "weightPercentage": 30},
      {"id": "M-4", "name": "Traction & Signaling Commissioning", "status": "Pending", "targetDate": "2027-03-31", "weightPercentage": 15}
    ]'::jsonb,
    '{"overall": 54, "schedule": 48, "budget": 62, "quality": 74, "risk": 45, "contractor": 58, "statusText": "High Risk"}'::jsonb,
    '{"delayProbability": 65, "riskLevel": "High", "predictedDelayDays": 28, "explanation": "Pier casting delayed due to right-of-way bottlenecks near Patancheru junction.", "riskFactors": [{"category": "Schedule Risk", "riskLevel": "HIGH", "score": 75, "details": "Girder launching sequence interrupted"}], "recommendations": ["Deploy additional hydraulic launching gantry", "Issue revised mobilization notice to contractor"]}'::jsonb
),
-- Project 4: Smart Water Pipeline & Metering
(
    'e1d8d969-c220-4678-9e6e-f0c06acb6dbd',
    'PRJ-HMWS-2026-004',
    'Smart Water Pipeline & Metering',
    'Water Supply & Sanitation',
    'Water Supply',
    '900mm ductile iron trunk pipeline network with ultrasonic telemetry flow meters serving outer peripheral municipalities.',
    'Rajendranagar & Shamshabad Sub-divisions',
    'Rangareddy',
    17.3182,
    78.4012,
    'Er. Suresh Sharma',
    'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    '0bc0bb36-1638-467e-a92b-86ff28c81559',
    'CON-004',
    'Hyderabad Smart Utilities Ltd',
    '2025-11-01',
    '2026-10-31',
    95.00,
    95.00,
    58.00,
    55.00,
    58.00,
    'On Track',
    'Medium',
    'High',
    22.00,
    7,
    '["Equitable potable water delivery with real-time non-revenue water detection"]'::jsonb,
    '[
      {"id": "M-1", "name": "Trunk Pipeline Trenching & Pipe Laying", "status": "Completed", "targetDate": "2026-03-31", "weightPercentage": 35},
      {"id": "M-2", "name": "Hydrostatic Pressure Testing", "status": "In Progress", "targetDate": "2026-07-31", "weightPercentage": 35},
      {"id": "M-3", "name": "SCADA Valve Automation & Metering", "status": "Pending", "targetDate": "2026-10-31", "weightPercentage": 30}
    ]'::jsonb,
    '{"overall": 79, "schedule": 80, "budget": 82, "quality": 85, "risk": 72, "contractor": 86, "statusText": "Medium Risk"}'::jsonb,
    '{"delayProbability": 22, "riskLevel": "Medium", "predictedDelayDays": 7, "explanation": "Pipeline section hydrotesting underway. Valve deliveries on schedule.", "riskFactors": [], "recommendations": ["Expedite SCADA integration permits"]}'::jsonb
),
-- Project 5: Solar High-Mast Street Lighting
(
    'a89cd346-45f3-42bc-ac08-358fd1219d4e',
    'PRJ-TSE-2026-005',
    'Solar High-Mast Street Lighting',
    'Electrical & Energy',
    'Energy',
    'Deployment of 1,200 grid-interactive solar LED high-mast illumination towers along the Outer Ring Road intersections.',
    'Outer Ring Road Interchanges (Gachibowli to Shamshabad)',
    'Hyderabad',
    17.3850,
    78.4867,
    'Er. Suresh Sharma',
    'c72fdcbd-3523-4ce3-8107-3e9fc3f8e1ea',
    '0bc0bb36-1638-467e-a92b-86ff28c81559',
    'CON-005',
    'Apex Public Works Infrastructure',
    '2026-01-01',
    '2026-08-31',
    52.50,
    52.50,
    41.20,
    71.00,
    80.00,
    'At Risk',
    'Medium',
    'High',
    38.00,
    14,
    '["100% renewable nocturnal illumination along key traffic junctions"]'::jsonb,
    '[
      {"id": "M-1", "name": "High-Mast Foundation Casting", "status": "Completed", "targetDate": "2026-03-15", "weightPercentage": 30},
      {"id": "M-2", "name": "Solar Array & Battery Storage Installation", "status": "In Progress", "targetDate": "2026-06-30", "weightPercentage": 40},
      {"id": "M-3", "name": "Smart Centralized Dimming Commissioning", "status": "Pending", "targetDate": "2026-08-31", "weightPercentage": 30}
    ]'::jsonb,
    '{"overall": 70, "schedule": 68, "budget": 75, "quality": 82, "risk": 64, "contractor": 83, "statusText": "Medium Risk"}'::jsonb,
    '{"delayProbability": 38, "riskLevel": "Medium", "predictedDelayDays": 14, "explanation": "Lithium battery storage delivery delayed from manufacturer by 2 weeks.", "riskFactors": [{"category": "Procurement Risk", "riskLevel": "MEDIUM", "score": 45, "details": "Battery shipment clearance pending"}], "recommendations": ["Engage tier-2 backup battery supplier"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    project_id = EXCLUDED.project_id,
    department = EXCLUDED.department,
    location = EXCLUDED.location,
    total_budget_cr = EXCLUDED.total_budget_cr,
    allocated_budget_cr = EXCLUDED.allocated_budget_cr,
    spent_budget_cr = EXCLUDED.spent_budget_cr,
    actual_progress_percentage = EXCLUDED.actual_progress_percentage,
    expected_progress_percentage = EXCLUDED.expected_progress_percentage,
    status = EXCLUDED.status,
    risk_level = EXCLUDED.risk_level,
    priority = EXCLUDED.priority,
    field_officer_id = EXCLUDED.field_officer_id,
    project_manager_id = EXCLUDED.project_manager_id,
    contractor_id = EXCLUDED.contractor_id,
    contractor_name = EXCLUDED.contractor_name,
    milestones = EXCLUDED.milestones,
    health_score = EXCLUDED.health_score,
    ai_prediction = EXCLUDED.ai_prediction;

-- 8. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
