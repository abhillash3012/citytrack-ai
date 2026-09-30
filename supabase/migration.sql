-- ====================================================================
-- CityTrack AI — Complete Idempotent Schema Migration
-- Run this in Supabase SQL Editor to safely align all existing tables
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROJECTS TABLE — Add project_id and all expected columns safely
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

-- Create unique index on project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_project_id_unique ON public.projects(project_id) WHERE project_id IS NOT NULL;

-- 3. CONTRACTORS TABLE
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

-- 4. MILESTONES TABLE
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

-- 5. ISSUES TABLE
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

-- 6. FIELD UPDATES TABLE
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

-- 7. AI PREDICTIONS TABLE
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

-- 8. ALERTS TABLE
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS alert_type TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 9. NOTIFICATIONS TABLE
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 10. BUDGET TRANSACTIONS TABLE
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

-- 11. AUDIT LOGS TABLE
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

-- 12. INSPECTIONS TABLE
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspection_id TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS reported_progress NUMERIC(5, 2) DEFAULT 0.00;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS manager_remark TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS manager_remark_saved_at TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS timestamp TEXT;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}'::jsonb;

-- 13. DOCUMENTS TABLE
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

-- 14. PROJECT PHOTOS TABLE
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

-- 15. ROW LEVEL SECURITY POLICIES (Enables full application functionality)
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
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "%s_all_policy" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "%s_all_policy" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- 16. STORAGE BUCKETS SETUP
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

-- 17. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
