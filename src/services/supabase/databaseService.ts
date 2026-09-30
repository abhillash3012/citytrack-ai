import { supabase } from './config';
import { Project, Contractor, AlertNotification, AuditLog, FieldUpdate, FieldInspection, DocumentItem } from '../../types';
import { MOCK_PROJECTS, MOCK_CONTRACTORS, MOCK_ALERTS, MOCK_AUDIT_LOGS } from '../../data/mockData';
import { formatSupabaseError } from './errorFormatter';

// Supabase Table Names
export const TABLES = {
  PROJECTS: 'projects',
  CONTRACTORS: 'contractors',
  ALERTS: 'alerts',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  PROFILES: 'profiles',
  DOCUMENTS: 'documents',
  INSPECTIONS: 'inspections',
  FIELD_UPDATES: 'field_updates',
  AI_PREDICTIONS: 'ai_predictions',
  MILESTONES: 'milestones',
  BUDGETS: 'budgets',
  EXPENSES: 'expenses',
  PROJECT_UPDATES: 'project_updates'
};

/**
 * Generate a valid deterministic UUID for PostgreSQL UUID columns
 * if the provided ID is an arbitrary string (e.g. 'PRJ-GHMC-2026-001')
 */
export function toValidUuid(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000001';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const clean = (id.replace(/[^a-f0-9]/gi, '') + hex1 + hex2 + '0123456789abcdef0123456789abcdef').slice(0, 32);
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-4${clean.slice(13, 16)}-a${clean.slice(17, 20)}-${clean.slice(20, 32)}`.toLowerCase();
}

/**
 * Sanitize UUID fields: returns lowercased UUID or fallback/null if invalid
 */
export function toSafeUuidOrNull(val: any, fallback?: string | null): string | null {
  if (!val || typeof val !== 'string' || !val.trim()) return fallback || null;
  const clean = val.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    return clean.toLowerCase();
  }
  return fallback || null;
}

/**
 * Maps camelCase Project TypeScript object to PostgreSQL snake_case schema columns
 */
export function mapProjectToDb(proj: Project) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proj.id);
  const uuid = isUuid ? proj.id.toLowerCase() : toValidUuid(proj.id);
  const projCode = proj.projectId || proj.id;

  return {
    id: uuid,
    project_id: projCode,
    name: proj.name,
    department: proj.department,
    project_type: proj.projectType || 'Roads',
    description: proj.description || '',
    location: proj.location,
    district: proj.district || 'Hyderabad',
    latitude: proj.latitude || 17.4000,
    longitude: proj.longitude || 78.4500,
    manager_name: proj.managerName || '',
    project_manager_id: toSafeUuidOrNull(proj.projectManagerId, null),
    field_officer_id: toSafeUuidOrNull(proj.fieldOfficerId, null),
    contractor_name: proj.contractorName || '',
    contractor_id: proj.contractorId || 'CON-001',
    start_date: proj.startDate || new Date().toISOString().split('T')[0],
    expected_completion_date: proj.expectedCompletionDate || '',
    revised_completion_date: proj.revisedCompletionDate || null,
    total_budget_cr: proj.totalBudgetCr || 0,
    allocated_budget_cr: proj.allocatedBudgetCr || proj.totalBudgetCr || 0,
    spent_budget_cr: proj.spentBudgetCr || 0,
    expected_progress_percentage: proj.expectedProgressPercentage || 0,
    actual_progress_percentage: proj.actualProgressPercentage || 0,
    status: proj.status || 'On Track',
    risk_level: proj.riskLevel || 'Low',
    priority: proj.priority || 'Medium',
    objectives: proj.objectives || [],
    milestones: proj.milestones || [],
    photographs: proj.photographs || [],
    issues: proj.issues || [],
    field_updates: proj.fieldUpdates || [],
    documents: proj.documents || [],
    health_score: proj.healthScore || { overall: 80, schedule: 80, budget: 80, quality: 80, risk: 80, contractor: 80, statusText: 'Low Risk' },
    ai_prediction: proj.aiPrediction || { delayProbability: 10, riskLevel: 'Low', predictedDelayDays: 0, explanation: '', riskFactors: [], recommendations: [] },
    delay_probability: proj.aiPrediction?.delayProbability || 0,
    predicted_delay_days: proj.aiPrediction?.predictedDelayDays || 0,
    data_json: { ...proj, id: uuid, projectId: projCode },
    updated_at: new Date().toISOString()
  };
}

/**
 * Maps PostgreSQL snake_case project row back to Project interface
 */
export function mapDbToProject(row: any): Project {
  const json = (row.data_json && typeof row.data_json === 'object') ? row.data_json : {};
  // The primary identifier in PostgreSQL is the UUID row.id
  const uuid = row.id;
  const projCode = row.project_id || json.projectId || json.id || row.id;

  return {
    id: uuid,
    projectId: projCode,
    name: row.name || json.name || 'Untitled Infrastructure Project',
    department: row.department || json.department || 'Municipal Administration (GHMC)',
    projectType: row.project_type || row.projectType || json.projectType || 'Roads',
    description: row.description || json.description || '',
    location: row.location || json.location || '',
    district: row.district || json.district || 'Hyderabad',
    latitude: Number(row.latitude ?? json.latitude ?? 17.4000),
    longitude: Number(row.longitude ?? json.longitude ?? 78.4500),
    managerName: row.manager_name || row.managerName || json.managerName || '',
    projectManagerId: row.project_manager_id || row.projectManagerId || json.projectManagerId || null,
    fieldOfficerId: row.field_officer_id || row.fieldOfficerId || json.fieldOfficerId || null,
    contractorName: row.contractor_name || row.contractorName || json.contractorName || '',
    contractorId: row.contractor_id || row.contractorId || json.contractorId || 'CON-001',
    startDate: row.start_date || row.startDate || json.startDate || '',
    expectedCompletionDate: row.expected_completion_date || row.expectedCompletionDate || json.expectedCompletionDate || '',
    revisedCompletionDate: row.revised_completion_date || row.revisedCompletionDate || json.revisedCompletionDate,
    totalBudgetCr: Number(row.total_budget_cr ?? row.totalBudgetCr ?? json.totalBudgetCr ?? 0),
    allocatedBudgetCr: Number(row.allocated_budget_cr ?? row.allocatedBudgetCr ?? json.allocatedBudgetCr ?? 0),
    spentBudgetCr: Number(row.spent_budget_cr ?? row.spentBudgetCr ?? json.spentBudgetCr ?? 0),
    expectedProgressPercentage: Number(row.expected_progress_percentage ?? row.expectedProgressPercentage ?? json.expectedProgressPercentage ?? 0),
    actualProgressPercentage: Number(row.actual_progress_percentage ?? row.actualProgressPercentage ?? json.actualProgressPercentage ?? 0),
    status: row.status || json.status || 'On Track',
    riskLevel: row.risk_level || row.riskLevel || json.riskLevel || 'Low',
    priority: row.priority || json.priority || 'Medium',
    objectives: row.objectives || json.objectives || [],
    milestones: row.milestones || json.milestones || [],
    photographs: row.photographs || json.photographs || [],
    issues: row.issues || json.issues || [],
    fieldUpdates: row.field_updates || row.fieldUpdates || json.fieldUpdates || [],
    fieldInspections: json.fieldInspections || [],
    latestInspectionId: json.latestInspectionId,
    latestInspectionDate: json.latestInspectionDate,
    fieldInspectionCount: json.fieldInspectionCount,
    latestFieldRemarks: json.latestFieldRemarks,
    lastFieldOfficerUpdate: json.lastFieldOfficerUpdate,
    documents: row.documents || json.documents || [],
    healthScore: row.health_score || row.healthScore || json.healthScore || { overall: 80, schedule: 80, budget: 80, quality: 80, risk: 80, contractor: 80, statusText: 'Low Risk' },
    aiPrediction: row.ai_prediction || row.aiPrediction || json.aiPrediction || {
      delayProbability: Number(row.delay_probability ?? 10),
      riskLevel: row.risk_level || 'Low',
      predictedDelayDays: Number(row.predicted_delay_days ?? 0),
      expectedCompletionDate: row.expected_completion_date || json.expectedCompletionDate || '',
      revisedCompletionDate: row.expected_completion_date || json.expectedCompletionDate || '',
      explanation: 'On schedule baseline.',
      riskFactors: [],
      recommendations: []
    },
    lastUpdated: row.updated_at || row.last_updated || row.lastUpdated || json.lastUpdated || new Date().toLocaleString('en-IN')
  };
}

/**
 * Maps FieldInspection TypeScript object to PostgreSQL snake_case columns
 */
export function mapInspectionToDb(insp: FieldInspection) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insp.id);
  const uuid = isUuid ? insp.id.toLowerCase() : toValidUuid(insp.id);

  const isProjectUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insp.projectId);
  const projectUuid = isProjectUuid ? insp.projectId.toLowerCase() : toValidUuid(insp.projectId);

  const officerUuid = (insp.officerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insp.officerId))
    ? insp.officerId.toLowerCase()
    : (insp.fieldOfficerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insp.fieldOfficerId))
        ? insp.fieldOfficerId.toLowerCase()
        : null;

  const pmUuid = (insp.projectManagerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insp.projectManagerId))
    ? insp.projectManagerId.toLowerCase()
    : null;

  const inspectionDate = insp.inspectionDate
    ? (insp.inspectionDate.includes('T') ? insp.inspectionDate.split('T')[0] : insp.inspectionDate)
    : new Date().toISOString().split('T')[0];

  return {
    id: uuid,
    inspection_id: insp.inspectionId || insp.id,
    project_id: projectUuid,
    officer_id: officerUuid,
    project_manager_id: pmUuid,
    inspection_date: inspectionDate,
    reported_progress: Number(insp.progress ?? insp.aiVisualProgress ?? 0),
    progress: Number(insp.progress ?? insp.aiVisualProgress ?? 0),
    severity: insp.severity || 'Medium',
    ai_visual_progress: Number(insp.aiVisualProgress ?? insp.progress ?? 0),
    ai_delay_probability: Number(insp.aiDelayProbability ?? 0),
    ai_risk_level: insp.aiRiskLevel || 'Low',
    predicted_delay_days: Number(insp.predictedDelayDays ?? 0),
    ai_explanation: insp.aiExplanation || '',
    ai_generated_remarks: insp.aiGeneratedRemarks || '',
    remarks: insp.remarks || '',
    status: insp.status || 'SUBMITTED',
    current_image_url: insp.currentImageUrl || insp.afterImageReference || '',
    manager_remark: insp.managerRemark || null,
    manager_viewed: Boolean(insp.managerViewed),
    manager_viewed_at: insp.managerViewedAt || null,
    manager_remark_saved_at: insp.managerRemarkSavedAt || null,
    construction_activity: insp.constructionActivity || null,
    visible_work: insp.visibleWork || null,
    workers_equipment: insp.workersEquipment || null,
    materials: insp.materials || null,
    site_condition: insp.siteCondition || null,
    safety_concerns: insp.safetyConcerns || null,
    quality_concerns: insp.qualityConcerns || null,
    visual_confidence: insp.visualConfidence || 'HIGH',
    timestamp: insp.timestamp || new Date().toLocaleString('en-IN'),
    data_json: { ...insp, id: uuid, projectId: projectUuid },
    updated_at: new Date().toISOString()
  };
}

/**
 * Maps PostgreSQL inspection row back to FieldInspection interface
 */
export function mapDbToInspection(row: any): FieldInspection {
  const json = (row.data_json && typeof row.data_json === 'object') ? row.data_json : {};
  const isCleared = row.status === 'CLEARED' || json.status === 'CLEARED' || json.cleared === true;
  const statusVal = isCleared ? 'CLEARED' : (row.status || json.status || 'SUBMITTED');
  const validStatus: FieldInspection['status'] = 
    ['SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED', 'CLEARED'].includes(statusVal) ? statusVal : 'SUBMITTED';

  return {
    id: row.id,
    inspectionId: row.inspection_id || row.id,
    projectId: row.project_id || json.projectId || '',
    projectName: json.projectName || row.project_name || '',
    projectLocation: json.projectLocation || row.project_location || '',
    officerId: row.officer_id || json.officerId || '',
    officerName: json.officerName || row.officer_name || 'Field Officer',
    fieldOfficerId: row.officer_id || json.fieldOfficerId || '',
    fieldOfficerName: json.fieldOfficerName || json.officerName || row.officer_name || 'Field Officer',
    projectManagerId: row.project_manager_id || json.projectManagerId || '',
    inspectionDate: row.inspection_date || json.inspectionDate || (row.created_at ? row.created_at.split('T')[0] : ''),
    timestamp: row.timestamp || json.timestamp || (row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : ''),
    progress: Number(row.progress ?? row.reported_progress ?? json.progress ?? 0),
    remarks: row.remarks || json.remarks || '',
    aiGeneratedRemarks: row.ai_generated_remarks || json.aiGeneratedRemarks || row.remarks || json.remarks || '',
    officerRemarks: row.remarks || json.officerRemarks || '',
    officerSubmittedRemarks: row.remarks || json.officerSubmittedRemarks || '',
    managerRemark: row.manager_remark || json.managerRemark || '',
    managerRemarkSavedAt: row.manager_remark_saved_at || json.managerRemarkSavedAt || '',
    severity: row.severity || json.severity || 'Medium',
    aiVisualProgress: Number(row.ai_visual_progress ?? json.aiVisualProgress ?? row.progress ?? row.reported_progress ?? 0),
    aiDelayProbability: Number(row.ai_delay_probability ?? json.aiDelayProbability ?? 0),
    aiRiskLevel: row.ai_risk_level || json.aiRiskLevel || 'Low',
    predictedDelayDays: Number(row.predicted_delay_days ?? json.predictedDelayDays ?? 0),
    aiExplanation: row.ai_explanation || json.aiExplanation || '',
    constructionActivity: row.construction_activity || json.constructionActivity || '',
    visibleWork: row.visible_work || json.visibleWork || '',
    workersEquipment: row.workers_equipment || json.workersEquipment || '',
    materials: row.materials || json.materials || '',
    siteCondition: row.site_condition || json.siteCondition || '',
    safetyConcerns: row.safety_concerns || json.safetyConcerns || '',
    qualityConcerns: row.quality_concerns || json.qualityConcerns || '',
    safetyQualityConcerns: row.safety_concerns || json.safetyQualityConcerns || '',
    visualConfidence: row.visual_confidence || json.visualConfidence || 'HIGH',
    visualAnalysisConfidence: row.visual_confidence || json.visualAnalysisConfidence || 'HIGH',
    aiRecommendations: json.aiRecommendations || (row.ai_recommendations ? (Array.isArray(row.ai_recommendations) ? row.ai_recommendations : [row.ai_recommendations]) : []),
    beforeImageReference: json.beforeImageReference || row.before_image_reference || '',
    afterImageReference: row.current_image_url || json.afterImageReference || '',
    currentImageReference: row.current_image_url || json.currentImageReference || '',
    currentImageUrl: row.current_image_url || json.currentImageUrl || '',
    status: validStatus,
    clearedAt: row.cleared_at || json.clearedAt || null,
    managerViewed: Boolean(row.manager_viewed ?? json.managerViewed),
    managerViewedAt: row.manager_viewed_at || json.managerViewedAt,
    isDemoPrediction: json.isDemoPrediction !== undefined ? json.isDemoPrediction : false
  };
}

/**
 * Seed Supabase database with initial mock dataset safely without overwriting
 */
export async function seedSupabaseIfEmpty(): Promise<boolean> {
  try {
    const { data: projData, error: projErr } = await supabase.from(TABLES.PROJECTS).select('id').limit(1);
    if (!projErr && (!projData || projData.length === 0)) {
      console.log('Seeding initial project records to Supabase...');
      for (const proj of MOCK_PROJECTS) {
        await supabase.from(TABLES.PROJECTS).upsert(mapProjectToDb(proj), { onConflict: 'id' });
      }
    }

    const { data: conData, error: conErr } = await supabase.from(TABLES.CONTRACTORS).select('id').limit(1);
    if (!conErr && (!conData || conData.length === 0)) {
      console.log('Seeding initial contractors to Supabase...');
      for (const con of MOCK_CONTRACTORS) {
        await supabase.from(TABLES.CONTRACTORS).upsert({ ...con, data_json: con }, { onConflict: 'id' });
      }
    }

    const { data: alertData, error: alertErr } = await supabase.from(TABLES.ALERTS).select('id').limit(1);
    if (!alertErr && (!alertData || alertData.length === 0)) {
      console.log('Seeding initial alerts to Supabase...');
      for (const alert of MOCK_ALERTS) {
        await supabase.from(TABLES.ALERTS).upsert(mapAlertToDb(alert), { onConflict: 'id' });
      }
    }

    const { data: logData, error: logErr } = await supabase.from(TABLES.AUDIT_LOGS).select('id').limit(1);
    if (!logErr && (!logData || logData.length === 0)) {
      console.log('Seeding initial audit logs to Supabase...');
      for (const logItem of MOCK_AUDIT_LOGS) {
        await addAuditLogToSupabase(logItem);
      }
    }
    return true;
  } catch (error) {
    console.warn('Supabase seeding notice:', error);
    return false;
  }
}

/**
 * Fetch all projects from Supabase PostgreSQL database
 */
export async function fetchProjectsFromSupabase(): Promise<{ data: Project[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from(TABLES.PROJECTS).select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase fetchProjectsFromSupabase error:', error.message);
      return { data: [], error: error.message };
    }

    // Also fetch real milestones from public.milestones
    let dbMilestones: any[] = [];
    try {
      const { data: mData } = await supabase.from(TABLES.MILESTONES).select('*');
      if (mData) dbMilestones = mData;
    } catch (mErr) {
      console.warn('Notice loading milestones:', mErr);
    }

    const mappedProjects = (data || []).map(row => {
      const proj = mapDbToProject(row);
      if (dbMilestones && dbMilestones.length > 0) {
        const related = dbMilestones.filter(m => m.project_id === row.id || m.project_id === row.project_id);
        if (related.length > 0) {
          proj.milestones = related.map((rm: any) => ({
            id: rm.id,
            name: rm.name,
            category: rm.category || 'Construction',
            targetDate: rm.target_date || rm.planned_end_date || '',
            actualDate: rm.actual_date || rm.actual_end_date || undefined,
            status: rm.status || 'In Progress',
            weightPercentage: Number(rm.weight_percentage || 25)
          }));
        }
      }
      return proj;
    });

    return { data: mappedProjects, error: null };
  } catch (err: any) {
    console.error('Exception in fetchProjectsFromSupabase:', err);
    return { data: [], error: err?.message || 'Failed to fetch projects from Supabase' };
  }
}

/**
 * Fetch a single project by ID from Supabase
 */
export async function fetchProjectByIdSupabase(id: string): Promise<{ data: Project | null; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from(TABLES.PROJECTS).select('*');
    if (isUuid) {
      query = query.or(`project_id.eq.${id},id.eq.${id}`);
    } else {
      query = query.eq('project_id', id);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data ? mapDbToProject(data) : null, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to fetch project' };
  }
}

/**
 * Create New Project with Real Supabase INSERT and returned ID verification.
 * Follows: Validate -> INSERT -> select().single() -> return full Project
 */
export async function createProjectInSupabase(projectPayload: any): Promise<{ success: boolean; data?: Project; error: string | null }> {
  try {
    if (!projectPayload.name || !projectPayload.name.trim()) {
      return { success: false, error: 'Project name is required.' };
    }
    if (!projectPayload.department) {
      return { success: false, error: 'Project department is required.' };
    }
    if (!projectPayload.location || !projectPayload.location.trim()) {
      return { success: false, error: 'Project location is required.' };
    }

    // Generate valid UUID if not supplied
    const uuid = projectPayload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectPayload.id)
      ? projectPayload.id.toLowerCase()
      : (crypto.randomUUID ? crypto.randomUUID() : toValidUuid(`PRJ-${Date.now()}`));

    const payload = {
      id: uuid,
      project_id: projectPayload.project_id || projectPayload.projectId || `PRJ-${String(projectPayload.department || 'GOV').slice(0, 3).toUpperCase()}-2026-${Date.now().toString().slice(-3)}`,
      name: projectPayload.name.trim(),
      department: projectPayload.department,
      project_type: projectPayload.project_type || projectPayload.projectType || 'Roads',
      description: projectPayload.description || '',
      location: projectPayload.location.trim(),
      district: projectPayload.district || 'Hyderabad',
      latitude: Number(projectPayload.latitude ?? 17.4000),
      longitude: Number(projectPayload.longitude ?? 78.4500),
      manager_name: projectPayload.manager_name || projectPayload.managerName || '',
      project_manager_id: toSafeUuidOrNull(projectPayload.project_manager_id || projectPayload.projectManagerId, null),
      field_officer_id: toSafeUuidOrNull(projectPayload.field_officer_id || projectPayload.fieldOfficerId, null),
      contractor_id: projectPayload.contractor_id || projectPayload.contractorId || 'CON-001',
      contractor_name: projectPayload.contractor_name || projectPayload.contractorName || '',
      start_date: projectPayload.start_date || projectPayload.startDate || new Date().toISOString().split('T')[0],
      expected_completion_date: projectPayload.expected_completion_date || projectPayload.expectedCompletionDate || '2026-12-31',
      revised_completion_date: projectPayload.revised_completion_date || projectPayload.revisedCompletionDate || null,
      total_budget_cr: Number(projectPayload.total_budget_cr ?? projectPayload.totalBudgetCr ?? 15),
      allocated_budget_cr: Number(projectPayload.allocated_budget_cr ?? projectPayload.allocatedBudgetCr ?? projectPayload.total_budget_cr ?? 15),
      spent_budget_cr: Number(projectPayload.spent_budget_cr ?? projectPayload.spentBudgetCr ?? 0),
      actual_progress_percentage: Number(projectPayload.actual_progress_percentage ?? projectPayload.actualProgressPercentage ?? 0),
      expected_progress_percentage: Number(projectPayload.expected_progress_percentage ?? projectPayload.expectedProgressPercentage ?? 0),
      status: projectPayload.status || 'On Track',
      risk_level: projectPayload.risk_level || projectPayload.riskLevel || 'Low',
      priority: projectPayload.priority || 'Medium',
      delay_probability: Number(projectPayload.delay_probability ?? projectPayload.delayProbability ?? 0),
      predicted_delay_days: Number(projectPayload.predicted_delay_days ?? projectPayload.predictedDelayDays ?? 0),
      objectives: projectPayload.objectives || [],
      milestones: projectPayload.milestones || [],
      photographs: projectPayload.photographs || [],
      issues: projectPayload.issues || [],
      field_updates: projectPayload.field_updates || projectPayload.fieldUpdates || [],
      documents: projectPayload.documents || [],
      health_score: projectPayload.health_score || projectPayload.healthScore || { overall: 80, schedule: 80, budget: 80, quality: 80, risk: 80, contractor: 80, statusText: 'Low Risk' },
      ai_prediction: projectPayload.ai_prediction || projectPayload.aiPrediction || {
        delayProbability: Number(projectPayload.delay_probability ?? 10),
        riskLevel: projectPayload.risk_level || 'Low',
        predictedDelayDays: 0,
        explanation: 'Baseline registered in Supabase.',
        riskFactors: [],
        recommendations: []
      },
      data_json: projectPayload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .insert(payload)
      .select()
      .single();

    if (error) {
      formatSupabaseError('Create Project', TABLES.PROJECTS, error);
      return { 
        success: false, 
        error: `Supabase INSERT failed: [${error.code}] ${error.message}${error.hint ? ` (${error.hint})` : ''}` 
      };
    }

    const createdProject = mapDbToProject(data);
    return { success: true, data: createdProject, error: null };
  } catch (err: any) {
    console.error('PROJECT CREATE EXCEPTION:', err);
    return { success: false, error: err?.message || 'Database connection error during project creation' };
  }
}

/**
 * Create or Upsert project in Supabase PostgreSQL
 */
export async function saveProjectToSupabase(project: Project): Promise<{ success: boolean; error: string | null; project?: Project }> {
  try {
    // Validate required fields before INSERT
    if (!project.name || !project.name.trim()) {
      return { success: false, error: 'Project name is required.' };
    }
    if (!project.department) {
      return { success: false, error: 'Project department is required.' };
    }
    if (!project.location || !project.location.trim()) {
      return { success: false, error: 'Project location is required.' };
    }

    const payload = mapProjectToDb(project);
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      formatSupabaseError('Save Project', TABLES.PROJECTS, error);
      return { 
        success: false, 
        error: `Supabase upsert failed: [${error.code}] ${error.message}${error.hint ? ` (${error.hint})` : ''}` 
      };
    }
    const saved = data ? mapDbToProject(data) : { ...project, id: payload.id, projectId: payload.project_id };
    return { success: true, error: null, project: saved };
  } catch (err: any) {
    console.error('Error saving project to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save project' };
  }
}

/**
 * Rename Project in Supabase (Administrator Only)
 */
export async function renameProjectInSupabase(
  projectId: string,
  newName: string
): Promise<{ success: boolean; error: string | null; project?: Project }> {
  try {
    if (!newName || !newName.trim()) {
      return { success: false, error: 'Project name cannot be empty.' };
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const targetUuid = isUuid ? projectId.toLowerCase() : toValidUuid(projectId);

    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .update({ name: newName.trim(), updated_at: new Date().toISOString() })
      .eq('id', targetUuid)
      .select()
      .single();

    if (error) {
      console.error('Supabase renameProjectInSupabase error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null, project: data ? mapDbToProject(data) : undefined };
  } catch (err: any) {
    console.error('Exception renaming project in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to rename project' };
  }
}

/**
 * Update project partially in Supabase
 */
export async function updateProjectInSupabase(
  projectId: string,
  updates: Partial<Project>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updatePayload: Record<string, any> = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.department !== undefined) updatePayload.department = updates.department;
    if (updates.projectType !== undefined) updatePayload.project_type = updates.projectType;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.location !== undefined) updatePayload.location = updates.location;
    if (updates.district !== undefined) updatePayload.district = updates.district;
    if (updates.latitude !== undefined) updatePayload.latitude = updates.latitude;
    if (updates.longitude !== undefined) updatePayload.longitude = updates.longitude;
    if (updates.managerName !== undefined) updatePayload.manager_name = updates.managerName;
    if (updates.projectManagerId !== undefined) updatePayload.project_manager_id = updates.projectManagerId;
    if (updates.fieldOfficerId !== undefined) updatePayload.field_officer_id = updates.fieldOfficerId;
    if (updates.contractorName !== undefined) updatePayload.contractor_name = updates.contractorName;
    if (updates.contractorId !== undefined) updatePayload.contractor_id = updates.contractorId;
    if (updates.startDate !== undefined) updatePayload.start_date = updates.startDate;
    if (updates.expectedCompletionDate !== undefined) updatePayload.expected_completion_date = updates.expectedCompletionDate;
    if (updates.revisedCompletionDate !== undefined) updatePayload.revised_completion_date = updates.revisedCompletionDate;
    if (updates.totalBudgetCr !== undefined) updatePayload.total_budget_cr = updates.totalBudgetCr;
    if (updates.allocatedBudgetCr !== undefined) updatePayload.allocated_budget_cr = updates.allocatedBudgetCr;
    if (updates.spentBudgetCr !== undefined) updatePayload.spent_budget_cr = updates.spentBudgetCr;
    if (updates.expectedProgressPercentage !== undefined) updatePayload.expected_progress_percentage = updates.expectedProgressPercentage;
    if (updates.actualProgressPercentage !== undefined) updatePayload.actual_progress_percentage = updates.actualProgressPercentage;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.riskLevel !== undefined) updatePayload.risk_level = updates.riskLevel;
    if (updates.priority !== undefined) updatePayload.priority = updates.priority;
    if (updates.objectives !== undefined) updatePayload.objectives = updates.objectives;
    if (updates.milestones !== undefined) updatePayload.milestones = updates.milestones;
    if (updates.photographs !== undefined) updatePayload.photographs = updates.photographs;
    if (updates.issues !== undefined) updatePayload.issues = updates.issues;
    if (updates.fieldUpdates !== undefined) updatePayload.field_updates = updates.fieldUpdates;
    if (updates.documents !== undefined) updatePayload.documents = updates.documents;
    if (updates.healthScore !== undefined) updatePayload.health_score = updates.healthScore;
    if (updates.aiPrediction !== undefined) {
      updatePayload.ai_prediction = updates.aiPrediction;
      if (updates.aiPrediction.delayProbability !== undefined) {
        updatePayload.delay_probability = updates.aiPrediction.delayProbability;
      }
      if (updates.aiPrediction.predictedDelayDays !== undefined) {
        updatePayload.predicted_delay_days = updates.aiPrediction.predictedDelayDays;
      }
    }
    updatePayload.updated_at = new Date().toISOString();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const targetUuid = isUuid ? projectId : toValidUuid(projectId);
    const { error } = await supabase.from(TABLES.PROJECTS).update(updatePayload).eq('id', targetUuid);

    if (error) {
      console.error('Supabase updateProjectInSupabase error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception updating project in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to update project' };
  }
}

/**
 * Delete project from Supabase with safe foreign key handling
 */
export async function deleteProjectFromSupabase(projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const targetUuid = isUuid ? projectId : toValidUuid(projectId);

    // Safely delete referencing rows from child tables first to prevent foreign key constraint violations
    try {
      await supabase.from('inspections').delete().eq('project_id', targetUuid);
      await supabase.from('milestones').delete().eq('project_id', targetUuid);
      await supabase.from('alerts').delete().eq('project_id', targetUuid);
      await supabase.from('notifications').delete().eq('project_id', targetUuid);
      await supabase.from('documents').delete().eq('project_id', targetUuid);
      await supabase.from('field_updates').delete().eq('project_id', targetUuid);
      await supabase.from('ai_predictions').delete().eq('project_id', targetUuid);
    } catch (fkCleanupErr) {
      console.warn('Notice cleaning child records before project deletion:', fkCleanupErr);
    }

    const { error } = await supabase.from(TABLES.PROJECTS).delete().eq('id', targetUuid);
    if (error) {
      console.error('Supabase deleteProjectFromSupabase error:', error.message);
      return { success: false, error: `Database error deleting project: ${error.message}` };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception deleting project from Supabase:', err);
    return { success: false, error: err?.message || 'Failed to delete project' };
  }
}

/**
 * Real-Time Subscriptions for Projects
 */
export function subscribeProjects(onData: (projects: Project[]) => void) {
  fetchProjectsFromSupabase().then(({ data }) => {
    if (data && data.length > 0) {
      onData(data);
    }
  });

  const channel = supabase
    .channel('public:projects')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.PROJECTS }, async () => {
      const { data } = await fetchProjectsFromSupabase();
      if (data && data.length > 0) {
        onData(data);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeContractors(onData: (contractors: Contractor[]) => void) {
  fetchContractorsFromSupabase().then(({ data }) => {
    if (data && data.length > 0) {
      onData(data);
    }
  });

  const channel = supabase
    .channel('public:contractors')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.CONTRACTORS }, () => {
      fetchContractorsFromSupabase().then(({ data }) => {
        if (data && data.length > 0) {
          onData(data);
        }
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeAlerts(onData: (alerts: AlertNotification[]) => void) {
  supabase.from(TABLES.ALERTS).select('*').then(({ data, error }) => {
    if (!error && data && data.length > 0) {
      onData(data.map(r => r.data_json || r));
    }
  });

  const channel = supabase
    .channel('public:alerts')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.ALERTS }, () => {
      supabase.from(TABLES.ALERTS).select('*').then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          onData(data.map(r => r.data_json || r));
        }
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeAuditLogs(onData: (logs: AuditLog[]) => void) {
  supabase.from(TABLES.AUDIT_LOGS).select('*').then(({ data, error }) => {
    if (!error && data && data.length > 0) {
      onData(data.map(r => r.data_json || r));
    }
  });

  const channel = supabase
    .channel('public:audit_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.AUDIT_LOGS }, () => {
      supabase.from(TABLES.AUDIT_LOGS).select('*').then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          onData(data.map(r => r.data_json || r));
        }
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeInspections(onData: (inspections: FieldInspection[]) => void) {
  fetchInspectionsFromSupabase().then(({ data }) => {
    if (data && data.length > 0) {
      onData(data);
    }
  });

  const channel = supabase
    .channel('public:inspections')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.INSPECTIONS }, () => {
      fetchInspectionsFromSupabase().then(({ data }) => {
        if (data && data.length > 0) {
          onData(data);
        }
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch Inspections from Supabase
 */
export async function fetchInspectionsFromSupabase(): Promise<{ data: FieldInspection[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLES.INSPECTIONS)
      .select('*')
      .or('data_json->>cleared.is.null,data_json->>cleared.neq.true')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase fetchInspectionsFromSupabase error:', error.message);
      return { data: [], error: error.message };
    }
    const realData = (data || []).filter(row => {
      if (row.status === 'CLEARED' || row.data_json?.cleared === true || row.data_json?.status === 'CLEARED') return false;
      if (row.remarks === 'Field inspection completed.' && !row.current_image_url) return false;
      return true;
    });
    return { data: realData.map(mapDbToInspection), error: null };
  } catch (err: any) {
    console.error('Exception in fetchInspectionsFromSupabase:', err);
    return { data: [], error: err?.message || 'Failed to fetch inspections' };
  }
}

/**
 * Clear a reviewed inspection from active inspection view in Supabase (status = 'CLEARED' via data_json soft-delete)
 * Preserves the underlying record and storage photo for audit history.
 */
export async function clearInspectionInSupabase(inspectionId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId);
    const idToUse = isUuid ? inspectionId : toValidUuid(inspectionId);

    const { data: existing } = await supabase
      .from(TABLES.INSPECTIONS)
      .select('id, data_json')
      .eq('id', idToUse)
      .single();

    const existingJson = (existing?.data_json && typeof existing.data_json === 'object') ? existing.data_json : {};
    const updatedJson = {
      ...existingJson,
      cleared: true,
      cleared_at: new Date().toISOString(),
      status: 'CLEARED'
    };

    const { error } = await supabase.from(TABLES.INSPECTIONS).update({
      data_json: updatedJson,
      updated_at: new Date().toISOString()
    }).eq('id', idToUse);

    if (error) {
      console.error('Error clearing inspection in Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception clearing inspection in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to clear inspection' };
  }
}

/**
 * Save / Insert Inspection to Supabase
 */
export async function saveInspectionToSupabase(inspection: FieldInspection): Promise<{ success: boolean; error: string | null }> {
  try {
    const payload = mapInspectionToDb(inspection);
    const { error } = await supabase.from(TABLES.INSPECTIONS).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error saving inspection to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception saving inspection to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save inspection' };
  }
}

/**
 * Update inspection review / approval status in Supabase
 */
export async function updateInspectionStatusInSupabase(
  inspectionId: string,
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED',
  managerRemark?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const updatePayload: Record<string, any> = {
      status,
      manager_viewed: true,
      manager_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (status === 'APPROVED') {
      updatePayload.is_approved = true;
    } else if (status === 'REJECTED') {
      updatePayload.is_approved = false;
    }
    if (managerRemark !== undefined) {
      updatePayload.manager_remark = managerRemark;
      updatePayload.manager_remark_saved_at = new Date().toLocaleString('en-IN');
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId);
    let query;
    if (isUuid) {
      query = supabase.from(TABLES.INSPECTIONS).update(updatePayload).eq('id', inspectionId);
    } else {
      query = supabase.from(TABLES.INSPECTIONS).update(updatePayload).eq('id', toValidUuid(inspectionId));
    }
    const { error } = await query;
    if (error) {
      console.error('Error updating inspection status in Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception updating inspection status in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to update inspection status' };
  }
}

/**
 * Mark inspection viewed by manager
 */
export async function markInspectionViewedInSupabase(inspectionId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId);
    const idToUse = isUuid ? inspectionId : toValidUuid(inspectionId);
    const { error } = await supabase.from(TABLES.INSPECTIONS).update({
      manager_viewed: true,
      manager_viewed_at: new Date().toISOString()
    }).eq('id', idToUse);
    if (error) {
      console.error('Error marking inspection viewed in Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception marking inspection viewed in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to mark inspection viewed' };
  }
}

/**
 * Save Project Manager remark to Supabase inspection record
 */
export async function saveManagerRemarkToSupabase(inspectionId: string, managerRemark: string): Promise<{ success: boolean; error: string | null }> {
  return updateInspectionStatusInSupabase(inspectionId, 'REVIEWED', managerRemark);
}

/**
 * Fetch contractors from Supabase
 */
export async function fetchContractorsFromSupabase(): Promise<{ data: Contractor[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from(TABLES.CONTRACTORS).select('*');
    if (error) {
      return { data: [], error: error.message };
    }
    const contractors = (data || []).map(r => ({
      id: r.id,
      name: r.name || r.id,
      code: r.code || r.id,
      contactPerson: r.contact_person || r.name || 'Site Lead',
      email: r.email || `contact@${r.id.toLowerCase()}.com`,
      phone: r.phone || '+91 98000 00000',
      rating: Number(r.rating || 85),
      totalProjectsAssigned: Number(r.total_projects_assigned || 3),
      completedProjects: Number(r.completed_projects || 2),
      delayedProjectsCount: Number(r.delayed_projects_count || 0),
      scheduleScore: Number(r.schedule_score || 85),
      qualityScore: Number(r.quality_score || 90),
      budgetScore: Number(r.budget_score || 88),
      reliabilityScore: Number(r.reliability_score || 85),
      overallScore: Number(r.overall_score || 87),
      ...(r.data_json || {})
    }));
    return { data: contractors, error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch contractors' };
  }
}

export interface SiteWorkerRecord {
  id: string;
  name: string;
  trade: string;
  shift: 'Morning Shift (07:00 - 15:30)' | 'Evening Shift (15:30 - 23:00)' | 'Night Shift (23:00 - 07:00)';
  status: 'On Site' | 'On Break' | 'Demobilized';
  safetyCertified: boolean;
  contactNumber: string;
}

/**
 * Fetch contractor workforce from Supabase contractors table (data_json.workers)
 */
export async function fetchContractorWorkforce(contractorId: string = 'CON-001'): Promise<{ data: SiteWorkerRecord[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from(TABLES.CONTRACTORS)
      .select('id, data_json')
      .eq('id', contractorId)
      .maybeSingle();

    if (error) {
      formatSupabaseError('Fetch Contractor Workforce', TABLES.CONTRACTORS, error);
      return { data: [], error: error.message };
    }

    if (data?.data_json?.workers && Array.isArray(data.data_json.workers) && data.data_json.workers.length > 0) {
      return { data: data.data_json.workers, error: null };
    }

    // Default site labor manifest if not yet registered in Supabase
    const defaultWorkers: SiteWorkerRecord[] = [
      { id: 'W-01', name: 'Ramesh Patel', trade: 'Master Mason / Structural Lead', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98234 11029' },
      { id: 'W-02', name: 'Sunil Verma', trade: 'Certified Steel & Rebar Welder', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98450 88231' },
      { id: 'W-03', name: 'Abdul Sheikh', trade: 'Heavy Tower Crane Operator', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 97120 44910' },
      { id: 'W-04', name: 'Dinesh Kumar', trade: 'Concrete Pump Specialist', shift: 'Evening Shift (15:30 - 23:00)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98901 22340' },
      { id: 'W-05', name: 'Sohan Lal', trade: 'Site Electrician & Heavy Wiring', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 99112 55670' },
      { id: 'W-06', name: 'Kavita Singh', trade: 'Site Quality & Safety Marshal', shift: 'Morning Shift (07:00 - 15:30)', status: 'On Site', safetyCertified: true, contactNumber: '+91 98776 33412' }
    ];

    // Seed baseline to Supabase so it persists
    await updateContractorWorkforce(contractorId, defaultWorkers);
    return { data: defaultWorkers, error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch contractor workforce' };
  }
}

/**
 * Persist contractor workforce update to Supabase PostgreSQL contractors table
 */
export async function updateContractorWorkforce(
  contractorId: string = 'CON-001', 
  workers: SiteWorkerRecord[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: current } = await supabase
      .from(TABLES.CONTRACTORS)
      .select('data_json')
      .eq('id', contractorId)
      .maybeSingle();

    const existingJson = (current?.data_json && typeof current.data_json === 'object') ? current.data_json : {};
    const updatedJson = { ...existingJson, workers };

    const { error } = await supabase
      .from(TABLES.CONTRACTORS)
      .update({ 
        data_json: updatedJson, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', contractorId);

    if (error) {
      formatSupabaseError('Update Contractor Workforce', TABLES.CONTRACTORS, error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update contractor workforce in Supabase' };
  }
}

/**
 * Fetch profiles from Supabase filtered optionally by role
 */
export async function fetchProfilesFromSupabase(role?: string): Promise<{ data: any[]; error: string | null }> {
  try {
    let query = supabase.from(TABLES.PROFILES).select('*');
    if (role) {
      query = query.eq('role', role);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch profiles' };
  }
}

/**
 * Alert Mappings and Database Synchronization
 */
export function mapAlertToDb(alert: AlertNotification) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.id);
  const uuid = isUuid ? alert.id.toLowerCase() : (crypto.randomUUID ? crypto.randomUUID() : toValidUuid(alert.id));
  const isProjUuid = Boolean(alert.projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alert.projectId));
  const projUuid = (isProjUuid && alert.projectId) ? alert.projectId.toLowerCase() : (alert.projectId || null);

  return {
    id: uuid,
    project_id: projUuid,
    project_name: alert.projectName || 'Infrastructure Project',
    type: alert.severity || 'Warning',
    title: alert.title || 'System Alert',
    message: alert.message || 'Notification broadcast',
    severity: (alert.severity === 'Critical' || alert.severity === 'Warning' || alert.severity === 'Info') ? alert.severity : 'Warning',
    category: alert.category || 'AI Delay',
    alert_type: alert.category || 'AI Delay',
    is_read: Boolean(alert.isRead),
    data_json: {
      ...alert,
      targetRole: alert.targetRole || 'ALL'
    }
  };
}

export function mapDbToAlert(r: any): AlertNotification {
  const json = (r.data_json && typeof r.data_json === 'object') ? r.data_json : {};
  return {
    id: r.id,
    projectId: r.project_id || json.projectId,
    projectName: r.project_name || json.projectName,
    inspectionId: json.inspectionId,
    title: r.title,
    message: r.message,
    reason: json.reason,
    requiredAction: json.requiredAction,
    targetRole: json.targetRole,
    targetUserId: json.targetUserId,
    severity: (r.severity === 'Critical' || r.severity === 'Warning' || r.severity === 'Info') ? r.severity : (json.severity || 'Info'),
    timestamp: json.timestamp || new Date(r.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    isRead: Boolean(r.is_read ?? json.isRead),
    category: r.category || json.category || 'AI Delay'
  };
}

/**
 * Fetch all alerts from Supabase
 */
export async function fetchAlertsFromSupabase(): Promise<{ data: AlertNotification[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from(TABLES.ALERTS).select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('fetchAlertsFromSupabase notice:', error.message);
      return { data: [], error: error.message };
    }
    return { data: (data || []).map(mapDbToAlert), error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch alerts' };
  }
}

/**
 * Mutations for Alerts, Logs, Documents
 */
export async function addAlertToSupabase(alert: AlertNotification): Promise<{ success: boolean; error: string | null; notificationWarning?: string | null }> {
  try {
    const payload = mapAlertToDb(alert);
    const { error: alertError } = await supabase.from(TABLES.ALERTS).upsert(payload, { onConflict: 'id' });
    if (alertError) {
      formatSupabaseError('Add Alert', TABLES.ALERTS, alertError);
      return { 
        success: false, 
        error: `Supabase alerts INSERT failed: [${alertError.code}] ${alertError.message}${alertError.hint ? ` (${alertError.hint})` : ''}` 
      };
    }

    // Also persist corresponding notification record in public.notifications
    let notificationWarning: string | null = null;
    try {
      const notifUuid = crypto.randomUUID ? crypto.randomUUID() : toValidUuid(`NOTIF-${Date.now()}`);
      const { error: notifErr } = await supabase.from(TABLES.NOTIFICATIONS).insert({
        id: notifUuid,
        project_id: payload.project_id,
        title: alert.title,
        message: alert.message,
        target_role: alert.targetRole || 'ALL',
        user_id: alert.targetUserId || null,
        is_read: false
      });
      if (notifErr) {
        formatSupabaseError('Create Notification for Alert', TABLES.NOTIFICATIONS, notifErr);
        notificationWarning = `Alert saved, but notification dispatch failed: [${notifErr.code}] ${notifErr.message}`;
      }
    } catch (notifErr: any) {
      console.warn('Notice adding notification record for alert:', notifErr);
      notificationWarning = `Alert saved, but notification dispatch encountered an error: ${notifErr?.message}`;
    }

    return { success: true, error: null, notificationWarning };
  } catch (err: any) {
    console.error('Exception adding alert to Supabase:', err);
    return { success: false, error: err?.message || 'Database connection error while creating alert' };
  }
}

export async function markAlertReadInSupabase(alertId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alertId);
    const targetId = isUuid ? alertId : toValidUuid(alertId);
    const { error } = await supabase.from(TABLES.ALERTS).update({ is_read: true }).eq('id', targetId);
    if (error) {
      console.error('Error updating alert in Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception updating alert in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to update alert' };
  }
}

/**
 * Milestone and Expense persistence helpers
 */
export async function fetchMilestonesFromSupabase(projectId?: string): Promise<{ data: any[]; error: string | null }> {
  try {
    let query = supabase.from(TABLES.MILESTONES).select('*');
    if (projectId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
      query = isUuid ? query.eq('project_id', projectId) : query.or(`project_id.eq.${projectId},project_id.eq.${toValidUuid(projectId)}`);
    }
    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch milestones' };
  }
}

export async function saveMilestoneToSupabase(milestone: any, projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const mId = milestone.id || `MS-${Date.now()}`;
    const isProjUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const projUuid = isProjUuid ? projectId : toValidUuid(projectId);
    const payload = {
      id: mId,
      project_id: projUuid,
      name: milestone.name,
      category: milestone.category || 'Construction',
      target_date: milestone.targetDate || new Date().toISOString().split('T')[0],
      actual_date: milestone.actualDate || null,
      status: milestone.status || 'In Progress',
      weight_percentage: Number(milestone.weightPercentage || 25),
      progress: Number(milestone.progress ?? (milestone.status === 'Completed' ? 100 : 50)),
      is_overdue: Boolean(milestone.isOverdue || milestone.status === 'Overdue'),
      data_json: milestone
    };
    const { error } = await supabase.from(TABLES.MILESTONES).upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save milestone' };
  }
}

export async function fetchExpensesFromSupabase(projectId?: string): Promise<{ data: any[]; error: string | null }> {
  try {
    let query = supabase.from(TABLES.EXPENSES).select('*');
    if (projectId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
      query = isUuid ? query.eq('project_id', projectId) : query.or(`project_id.eq.${projectId},project_id.eq.${toValidUuid(projectId)}`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return { data: [], error: error.message };
    return { data: data || [], error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch expenses' };
  }
}

export async function saveExpenseToSupabase(expense: any, projectId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const expId = expense.id || `EXP-${Date.now()}`;
    const isProjUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    const projUuid = isProjUuid ? projectId : toValidUuid(projectId);
    const payload = {
      id: expId,
      project_id: projUuid,
      category: expense.category || 'Civil Work',
      amount: Number(expense.amount || 0),
      expense_date: expense.expenseDate || new Date().toISOString().split('T')[0],
      status: expense.status || 'APPROVED'
    };
    const { error } = await supabase.from(TABLES.EXPENSES).upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save expense' };
  }
}

export async function addAuditLogToSupabase(auditLog: AuditLog): Promise<{ success: boolean; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auditLog.id);
    const logUuid = isUuid ? auditLog.id : toValidUuid(auditLog.id);
    const isProjUuid = auditLog.projectId ? (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auditLog.projectId) ? auditLog.projectId : toValidUuid(auditLog.projectId)) : null;

    const payload = {
      id: logUuid,
      action: auditLog.action,
      user_email: auditLog.user,
      role: auditLog.role,
      project_id: isProjUuid,
      project_name: auditLog.projectName || null,
      timestamp: auditLog.timestamp,
      ip_address: auditLog.ipAddress,
      device: auditLog.device,
      details: auditLog.details,
      data_json: auditLog
    };
    const { error } = await supabase.from(TABLES.AUDIT_LOGS).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Notice adding audit log to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Exception adding audit log to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to add audit log' };
  }
}

export async function fetchAuditLogsFromSupabase(): Promise<{ data: AuditLog[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from(TABLES.AUDIT_LOGS).select('*').order('created_at', { ascending: false }).limit(50);
    if (error) {
      console.warn('Notice fetching audit logs from Supabase:', error.message);
      return { data: [], error: error.message };
    }
    const mapped: AuditLog[] = (data || []).map((row: any) => ({
      id: row.id,
      user: row.user_email || row.data_json?.user || 'System User',
      role: row.role || row.data_json?.role || 'Administrator',
      action: row.action || row.data_json?.action || 'Action',
      projectId: row.project_id || row.data_json?.projectId,
      projectName: row.project_name || row.data_json?.projectName,
      timestamp: row.timestamp || row.data_json?.timestamp || new Date(row.created_at || Date.now()).toLocaleString('en-IN'),
      ipAddress: row.ip_address || row.data_json?.ipAddress || '10.0.0.1',
      device: row.device || row.data_json?.device || 'CityTrack Web Portal',
      details: row.details || row.data_json?.details || ''
    }));
    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch audit logs' };
  }
}

export async function saveContractorToSupabase(contractor: Contractor): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from(TABLES.CONTRACTORS).upsert({ ...contractor, data_json: contractor }, { onConflict: 'id' });
    if (error) {
      console.error('Error saving contractor to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception saving contractor to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save contractor' };
  }
}

export async function saveFieldUpdateToSupabase(update: FieldUpdate): Promise<{ success: boolean; error: string | null }> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(update.id);
    const fldUuid = isUuid ? update.id.toLowerCase() : (crypto.randomUUID ? crypto.randomUUID() : toValidUuid(update.id));
    const isProjUuid = update.projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(update.projectId);
    const projUuid = isProjUuid ? update.projectId.toLowerCase() : (update.projectId ? toValidUuid(update.projectId) : null);

    const payload = {
      id: fldUuid,
      project_id: projUuid,
      project_name: update.projectName || 'Infrastructure Project',
      officer_name: update.officerName || 'Field Officer',
      reported_progress_percentage: Number(update.reportedProgressPercentage ?? update.aiVisualProgress ?? 0),
      remarks: update.remarks || 'Site progress update',
      photo_url: update.photoUrl || null,
      before_image_reference: update.beforeImageReference || null,
      after_image_reference: update.afterImageReference || update.photoUrl || null,
      latitude: Number(update.latitude ?? 17.4000),
      longitude: Number(update.longitude ?? 78.4500),
      ai_risk_level: update.aiRiskLevel || 'Low',
      timestamp: update.timestamp || new Date().toLocaleString('en-IN'),
      data_json: update,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from(TABLES.FIELD_UPDATES).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Error saving field update to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Exception saving field update to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save field update' };
  }
}

export async function saveDocumentToSupabase(document: DocumentItem): Promise<{ success: boolean; error: string | null }> {
  try {
    const isDocUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(document.id);
    const docUuid = isDocUuid ? document.id.toLowerCase() : (crypto.randomUUID ? crypto.randomUUID() : toValidUuid(document.id));
    const isProjUuid = document.projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(document.projectId);
    const projUuid = isProjUuid ? document.projectId.toLowerCase() : (document.projectId ? toValidUuid(document.projectId) : null);

    const payload = {
      id: docUuid,
      project_id: projUuid,
      title: document.title || 'Project Document',
      name: document.title || 'Project Document',
      category: document.category || 'Government Approval',
      file_type: document.fileType || 'PDF',
      file_size: document.fileSize || '1.2 MB',
      file_url: document.fileUrl || '',
      uploaded_by: document.uploadedBy || 'Administrator',
      uploaded_at: document.uploadedAt || new Date().toISOString().split('T')[0],
      version: document.version || 'v1.0',
      data_json: document,
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from(TABLES.DOCUMENTS).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Notice saving document to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Exception saving document to Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save document' };
  }
}

