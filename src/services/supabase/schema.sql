-- ====================================================================
-- CityTrack AI — Complete Schema & Policy Definitions
-- Compatible with PostgreSQL 15+, PostgREST, and Supabase Storage
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'Field Officer',
    department TEXT DEFAULT 'Municipal Infrastructure',
    status TEXT DEFAULT 'Active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    project_type TEXT NOT NULL DEFAULT 'Roads',
    description TEXT,
    location TEXT NOT NULL,
    district TEXT DEFAULT 'Hyderabad',
    latitude DOUBLE PRECISION DEFAULT 17.4000,
    longitude DOUBLE PRECISION DEFAULT 78.4500,
    manager_name TEXT,
    project_manager_id TEXT,
    field_officer_id TEXT,
    contractor_id TEXT,
    contractor_name TEXT,
    start_date TEXT,
    expected_completion_date TEXT,
    revised_completion_date TEXT,
    total_budget_cr NUMERIC(14, 2) DEFAULT 0.00,
    allocated_budget_cr NUMERIC(14, 2) DEFAULT 0.00,
    spent_budget_cr NUMERIC(14, 2) DEFAULT 0.00,
    actual_progress_percentage NUMERIC(5, 2) DEFAULT 0.00,
    expected_progress_percentage NUMERIC(5, 2) DEFAULT 0.00,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'On Track',
    risk_level TEXT DEFAULT 'Low',
    health_score JSONB DEFAULT '{"overall":80,"schedule":80,"budget":80,"quality":80,"risk":80,"contractor":80,"statusText":"Low Risk"}'::jsonb,
    delay_probability NUMERIC(5, 2) DEFAULT 0.00,
    predicted_delay_days INTEGER DEFAULT 0,
    milestones JSONB DEFAULT '[]'::jsonb,
    photographs JSONB DEFAULT '[]'::jsonb,
    issues JSONB DEFAULT '[]'::jsonb,
    field_updates JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    ai_prediction JSONB DEFAULT '{}'::jsonb,
    objectives JSONB DEFAULT '[]'::jsonb,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CONTRACTORS TABLE
