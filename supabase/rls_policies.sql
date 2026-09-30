-- ==============================================================================
-- CityTrack AI — Supabase Row Level Security (RLS) & Storage Security Policies
-- ==============================================================================
-- Roles:
--   1. Administrator
--   2. Project Manager
--   3. Field Officer
--   4. Contractor
--
-- All authorization is driven by public.profiles.role matching auth.uid()
-- Never trust client-supplied roles.
-- ==============================================================================

-- 1. Helper Function: Get current authenticated user's role from public.profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Helper Function: Check if user is Administrator
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

-- ==============================================================================
-- TABLE: public.profiles
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated users can read profiles (for assignments, names, directories)
DROP POLICY IF EXISTS "Allow authenticated read on profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read on profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update: Users can update their own profile; Admin can update any
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Insert: Handled via trigger on auth.users or Admin
DROP POLICY IF EXISTS "Admin insert profiles" ON public.profiles;
CREATE POLICY "Admin insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR id = auth.uid());

-- ==============================================================================
-- TABLE: public.projects
-- ==============================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT
-- Administrator: Read ALL projects
-- Project Manager: Read assigned projects (project_manager_id = auth.uid())
-- Field Officer: Read assigned projects (field_officer_id = auth.uid())
-- Contractor: Read assigned/permitted projects (contractor_id matching contractor or assigned)
DROP POLICY IF EXISTS "Projects role-based select" ON public.projects;
CREATE POLICY "Projects role-based select"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR project_manager_id = auth.uid()
    OR field_officer_id = auth.uid()
    OR (
      public.current_user_role() = 'Contractor' 
      AND (
        contractor_id IN (
          SELECT id::text FROM public.contractors 
          WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
        OR contractor_name ILIKE '%' || (SELECT full_name FROM public.profiles WHERE id = auth.uid()) || '%'
      )
    )
  );

-- Policy 2: INSERT (Administrator Only)
DROP POLICY IF EXISTS "Projects admin insert" ON public.projects;
CREATE POLICY "Projects admin insert"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Policy 3: UPDATE (Administrator Only)
DROP POLICY IF EXISTS "Projects admin update" ON public.projects;
CREATE POLICY "Projects admin update"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policy 4: DELETE (Administrator Only)
DROP POLICY IF EXISTS "Projects admin delete" ON public.projects;
CREATE POLICY "Projects admin delete"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- TABLE: public.inspections
-- ==============================================================================
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT
-- Administrator: Read ALL inspections
-- Project Manager: Read inspections for projects assigned to this PM (project_manager_id = auth.uid())
-- Field Officer: Read inspections created by officer or for assigned projects (officer_id = auth.uid())
-- Contractor: STRICTLY NO ACCESS to inspections table
DROP POLICY IF EXISTS "Inspections role-based select" ON public.inspections;
CREATE POLICY "Inspections role-based select"
  ON public.inspections
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR project_manager_id = auth.uid()
    OR officer_id = auth.uid()
    OR (
      project_id IN (
        SELECT id FROM public.projects 
        WHERE project_manager_id = auth.uid() OR field_officer_id = auth.uid()
      )
    )
  );

-- Policy 2: INSERT
-- Field Officer: Insert inspections for assigned projects
-- Administrator: Full insert
DROP POLICY IF EXISTS "Inspections insert policy" ON public.inspections;
CREATE POLICY "Inspections insert policy"
  ON public.inspections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.current_user_role() = 'Field Officer'
      AND officer_id = auth.uid()
      AND project_id IN (
        SELECT id FROM public.projects WHERE field_officer_id = auth.uid()
      )
    )
  );

-- Policy 3: UPDATE
-- Administrator: Full update
-- Project Manager: Update status, manager remarks, review timestamps for assigned projects
DROP POLICY IF EXISTS "Inspections update policy" ON public.inspections;
CREATE POLICY "Inspections update policy"
  ON public.inspections
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.current_user_role() = 'Project Manager'
      AND (
        project_manager_id = auth.uid()
        OR project_id IN (
          SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.current_user_role() = 'Project Manager'
      AND (
        project_manager_id = auth.uid()
        OR project_id IN (
          SELECT id FROM public.projects WHERE project_manager_id = auth.uid()
        )
      )
    )
  );

-- Policy 4: DELETE (Administrator Only)
DROP POLICY IF EXISTS "Inspections admin delete" ON public.inspections;
CREATE POLICY "Inspections admin delete"
  ON public.inspections
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- TABLE: public.contractors
-- ==============================================================================
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors read for authenticated" ON public.contractors;
CREATE POLICY "Contractors read for authenticated"
  ON public.contractors
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Contractors admin insert" ON public.contractors;
CREATE POLICY "Contractors admin insert"
  ON public.contractors
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Contractors admin update" ON public.contractors;
CREATE POLICY "Contractors admin update"
  ON public.contractors
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ==============================================================================
-- TABLE: public.alerts
-- ==============================================================================
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alerts authenticated select" ON public.alerts;
CREATE POLICY "Alerts authenticated select"
  ON public.alerts
  FOR SELECT
  TO authenticated
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
CREATE POLICY "Alerts insert policy"
  ON public.alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.current_user_role() = 'Administrator'
    OR public.current_user_role() = 'Project Manager'
  );

DROP POLICY IF EXISTS "Alerts update policy" ON public.alerts;
CREATE POLICY "Alerts update policy"
  ON public.alerts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'Administrator');

-- ==============================================================================
-- TABLE: public.notifications
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications authenticated select" ON public.notifications;
CREATE POLICY "Notifications authenticated select"
  ON public.notifications
  FOR SELECT
  TO authenticated
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
CREATE POLICY "Notifications insert policy"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.current_user_role() = 'Administrator'
    OR public.current_user_role() = 'Project Manager'
  );

DROP POLICY IF EXISTS "Notifications update policy" ON public.notifications;
CREATE POLICY "Notifications update policy"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
  );

-- ==============================================================================
-- STORAGE POLICIES: inspections bucket (PRIVATE)
-- ==============================================================================
-- Path Convention: {project_id}/{user_id}/{timestamp}-{filename}
-- ==============================================================================

-- 1. Storage READ:
-- Administrator: Full read of all inspection photos
-- Project Manager: Read photos only for assigned projects (project_id matching assigned projects)
-- Field Officer: Read photos uploaded for assigned projects
-- Contractor: NO PHOTO ACCESS
DROP POLICY IF EXISTS "Storage inspection photo read policy" ON storage.objects;
CREATE POLICY "Storage inspection photo read policy"
  ON storage.objects
  FOR SELECT
  TO authenticated
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

-- 2. Storage UPLOAD:
-- Field Officer: Upload only for assigned projects and their own user folder
-- Administrator: Full upload access
DROP POLICY IF EXISTS "Storage inspection photo upload policy" ON storage.objects;
CREATE POLICY "Storage inspection photo upload policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
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

-- 3. Storage DELETE:
-- Administrator Only
DROP POLICY IF EXISTS "Storage inspection photo delete policy" ON storage.objects;
CREATE POLICY "Storage inspection photo delete policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inspections'
    AND public.is_admin()
  );