CREATE TABLE IF NOT EXISTS public.contractors (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    performance_score NUMERIC(5, 2) DEFAULT 80.00,
    schedule_score NUMERIC(5, 2) DEFAULT 80.00,
    quality_score NUMERIC(5, 2) DEFAULT 80.00,
    budget_score NUMERIC(5, 2) DEFAULT 80.00,
    reliability_score NUMERIC(5, 2) DEFAULT 80.00,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inspections (
    id TEXT PRIMARY KEY,
    inspection_id TEXT,
    project_id TEXT NOT NULL,
    project_name TEXT,
    project_location TEXT,
    officer_id TEXT,
    officer_name TEXT,
    field_officer_id TEXT,
    field_officer_name TEXT,
    project_manager_id TEXT,
    inspection_date TEXT,
    timestamp TEXT,
    progress NUMERIC(5, 2) DEFAULT 0.00,
    remarks TEXT,
    ai_generated_remarks TEXT,
    officer_remarks TEXT,
    officer_submitted_remarks TEXT,
    severity TEXT DEFAULT 'Low',
    ai_visual_progress NUMERIC(5, 2) DEFAULT 0.00,
    ai_delay_probability NUMERIC(5, 2) DEFAULT 0.00,
    ai_risk_level TEXT DEFAULT 'Low',
    predicted_delay_days INTEGER DEFAULT 0,
    ai_explanation TEXT,
    construction_activity TEXT,
    visible_work TEXT,
    workers_equipment TEXT,
    materials TEXT,
    site_condition TEXT,
    safety_concerns TEXT,
    quality_concerns TEXT,
    safety_quality_concerns TEXT,
    visual_confidence TEXT DEFAULT 'HIGH',
    ai_recommendations JSONB DEFAULT '[]'::jsonb,
    before_image_reference TEXT,
    after_image_reference TEXT,
    current_image_reference TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'SUBMITTED',
    manager_viewed BOOLEAN DEFAULT false,
    manager_viewed_at TIMESTAMPTZ,
    manager_remark TEXT,
    manager_remark_saved_at TEXT,
    is_demo_prediction BOOLEAN DEFAULT false,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FIELD UPDATES TABLE
CREATE TABLE IF NOT EXISTS public.field_updates (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    project_name TEXT,
    officer_name TEXT NOT NULL,
    reported_progress_percentage NUMERIC(5, 2) NOT NULL,
    remarks TEXT,
    photo_url TEXT,
    before_image_reference TEXT,
    after_image_reference TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    ai_risk_level TEXT DEFAULT 'Low',
    timestamp TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ISSUES TABLE
CREATE TABLE IF NOT EXISTS public.issues (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'Medium',
    category TEXT DEFAULT 'Construction',
    status TEXT DEFAULT 'Open',
    reported_by TEXT,
    reported_at TEXT,
    assigned_to TEXT,
    resolution_notes TEXT,
    resolved_at TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. MILESTONES TABLE
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Construction',
    target_date TEXT,
    actual_date TEXT,
    status TEXT DEFAULT 'Pending',
    weight_percentage NUMERIC(5, 2) DEFAULT 25.00,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Medium',
    due_date TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. BUDGET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.budget_transactions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    transaction_date TEXT,
    amount_cr NUMERIC(14, 2) DEFAULT 0.00,
    category TEXT,
    vendor TEXT,
    description TEXT,
    approved_by TEXT,
    status TEXT DEFAULT 'Approved',
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Government Approval',
    file_type TEXT DEFAULT 'PDF',
    file_size TEXT,
    file_url TEXT,
    uploaded_by TEXT,
    uploaded_at TEXT,
    version TEXT DEFAULT 'v1.0',
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. PROJECT PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.project_photos (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    caption TEXT,
    category TEXT DEFAULT 'Progress',
    photo_type TEXT DEFAULT 'Progress',
    url TEXT,
    file_path TEXT,
    phase TEXT DEFAULT 'Execution',
    uploaded_by TEXT,
    uploaded_at TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. ALERTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    project_name TEXT,
    type TEXT DEFAULT 'Warning',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'Medium',
    priority TEXT DEFAULT 'Medium',
    is_read BOOLEAN DEFAULT false,
    timestamp TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    project_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    role TEXT,
    action TEXT NOT NULL,
    project_id TEXT,
    project_name TEXT,
    timestamp TEXT,
    ip_address TEXT,
    device TEXT,
    details TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    role TEXT,
    action TEXT NOT NULL,
    project_id TEXT,
    project_name TEXT,
    timestamp TEXT,
    ip_address TEXT,
    device TEXT,
    details TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. AI PREDICTIONS
CREATE TABLE IF NOT EXISTS public.ai_predictions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    delay_probability NUMERIC(5, 2) DEFAULT 0.00,
    predicted_delay_days INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'Low',
    explanation TEXT,
    risk_factors JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    expected_completion_date TEXT,
    revised_completion_date TEXT,
    data_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. IDEMPOTENT TABLE COLUMN MIGRATION SAFEGUARDS (For existing databases)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS delay_probability NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS predicted_delay_days INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_budget NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS allocated_budget NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS spent_budget NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS allocated_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS spent_budget_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_completion_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS photographs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS issues JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS field_updates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ai_prediction JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_project_id_unique ON public.projects(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS performance_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS schedule_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS budget_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS weight_percentage NUMERIC(5, 2) DEFAULT 25.00;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Construction';
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Construction';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'Medium';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS reported_by TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS reported_at TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS field_officer_id TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS officer_name TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS reported_progress_percentage NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS issue_reported BOOLEAN DEFAULT false;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.field_updates ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS delay_probability NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS predicted_delay_days INTEGER DEFAULT 0;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Low';
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS health_score NUMERIC(5, 2) DEFAULT 80.00;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS schedule_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS budget_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS contractor_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS procurement_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS quality_risk TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.ai_predictions ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS alert_type TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'Payment';
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS amount_cr NUMERIC(14, 2) DEFAULT 0.00;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS vendor TEXT;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Approved';
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.budget_transactions ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspection_id TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS reported_progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS manager_remark TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS manager_remark_saved_at TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_at TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Progress';
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS photo_type TEXT DEFAULT 'Progress';
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'Execution';
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.project_photos ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

-- 18. RLS POLICIES FOR ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'profiles', 'projects', 'contractors', 'inspections', 'field_updates',
        'issues', 'milestones', 'tasks', 'budget_transactions', 'documents',
        'project_photos', 'alerts', 'notifications', 'audit_logs', 'activity_logs',
        'ai_predictions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_all_policy" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "%s_all_policy" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- 18. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('inspections', 'inspections', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/*']),
    ('documents', 'documents', true, 26214400, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "inspections_storage_all" ON storage.objects;
CREATE POLICY "inspections_storage_all" ON storage.objects
FOR ALL TO public
USING (bucket_id = 'inspections' OR bucket_id = 'documents')
WITH CHECK (bucket_id = 'inspections' OR bucket_id = 'documents');

NOTIFY pgrst, 'reload schema';
