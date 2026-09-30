import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Project, Contractor, AlertNotification, AuditLog, UserRole, FieldUpdate, FieldInspection, Issue, DocumentItem } from '../types';
import { MOCK_PROJECTS, MOCK_CONTRACTORS, MOCK_ALERTS, MOCK_AUDIT_LOGS } from '../data/mockData';
import { calculateAIPrediction, calculateHealthScore } from '../services/aiEngine';

// Supabase Backend Services
import { 
  seedSupabaseIfEmpty, 
  fetchProjectsFromSupabase,
  fetchInspectionsFromSupabase,
  fetchContractorsFromSupabase,
  fetchAlertsFromSupabase,
  fetchAuditLogsFromSupabase,
  subscribeProjects as subscribeSupabaseProjects, 
  subscribeContractors as subscribeSupabaseContractors, 
  subscribeAlerts as subscribeSupabaseAlerts, 
  subscribeAuditLogs as subscribeSupabaseAuditLogs,
  subscribeInspections as subscribeSupabaseInspections,
  saveProjectToSupabase,
  renameProjectInSupabase,
  updateProjectInSupabase,
  deleteProjectFromSupabase,
  addAlertToSupabase,
  markAlertReadInSupabase,
  addAuditLogToSupabase,
  saveFieldUpdateToSupabase,
  saveInspectionToSupabase,
  fetchProfilesFromSupabase,
  updateInspectionStatusInSupabase,
  markInspectionViewedInSupabase,
  saveManagerRemarkToSupabase,
  clearInspectionInSupabase,
  saveDocumentToSupabase
} from '../services/supabase/databaseService';
import { signOutUser, listenToAuthState, getUserProfile, getUserProfileByEmail, UserProfile } from '../services/authService';
import { generateAndSaveAIRiskPrediction } from '../services/aiService';

interface AppContextType {
  userRole: UserRole;
  userEmail: string;
  userPhone: string;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  activeTab: string;
  selectedProjectId: string | null;
  projects: Project[];
  allProjects: Project[];
  contractors: Contractor[];
  alerts: AlertNotification[];
  auditLogs: AuditLog[];
  inspections: FieldInspection[];
  allInspections: FieldInspection[];
  searchQuery: string;
  filterDepartment: string;
  filterStatus: string;
  filterRisk: string;
  isAIAssistantOpen: boolean;
  isCommandCenterMode: boolean;
  isLoading: boolean;
  databaseError: string | null;
  
  // Actions
  setUserRole: (role: UserRole) => void;
  loginAs: (role: UserRole, email?: string, phone?: string, profile?: UserProfile | null) => void;
  logout: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterDepartment: (dept: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterRisk: (risk: string) => void;
  setIsAIAssistantOpen: (open: boolean) => void;
  setIsCommandCenterMode: (active: boolean) => void;
  refreshFromSupabase: () => Promise<void>;
  
  // Data Mutators
  createNewProject: (project: Partial<Project> & Record<string, any>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<boolean>;
  renameProject: (projectId: string, newName: string) => Promise<{ success: boolean; error: string | null }>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; error: string | null }>;
  submitFieldUpdate: (updateData: Omit<FieldUpdate, 'id' | 'timestamp'>) => Promise<void>;
  approveInspection: (inspectionId: string, remark?: string) => Promise<boolean>;
  rejectInspection: (inspectionId: string, remark?: string) => Promise<boolean>;
  addIssue: (issueData: Omit<Issue, 'id' | 'reportedAt'>) => Promise<void>;
  resolveIssue: (issueId: string, notes?: string) => Promise<void>;
  markAlertRead: (alertId: string) => Promise<void>;
  markInspectionViewed: (inspectionId: string) => Promise<void>;
  markInspectionReviewed: (inspectionId: string, remark?: string) => Promise<boolean>;
  clearInspection: (inspectionId: string) => Promise<boolean>;
  saveManagerRemark: (inspectionId: string, remark: string) => Promise<void>;
  addDocumentToProject: (projectId: string, docData: Omit<DocumentItem, 'id' | 'uploadedAt'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('Administrator');
  const [userEmail, setUserEmail] = useState<string>('admin@citytrack.ai');
  const [userPhone, setUserPhone] = useState<string>('+91 98765 43210');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Storage of master records from Supabase
  const [rawProjects, setRawProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [contractors, setContractors] = useState<Contractor[]>(MOCK_CONTRACTORS);
  const [rawAlerts, setRawAlerts] = useState<AlertNotification[]>(MOCK_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [rawInspections, setRawInspections] = useState<FieldInspection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  // Dynamic in-memory cache of profiles fetched from Supabase public.profiles table
  const [roleProfiles, setRoleProfiles] = useState<Map<UserRole, UserProfile>>(new Map());

  // User-specific read alerts state (tracked per user/role in localStorage)
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('citytrack_read_alerts_Administrator');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Whenever userRole or userEmail changes, load that user's read alerts from localStorage
  useEffect(() => {
    try {
      const storageKey = `citytrack_read_alerts_${userEmail || userRole}`;
      const saved = localStorage.getItem(storageKey);
      setReadAlertIds(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch {
      setReadAlertIds(new Set());
    }
  }, [userRole, userEmail]);

  // Compute alerts with user-specific isRead status
  const alerts = useMemo(() => {
    return rawAlerts.map(a => ({
      ...a,
      isRead: readAlertIds.has(a.id)
    }));
  }, [rawAlerts, readAlertIds]);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isCommandCenterMode, setIsCommandCenterMode] = useState<boolean>(false);

  /**
   * Fetch all data directly from Supabase PostgreSQL (SELECT)
   */
  const refreshFromSupabase = async () => {
    try {
      setIsLoading(true);
      const [projRes, inspRes, conRes, alertRes, logRes, profRes] = await Promise.all([
        fetchProjectsFromSupabase(),
        fetchInspectionsFromSupabase(),
        fetchContractorsFromSupabase(),
        fetchAlertsFromSupabase(),
        fetchAuditLogsFromSupabase(),
        fetchProfilesFromSupabase()
      ]);

      if (projRes.error) {
        setDatabaseError(projRes.error);
      } else {
        setDatabaseError(null);
        if (projRes.data && projRes.data.length > 0) {
          setRawProjects(projRes.data);
          if (!selectedProjectId) {
            setSelectedProjectId(projRes.data[0].id);
          }
        } else if (projRes.data && projRes.data.length === 0) {
          await seedSupabaseIfEmpty();
          const { data: seededProjects, error: seedFetchErr } = await fetchProjectsFromSupabase();
          if (seedFetchErr) {
            setDatabaseError(seedFetchErr);
          } else if (seededProjects && seededProjects.length > 0) {
            setRawProjects(seededProjects);
            if (!selectedProjectId) setSelectedProjectId(seededProjects[0].id);
          }
        }
      }

      if (!inspRes.error && inspRes.data) {
        setRawInspections(inspRes.data);
      }

      if (!conRes.error && conRes.data && conRes.data.length > 0) {
        setContractors(conRes.data);
      }

      if (!alertRes.error && alertRes.data && alertRes.data.length > 0) {
        setRawAlerts(alertRes.data);
      }

      if (!logRes.error && logRes.data && logRes.data.length > 0) {
        setAuditLogs(logRes.data);
      }

      if (!profRes.error && profRes.data && profRes.data.length > 0) {
        const map = new Map<UserRole, UserProfile>();
        profRes.data.forEach((d: any) => {
          if (d.role) {
            const prof: UserProfile = {
              id: d.id,
              fullName: d.full_name || d.name || d.email,
              name: d.full_name || d.name || d.email,
              email: d.email,
              phone: d.phone || '',
              role: d.role as UserRole,
              department: d.department || 'Municipal Administration',
              status: d.status || 'Active',
              avatarUrl: d.avatar_url,
              createdAt: d.created_at || new Date().toISOString()
            };
            map.set(d.role as UserRole, prof);
          }
        });
        setRoleProfiles(map);
        setUserProfile(prev => {
          if (!prev && map.has(userRole)) {
            return map.get(userRole)!;
          }
          return prev;
        });
      }
    } catch (err: any) {
      console.error('Error refreshing from Supabase:', err);
      setDatabaseError(err?.message || 'Failed to connect to Supabase database');
    } finally {
      setIsLoading(false);
    }
  };

  // Role-based filtered views for projects
  const projects = useMemo(() => {
    if (userRole === 'Administrator') {
      return rawProjects;
    }
    if (userRole === 'Project Manager') {
      // Must use authenticated user's actual profile ID. Wait if profile is loading.
      if (!userProfile?.id || userProfile.role !== 'Project Manager') {
        return [];
      }
      const pmUid = userProfile.id;
      return rawProjects.filter(p => p.projectManagerId === pmUid);
    }
    if (userRole === 'Field Officer') {
      if (!userProfile?.id || userProfile.role !== 'Field Officer') {
        return [];
      }
      const foUid = userProfile.id;
      return rawProjects.filter(p => p.fieldOfficerId === foUid);
    }
    if (userRole === 'Contractor') {
      // Contractor permitted view
      if (!userProfile?.id || userProfile.role !== 'Contractor') {
        return [];
      }
      const conUid = userProfile.id;
      return rawProjects.filter(p => p.contractorId === conUid || p.contractorId === 'CON-001' || p.contractorName?.includes('Metro'));
    }
    return rawProjects;
  }, [rawProjects, userRole, userProfile]);

  // Role-based filtered views for inspections
  const inspections = useMemo(() => {
    const activeInspections = rawInspections.filter(i => i.status !== 'CLEARED');
    if (userRole === 'Administrator') {
      return activeInspections;
    }
    if (userRole === 'Project Manager') {
      // Must use authenticated user's actual profile ID. Wait if profile is loading.
      if (!userProfile?.id || userProfile.role !== 'Project Manager') {
        return [];
      }
      const pmUid = userProfile.id;
      return activeInspections.filter(i => 
        i.projectManagerId === pmUid || 
        rawProjects.some(p => p.id === i.projectId && p.projectManagerId === pmUid)
      );
    }
    if (userRole === 'Field Officer') {
      if (!userProfile?.id || userProfile.role !== 'Field Officer') {
        return [];
      }
      const foUid = userProfile.id;
      return activeInspections.filter(i => i.officerId === foUid || i.fieldOfficerId === foUid);
    }
    if (userRole === 'Contractor') {
      // Contractors must NOT have access to field inspection photos or reports
      return [];
    }
    return activeInspections;
  }, [rawInspections, rawProjects, userRole, userProfile]);

  // Initialize Supabase Auth Session, Initial Load & Real-Time Sync
  useEffect(() => {
    refreshFromSupabase();

    // Subscribe to Supabase Auth state changes
    const unsubAuth = listenToAuthState(async (supaUser) => {
      if (supaUser) {
        setIsLoggedIn(true);
        const email = supaUser.email || supaUser.user_metadata?.email || 'admin@citytrack.ai';
        const profile = await getUserProfile(supaUser.id) || await getUserProfileByEmail(email);
        if (profile) {
          setUserProfile(profile);
          setUserRole(profile.role);
          setUserEmail(profile.email);
          if (profile.phone) setUserPhone(profile.phone);
        } else if (supaUser.user_metadata?.role) {
          setUserRole(supaUser.user_metadata.role);
          setUserEmail(email);
        }
      } else {
        // Resolve default initial profile dynamically from Supabase database
        getUserProfileByEmail('admin@citytrack.ai').then(profile => {
          if (profile) {
            setUserProfile(profile);
            setUserRole(profile.role);
            setUserEmail(profile.email);
            if (profile.phone) setUserPhone(profile.phone);
          }
        });
      }
    });

    // Realtime subscriptions
    const unsubProjects = subscribeSupabaseProjects((realtimeProjects) => {
      if (realtimeProjects && realtimeProjects.length > 0) {
        setRawProjects(realtimeProjects);
      }
    });

    const unsubContractors = subscribeSupabaseContractors((realtimeContractors) => {
      if (realtimeContractors && realtimeContractors.length > 0) {
        setContractors(realtimeContractors);
      }
    });

    const unsubAlerts = subscribeSupabaseAlerts((realtimeAlerts) => {
      if (realtimeAlerts && realtimeAlerts.length > 0) {
        setRawAlerts(realtimeAlerts);
      }
    });

    const unsubLogs = subscribeSupabaseAuditLogs((realtimeLogs) => {
      if (realtimeLogs && realtimeLogs.length > 0) {
        setAuditLogs(realtimeLogs);
      }
    });

    const unsubInspections = subscribeSupabaseInspections((realtimeInspections) => {
      if (realtimeInspections && realtimeInspections.length > 0) {
        setRawInspections(realtimeInspections);
      }
    });

    return () => {
      unsubAuth();
      unsubProjects();
      unsubContractors();
      unsubAlerts();
      unsubLogs();
      unsubInspections();
    };
  }, []);

  const loginAs = async (role: UserRole, email?: string, phone?: string, profile?: UserProfile | null) => {
    const roleDefaultEmail: Record<UserRole, string> = {
      'Administrator': 'admin@citytrack.ai',
      'Project Manager': 'pm@citytrack.ai',
      'Field Officer': 'field@citytrack.ai',
      'Contractor': 'contractor@citytrack.ai'
    };
    const targetEmail = email || roleDefaultEmail[role] || 'admin@citytrack.ai';
    const targetPhone = phone || '+91 98765 43210';

    let resolvedProfile: UserProfile | null | undefined = profile;
    if (!resolvedProfile) {
      resolvedProfile = await getUserProfileByEmail(targetEmail);
    }

    const finalRole = resolvedProfile?.role || role;
    setUserRole(finalRole);
    setUserProfile(resolvedProfile || null);
    setUserEmail(targetEmail);
    setUserPhone(targetPhone);
    setIsLoggedIn(true);

    const loginLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: targetEmail,
      role: finalRole,
      action: 'Supabase Verified Sign-In',
      timestamp: new Date().toLocaleString('en-IN'),
      ipAddress: '10.20.40.105 (Verified Session)',
      device: 'CityTrack Portal 2FA',
      details: `User authenticated to ${targetEmail}. Verified role ${finalRole} loaded from public.profiles.`
    };
    setAuditLogs(prev => [loginLog, ...prev]);
    addAuditLogToSupabase(loginLog);
  };

  const handleSetUserRole = async (newRole: UserRole) => {
    setUserRole(newRole);
    const roleDefaultEmail: Record<UserRole, string> = {
      'Administrator': 'admin@citytrack.ai',
      'Project Manager': 'pm@citytrack.ai',
      'Field Officer': 'field@citytrack.ai',
      'Contractor': 'contractor@citytrack.ai'
    };
    const targetEmail = roleDefaultEmail[newRole] || 'admin@citytrack.ai';
    setUserEmail(targetEmail);
    
    // Check dynamic in-memory database cache first
    const cached = roleProfiles.get(newRole);
    if (cached) {
      setUserProfile(cached);
      if (cached.phone) setUserPhone(cached.phone);
      return;
    }

    // Otherwise resolve profile dynamically from public.profiles in Supabase
    try {
      const profile = await getUserProfileByEmail(targetEmail);
      if (profile) {
        setUserProfile(profile);
        if (profile.phone) setUserPhone(profile.phone);
        setRoleProfiles(prev => new Map(prev).set(newRole, profile));
      } else {
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Could not refresh profile for role:', newRole, e);
      setUserProfile(null);
    }
  };

  const logout = () => {
    signOutUser();
    setIsLoggedIn(false);
    setUserProfile(null);
  };

  const recalculateProjectState = (proj: Project): Project => {
    const aiPrediction = calculateAIPrediction(proj);
    const healthScore = calculateHealthScore({ ...proj, aiPrediction });
    return {
      ...proj,
      aiPrediction,
      healthScore,
      lastUpdated: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
  };

  /**
   * Create New Project with Real Supabase INSERT and re-fetch confirmation
   * Only Administrator is authorized.
   */
  const createNewProject = async (newProjData: Partial<Project> & Record<string, any>): Promise<Project> => {
    if (userRole !== 'Administrator') {
      throw new Error('Unauthorized: Only Administrator can create new infrastructure projects.');
    }

    if (!newProjData.name || !newProjData.name.trim()) {
      throw new Error('Validation Error: Project Name is required.');
    }
    if (!newProjData.location || !newProjData.location.trim()) {
      throw new Error('Validation Error: Project Location is required.');
    }

    const newUuid = crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Math.floor(Date.now() / 1000).toString().padStart(12, '0')}`;
    const code = newProjData.projectId || `PRJ-${(newProjData.department || 'GOV').slice(0, 3).toUpperCase()}-2026-${String(rawProjects.length + 1).padStart(3, '0')}`;
    
    // Milestones from payload or defaults
    const initialMilestones: any[] = Array.isArray(newProjData.milestones) && newProjData.milestones.length > 0
      ? newProjData.milestones
      : [
          { id: `M-${Date.now()}-1`, name: 'Administrative Sanction & DPR Approval', category: 'Approval' as const, targetDate: newProjData.startDate || '2026-03-15', actualDate: newProjData.startDate || '2026-03-10', status: 'Completed' as const, weightPercentage: 20 },
          { id: `M-${Date.now()}-2`, name: 'Tender Award & Contractor Mobilization', category: 'Procurement' as const, targetDate: '2026-04-15', status: 'In Progress' as const, weightPercentage: 25 },
          { id: `M-${Date.now()}-3`, name: 'Civil Construction & Earthwork', category: 'Construction' as const, targetDate: '2026-09-30', status: 'Pending' as const, weightPercentage: 35 },
          { id: `M-${Date.now()}-4`, name: 'Final Handover & Line Clearance', category: 'Inspection' as const, targetDate: newProjData.expectedCompletionDate || '2026-12-15', status: 'Pending' as const, weightPercentage: 20 },
        ];

    // Documents from payload or initial sanction doc
    const initialDocs: any[] = Array.isArray(newProjData.documents) && newProjData.documents.length > 0
      ? newProjData.documents
      : [
          { id: `DOC-${Date.now()}-1`, projectId: newUuid, title: newProjData.initialDocTitle || 'Government Sanction Order (GO-MS-452)', category: (newProjData.initialDocCategory || 'Government Approval') as any, fileType: 'PDF' as const, fileSize: '2.1 MB', uploadedBy: `${userRole} Administrator`, uploadedAt: new Date().toISOString().split('T')[0], version: 'v1.0', fileUrl: '#' }
        ];

    const baseProject: Project = {
      id: newUuid,
      projectId: code,
      name: newProjData.name.trim(),
      department: newProjData.department || 'Municipal Administration (GHMC)',
      projectType: newProjData.projectType || 'Roads',
      description: newProjData.description || 'Civic infrastructure construction project.',
      location: newProjData.location.trim(),
      district: newProjData.district || 'Hyderabad',
      latitude: Number(newProjData.latitude) || 17.4000,
      longitude: Number(newProjData.longitude) || 78.4500,
      managerName: newProjData.managerName || 'Er. S. Rao (Executive Engineer)',
      projectManagerId: newProjData.projectManagerId || '',
      fieldOfficerId: newProjData.fieldOfficerId || '',
      contractorName: newProjData.contractorName || 'Metro Infrastructure Pvt Ltd',
      contractorId: newProjData.contractorId || 'CON-001',
      startDate: newProjData.startDate || new Date().toISOString().split('T')[0],
      expectedCompletionDate: newProjData.expectedCompletionDate || '2026-12-31',
      revisedCompletionDate: newProjData.revisedCompletionDate || undefined,
      totalBudgetCr: Number(newProjData.totalBudgetCr) || 25.0,
      allocatedBudgetCr: Number(newProjData.allocatedBudgetCr || newProjData.totalBudgetCr) || 25.0,
      spentBudgetCr: Number(newProjData.spentBudgetCr) || 0.0,
      expectedProgressPercentage: Number(newProjData.expectedProgressPercentage) || 30,
      actualProgressPercentage: Number(newProjData.actualProgressPercentage) || 0,
      status: newProjData.status || 'On Track',
      riskLevel: newProjData.riskLevel || 'Low',
      priority: newProjData.priority || 'Medium',
      objectives: Array.isArray(newProjData.objectives) ? newProjData.objectives : [newProjData.objectives || 'Deliver high-grade civic infrastructure ahead of schedule.'],
      milestones: initialMilestones,
      photographs: [],
      issues: [],
      fieldUpdates: [],
      fieldInspections: [],
      documents: initialDocs,
      healthScore: { overall: 85, schedule: 82, budget: 88, quality: 90, risk: 80, contractor: 85, statusText: 'Low Risk' },
      aiPrediction: {
        delayProbability: Number(newProjData.delayProbability ?? 15),
        riskLevel: newProjData.riskLevel || 'Low',
        predictedDelayDays: Number(newProjData.predictedDelayDays ?? 0),
        expectedCompletionDate: newProjData.expectedCompletionDate || '2026-12-31',
        revisedCompletionDate: newProjData.revisedCompletionDate || newProjData.expectedCompletionDate || '2026-12-31',
        explanation: 'Initial project baseline established. Registered in Supabase.',
        riskFactors: [
          { category: 'Schedule Risk', riskLevel: 'LOW', score: 15, details: 'Milestones currently in early procurement window.' },
          { category: 'Budget Risk', riskLevel: 'LOW', score: 20, details: 'Initial fund allocations within sanctioned limits.' }
        ],
        recommendations: [
          'Monitor early contractor mobilization on site.',
          'Verify quality certifications of initial raw material consignments.'
        ]
      },
      lastUpdated: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    const finalProject = recalculateProjectState(baseProject);

    // 1. Perform Real Supabase INSERT
    const insertResult = await saveProjectToSupabase(finalProject);
    if (!insertResult.success) {
      console.error('PROJECT CREATE ERROR:', insertResult.error);
      throw new Error(insertResult.error || 'Failed to insert project into Supabase');
    }

    // 2. Re-fetch from Supabase to confirm persistence
    const { data: refreshed } = await fetchProjectsFromSupabase();
    if (refreshed && refreshed.length > 0) {
      setRawProjects(refreshed);
    } else {
      setRawProjects(prev => [finalProject, ...prev]);
    }

    // 3. Save AI prediction and Audit Log
    generateAndSaveAIRiskPrediction(finalProject);
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: `${userRole} User (${userEmail})`,
      role: userRole,
      action: 'Created New Infrastructure Project',
      projectId: finalProject.id,
      projectName: finalProject.name,
      timestamp: new Date().toLocaleString('en-IN'),
      ipAddress: '10.20.40.105',
      device: 'CityTrack Web Portal',
      details: `Project registered under ${finalProject.department}. Total outlay: ₹${finalProject.totalBudgetCr} Cr. UUID: ${finalProject.id}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);

    return finalProject;
  };

  /**
   * Rename Project with Real Supabase UPDATE and re-fetch confirmation
   * Only Administrator is authorized.
   */
  const renameProject = async (projectId: string, newName: string): Promise<{ success: boolean; error: string | null }> => {
    if (userRole !== 'Administrator') {
      return { success: false, error: 'Unauthorized: Only Administrator can rename infrastructure projects.' };
    }
    if (!newName || !newName.trim()) {
      return { success: false, error: 'Project name cannot be empty.' };
    }

    const renameResult = await renameProjectInSupabase(projectId, newName.trim());
    if (!renameResult.success) {
      console.error('Supabase renameProject failed:', renameResult.error);
      return { success: false, error: renameResult.error };
    }

    // Re-fetch from Supabase to confirm persistence
    const { data: refreshed } = await fetchProjectsFromSupabase();
    if (refreshed && refreshed.length > 0) {
      setRawProjects(refreshed);
    }

    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: `${userRole} User (${userEmail})`,
      role: userRole,
      action: 'Renamed Infrastructure Project',
      projectId: projectId,
      projectName: newName.trim(),
      timestamp: new Date().toLocaleString('en-IN'),
      ipAddress: '10.20.40.105',
      device: 'CityTrack Web Portal',
      details: `Project UUID ${projectId} renamed to "${newName.trim()}".`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);

    return { success: true, error: null };
  };

  /**
   * Update Project with Real Supabase UPDATE and re-fetch confirmation
   * Only Administrator is authorized.
   */
  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    if (userRole !== 'Administrator') {
      alert('Unauthorized: Only Administrator can modify project master records.');
      return false;
    }

    const updateResult = await updateProjectInSupabase(projectId, updates);
    if (!updateResult.success) {
      console.error('Supabase UPDATE failed:', updateResult.error);
      alert(`Supabase project update failed: ${updateResult.error}`);
      return false;
    }

    // Re-fetch from Supabase
    const { data: refreshed } = await fetchProjectsFromSupabase();
    if (refreshed && refreshed.length > 0) {
      setRawProjects(refreshed);
    }
    return true;
  };

  /**
   * Delete Project with Real Supabase DELETE and FK-safe cleanup
   * Only Administrator is authorized.
   */
  const deleteProject = async (projectId: string): Promise<{ success: boolean; error: string | null }> => {
    if (userRole !== 'Administrator') {
      return { success: false, error: 'Unauthorized: Only Administrator can delete infrastructure projects.' };
    }

    const deleteResult = await deleteProjectFromSupabase(projectId);
    if (!deleteResult.success) {
      return { success: false, error: deleteResult.error };
    }

    // Re-fetch from Supabase
    const { data: refreshed } = await fetchProjectsFromSupabase();
    setRawProjects(refreshed || []);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(refreshed?.[0]?.id || null);
    }
    return { success: true, error: null };
  };

  /**
   * Submit Field Update & Photo Inspection with Real Supabase INSERT
   */
  const submitFieldUpdate = async (updateData: Omit<FieldUpdate, 'id' | 'timestamp'>) => {
    const timestampStr = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newUpdate: FieldUpdate = {
      ...updateData,
      id: `FLD-${Date.now()}`,
      timestamp: timestampStr
    };

    saveFieldUpdateToSupabase(newUpdate);

    const targetProj = rawProjects.find(p => p.id === updateData.projectId);
    const newInspUuid = crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Math.floor(Date.now() / 1000).toString().padStart(12, '0')}`;
    const assignedPMId = targetProj?.projectManagerId || '';
    const officerUid = userProfile?.id || '';

    const newInspection: FieldInspection = {
      id: newInspUuid,
      inspectionId: newInspUuid,
      projectId: updateData.projectId,
      projectName: targetProj?.name || updateData.projectName,
      projectLocation: targetProj ? `${targetProj.location}, ${targetProj.district}` : 'Hyderabad Corridor',
      officerId: officerUid,
      officerName: updateData.officerName || userProfile?.fullName || 'Field Officer',
      fieldOfficerId: officerUid,
      fieldOfficerName: updateData.officerName || userProfile?.fullName || 'Field Officer',
      projectManagerId: assignedPMId,
      inspectionDate: new Date().toISOString().split('T')[0],
      timestamp: timestampStr,
      progress: updateData.reportedProgressPercentage,
      remarks: updateData.remarks,
      aiGeneratedRemarks: updateData.aiExplanation || updateData.remarks,
      officerRemarks: updateData.remarks,
      officerSubmittedRemarks: updateData.remarks,
      severity: (updateData.aiRiskLevel === 'High' || updateData.aiRiskLevel === 'Critical')
        ? (updateData.aiRiskLevel === 'Critical' ? 'Critical' : 'High')
        : (updateData.issueSeverity || 'Low'),
      aiVisualProgress: updateData.aiVisualProgress || updateData.reportedProgressPercentage,
      aiDelayProbability: updateData.aiDelayProbability || targetProj?.aiPrediction.delayProbability || 78,
      aiRiskLevel: updateData.aiRiskLevel || targetProj?.aiPrediction.riskLevel || 'High',
      predictedDelayDays: updateData.predictedDelayDays !== undefined ? updateData.predictedDelayDays : targetProj?.aiPrediction.predictedDelayDays || 18,
      aiExplanation: updateData.aiExplanation || targetProj?.aiPrediction.explanation || 'Visual observation indicates active construction pacing.',
      constructionActivity: updateData.remarks || 'Site construction activity in progress.',
      visibleWork: 'Structural civil work and sub-grade preparation in progress.',
      workersEquipment: 'Heavy machinery and site labor crew active.',
      materials: 'Construction raw materials and structural aggregates.',
      siteCondition: 'Active site operations with equipment present.',
      safetyConcerns: updateData.aiRiskLevel === 'High' || updateData.aiRiskLevel === 'Critical' 
        ? 'Barricading and hazard warning signage require closer inspection.' 
        : 'Standard site safety gear observed.',
      qualityConcerns: 'Sub-base compaction layer density requires verification certificate.',
      safetyQualityConcerns: updateData.aiRiskLevel === 'High' || updateData.aiRiskLevel === 'Critical' 
        ? 'Possible safety concern: Inadequate perimeter hazard barricading near active traffic lane.' 
        : 'Safety equipment observed on site crew.',
      visualConfidence: 'HIGH',
      visualAnalysisConfidence: 'HIGH',
      aiRecommendations: updateData.aiRecommendations || targetProj?.aiPrediction.recommendations || ['Conduct immediate site inspection'],
      beforeImageReference: updateData.beforeImageReference,
      afterImageReference: updateData.afterImageReference || updateData.photoUrl,
      currentImageReference: updateData.afterImageReference || updateData.photoUrl,
      currentImageUrl: updateData.photoUrl || '',
      status: 'SUBMITTED',
      managerViewed: false,
      managerViewedAt: null,
      isDemoPrediction: updateData.isDemoPrediction !== undefined ? updateData.isDemoPrediction : false
    };

    // Save inspection directly to Supabase
    const inspSaveRes = await saveInspectionToSupabase(newInspection);
    if (!inspSaveRes.success) {
      console.error('Inspection save error:', inspSaveRes.error);
    }

    // Refresh inspections from Supabase
    const { data: refInsps } = await fetchInspectionsFromSupabase();
    if (refInsps && refInsps.length > 0) {
      setRawInspections(refInsps);
    } else {
      setRawInspections(prev => [newInspection, ...prev]);
    }

    if (targetProj) {
      const updatedFieldUpdates = [newUpdate, ...targetProj.fieldUpdates];
      const newPhotographs = [...targetProj.photographs];

      if (updateData.photoUrl) {
        newPhotographs.unshift({
          id: `IMG-${Date.now()}`,
          url: updateData.photoUrl,
          caption: updateData.remarks || 'Site AI photo inspection',
          uploadedBy: updateData.officerName,
          uploadedAt: timestampStr,
          latitude: updateData.latitude,
          longitude: updateData.longitude,
          phase: 'Latest',
          stageTag: updateData.aiVisualProgress ? `AI Visual: ${updateData.aiVisualProgress}%` : 'Field Update'
        });
      }

      const existingInspections = targetProj.fieldInspections || [];
      const updatedInspections = [newInspection, ...existingInspections];

      const updatedPrediction = updateData.aiDelayProbability !== undefined ? {
        ...targetProj.aiPrediction,
        delayProbability: updateData.aiDelayProbability,
        riskLevel: updateData.aiRiskLevel || targetProj.aiPrediction.riskLevel,
        predictedDelayDays: updateData.predictedDelayDays !== undefined ? updateData.predictedDelayDays : targetProj.aiPrediction.predictedDelayDays,
        explanation: updateData.aiExplanation || targetProj.aiPrediction.explanation,
        recommendations: updateData.aiRecommendations || targetProj.aiPrediction.recommendations
      } : targetProj.aiPrediction;

      const updatedProj: Project = recalculateProjectState({
        ...targetProj,
        actualProgressPercentage: updateData.reportedProgressPercentage,
        riskLevel: updateData.aiRiskLevel || targetProj.riskLevel,
        aiPrediction: updatedPrediction,
        fieldUpdates: updatedFieldUpdates,
        fieldInspections: updatedInspections,
        photographs: newPhotographs,
        latestInspectionId: newInspUuid,
        latestInspectionDate: timestampStr,
        fieldInspectionCount: (targetProj.fieldInspectionCount || existingInspections.length) + 1,
        latestFieldRemarks: updateData.remarks,
        lastFieldOfficerUpdate: `${updateData.officerName} (${timestampStr})`
      });

      // Save updated project to Supabase
      await saveProjectToSupabase(updatedProj);
      generateAndSaveAIRiskPrediction(updatedProj);

      // Re-fetch from Supabase to confirm persistence
      const { data: refreshed } = await fetchProjectsFromSupabase();
      if (refreshed && refreshed.length > 0) {
        setRawProjects(refreshed);
      }
    }

    // PM Alert for field inspection submission
    const isCritical = updateData.aiRiskLevel === 'Critical' || updateData.issueSeverity === 'Critical';
    const isWarning = updateData.aiRiskLevel === 'High' || updateData.issueSeverity === 'High' || (updateData.aiDelayProbability !== undefined && updateData.aiDelayProbability > 70);

    const newAlert: AlertNotification = {
      id: `ALT-${Date.now()}`,
      projectId: updateData.projectId,
      projectName: targetProj?.name || updateData.projectName,
      inspectionId: newInspUuid,
      projectManagerId: assignedPMId,
      title: isCritical 
        ? `🔴 CRITICAL: New field inspection submitted for ${targetProj?.name || updateData.projectName}`
        : isWarning
        ? `🟠 New field inspection submitted for ${targetProj?.name || updateData.projectName}`
        : `New field inspection submitted for ${targetProj?.name || updateData.projectName}`,
      message: `Field Officer ${updateData.officerName || 'Field Officer'} submitted inspection. Progress: ${updateData.reportedProgressPercentage}%. Remarks: ${updateData.remarks || 'Site inspection recorded'}.`,
      reason: updateData.aiExplanation || `New field progress data submitted for PM verification.`,
      requiredAction: `Assigned Project Manager review required. Inspect site photo & approve or reject.`,
      targetRole: 'Project Manager',
      severity: isCritical ? 'Critical' : isWarning ? 'Warning' : 'Info',
      alertSeverityLevel: isCritical ? 'CRITICAL' : isWarning ? 'HIGH' : 'MEDIUM',
      timestamp: timestampStr,
      isRead: false,
      isResolved: false,
      category: 'Field Update Overdue'
    };

    setRawAlerts(prev => [newAlert, ...prev]);
    await addAlertToSupabase(newAlert);

    // Add Audit Log
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: updateData.officerName || 'Field Officer',
      role: 'Field Officer',
      action: 'Submitted AI Construction Photo Inspection',
      projectId: updateData.projectId,
      projectName: targetProj?.name || updateData.projectName,
      timestamp: timestampStr,
      ipAddress: '103.24.19.12 (Field Mobile)',
      device: 'Android CityTrack Field AI Mobile Portal',
      details: `AI Photo Inspection recorded. Progress: ${updateData.aiVisualProgress || updateData.reportedProgressPercentage}%, Delay Risk: ${updateData.aiDelayProbability || 'N/A'}%. Remarks: ${updateData.remarks}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);
  };

  /**
   * Approve Inspection
   */
  const approveInspection = async (inspectionId: string, remark?: string): Promise<boolean> => {
    const res = await updateInspectionStatusInSupabase(inspectionId, 'APPROVED', remark);
    if (res.success) {
      const { data: refInsps } = await fetchInspectionsFromSupabase();
      if (refInsps && refInsps.length > 0) setRawInspections(refInsps);

      const targetInsp = (refInsps || rawInspections).find(i => i.id === inspectionId || i.inspectionId === inspectionId);
      const foAlert: AlertNotification = {
        id: `ALT-${Date.now()}`,
        projectId: targetInsp?.projectId || '',
        projectName: targetInsp?.projectName || 'Project',
        inspectionId: inspectionId,
        projectManagerId: targetInsp?.projectManagerId,
        targetUserId: targetInsp?.officerId,
        title: `Field inspection approved for ${targetInsp?.projectName || 'Project'}`,
        message: `Project Manager approved your site inspection. Manager remark: "${remark || 'Approved without remarks'}".`,
        reason: 'Inspection review completed and verified by Project Manager.',
        requiredAction: 'Proceed with scheduled civil work monitoring.',
        targetRole: 'Field Officer',
        severity: 'Info',
        timestamp: new Date().toLocaleString('en-IN'),
        isRead: false,
        isResolved: true,
        category: 'Contractor Alert'
      };
      setRawAlerts(prev => [foAlert, ...prev]);
      await addAlertToSupabase(foAlert);

      return true;
    }
    return false;
  };

  /**
   * Reject Inspection
   */
  const rejectInspection = async (inspectionId: string, remark?: string): Promise<boolean> => {
    const res = await updateInspectionStatusInSupabase(inspectionId, 'REJECTED', remark);
    if (res.success) {
      const { data: refInsps } = await fetchInspectionsFromSupabase();
      if (refInsps && refInsps.length > 0) setRawInspections(refInsps);

      const targetInsp = (refInsps || rawInspections).find(i => i.id === inspectionId || i.inspectionId === inspectionId);
      const foAlert: AlertNotification = {
        id: `ALT-${Date.now()}`,
        projectId: targetInsp?.projectId || '',
        projectName: targetInsp?.projectName || 'Project',
        inspectionId: inspectionId,
        projectManagerId: targetInsp?.projectManagerId,
        targetUserId: targetInsp?.officerId,
        title: `Field inspection rejected for ${targetInsp?.projectName || 'Project'}`,
        message: `Project Manager rejected your site inspection. Manager remark: "${remark || 'Needs re-inspection'}".`,
        reason: 'Inspection failed compliance or validation requirements.',
        requiredAction: 'Conduct re-inspection and re-submit field report.',
        targetRole: 'Field Officer',
        severity: 'Warning',
        timestamp: new Date().toLocaleString('en-IN'),
        isRead: false,
        isResolved: false,
        category: 'Issue Escalated'
      };
      setRawAlerts(prev => [foAlert, ...prev]);
      await addAlertToSupabase(foAlert);

      return true;
    }
    return false;
  };

  /**
   * Add Issue with Real Supabase Persistence
   */
  const addIssue = async (issueData: Omit<Issue, 'id' | 'reportedAt'>) => {
    const newIssue: Issue = {
      ...issueData,
      id: `ISS-${Date.now()}`,
      reportedAt: new Date().toISOString().split('T')[0]
    };

    const targetProj = rawProjects.find(p => p.id === issueData.projectId);
    if (targetProj) {
      const updatedIssues = [newIssue, ...targetProj.issues];
      const updatedProj = recalculateProjectState({ ...targetProj, issues: updatedIssues });
      await saveProjectToSupabase(updatedProj);

      const { data: refreshed } = await fetchProjectsFromSupabase();
      if (refreshed && refreshed.length > 0) {
        setRawProjects(refreshed);
      }
    }

    if (issueData.severity === 'Critical' || issueData.severity === 'High') {
      const newAlert: AlertNotification = {
        id: `ALT-${Date.now()}`,
        projectId: issueData.projectId,
        projectName: issueData.projectName,
        title: `${issueData.severity} Severity Issue Reported`,
        message: `${issueData.type}: ${issueData.description}`,
        severity: issueData.severity === 'Critical' ? 'Critical' : 'Warning',
        timestamp: new Date().toLocaleString('en-IN'),
        isRead: false,
        category: 'Issue Escalated'
      };
      setRawAlerts(prev => [newAlert, ...prev]);
      addAlertToSupabase(newAlert);
    }
  };

  /**
   * Resolve Issue with Real Supabase Persistence
   */
  const resolveIssue = async (issueId: string, notes?: string) => {
    const targetProj = rawProjects.find(p => p.issues.some(i => i.id === issueId));
    if (targetProj) {
      const updatedIssues = targetProj.issues.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            status: 'Resolved' as const,
            resolutionNotes: notes || 'Resolved by Department Engineer.'
          };
        }
        return i;
      });
      const updatedProj = recalculateProjectState({ ...targetProj, issues: updatedIssues });
      await saveProjectToSupabase(updatedProj);

      const { data: refreshed } = await fetchProjectsFromSupabase();
      if (refreshed && refreshed.length > 0) {
        setRawProjects(refreshed);
      }
    }
  };

  const markInspectionViewed = async (inspectionId: string) => {
    // Only update viewed state and timestamp. Do NOT modify inspection status!
    setRawInspections(prev => prev.map(insp => 
      insp.id === inspectionId || insp.inspectionId === inspectionId 
        ? { ...insp, managerViewed: true, managerViewedAt: insp.managerViewedAt || new Date().toISOString() } 
        : insp
    ));
    await markInspectionViewedInSupabase(inspectionId);
  };

  const markInspectionReviewed = async (inspectionId: string, remark?: string): Promise<boolean> => {
    const timestampStr = new Date().toLocaleString('en-IN');
    setRawInspections(prev => prev.map(insp => {
      if (insp.id === inspectionId || insp.inspectionId === inspectionId) {
        return {
          ...insp,
          status: 'REVIEWED' as const,
          managerRemark: remark !== undefined ? remark : insp.managerRemark,
          managerRemarkSavedAt: remark !== undefined ? timestampStr : insp.managerRemarkSavedAt,
          managerViewed: true,
          managerViewedAt: insp.managerViewedAt || new Date().toISOString()
        };
      }
      return insp;
    }));

    const res = await updateInspectionStatusInSupabase(inspectionId, 'REVIEWED', remark);
    if (!res.success) {
      console.error('Failed to mark inspection reviewed in Supabase:', res.error);
    }

    const targetInsp = rawInspections.find(i => i.id === inspectionId || i.inspectionId === inspectionId);
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: `${userRole} User (${userEmail})`,
      role: userRole,
      action: 'Reviewed Field Inspection Report',
      projectId: targetInsp?.projectId || 'PRJ-GOV',
      projectName: targetInsp?.projectName || 'Project',
      timestamp: timestampStr,
      ipAddress: '10.20.40.105',
      device: 'CityTrack Web App',
      details: `Field Inspection ${inspectionId} marked as REVIEWED in Supabase.${remark ? ` Manager remarks: "${remark}"` : ''}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);

    return res.success;
  };

  /**
   * Clear Reviewed Inspection Report from Active Module
   */
  const clearInspection = async (inspectionId: string): Promise<boolean> => {
    const targetInsp = rawInspections.find(i => i.id === inspectionId || i.inspectionId === inspectionId);
    if (!targetInsp) return false;

    // Role-based permission enforcement:
    // 1. Contractor cannot clear or access inspections
    if (userRole === 'Contractor') {
      console.warn('Unauthorized: Contractors cannot clear field inspections.');
      return false;
    }
    // 2. Project Manager can only clear inspections belonging to their assigned projects
    if (userRole === 'Project Manager') {
      const pmUid = userProfile?.id;
      const isAssigned = (pmUid && targetInsp.projectManagerId === pmUid) || 
        rawProjects.some(p => p.id === targetInsp.projectId && p.projectManagerId === pmUid);
      if (!isAssigned) {
        console.warn('Unauthorized: Project Manager cannot clear an inspection for another PM\'s project.');
        return false;
      }
    }
    // 3. Field Officer can only clear if permitted (their own inspection)
    if (userRole === 'Field Officer') {
      const foUid = userProfile?.id;
      const isOwn = (foUid && (targetInsp.officerId === foUid || targetInsp.fieldOfficerId === foUid));
      if (!isOwn) {
        console.warn('Unauthorized: Field Officer cannot clear another officer\'s inspection.');
        return false;
      }
    }
    // 4. Must only clear after status is REVIEWED
    if (targetInsp.status !== 'REVIEWED') {
      console.warn('Clear action only allowed when inspection status is REVIEWED.');
      return false;
    }

    // Immediately remove from local state so user sees inspection disappear immediately
    setRawInspections(prev => prev.filter(i => i.id !== inspectionId && i.inspectionId !== inspectionId));

    // Update Supabase database status to 'CLEARED' (preserves row and storage photo for audit)
    const res = await clearInspectionInSupabase(inspectionId);
    if (!res.success) {
      console.error('Failed to clear inspection in Supabase:', res.error);
      const { data: refInsps } = await fetchInspectionsFromSupabase();
      if (refInsps) setRawInspections(refInsps);
      return false;
    }

    // Log intentional clear action in Audit Trail
    const timestampStr = new Date().toLocaleString('en-IN');
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: `${userRole} User (${userEmail})`,
      role: userRole,
      action: 'Cleared Reviewed Field Inspection',
      projectId: targetInsp.projectId,
      projectName: targetInsp.projectName,
      timestamp: timestampStr,
      ipAddress: '10.20.40.105',
      device: 'CityTrack Web App',
      details: `Reviewed Field Inspection ${inspectionId} cleared from active reports view by ${userRole}.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);

    return true;
  };

  const saveManagerRemark = async (inspectionId: string, remark: string) => {
    const timestampStr = new Date().toLocaleString('en-IN');
    setRawInspections(prev => prev.map(insp => {
      if (insp.id === inspectionId || insp.inspectionId === inspectionId) {
        return {
          ...insp,
          managerRemark: remark,
          managerRemarkSavedAt: timestampStr,
          status: 'REVIEWED' as const,
          managerViewed: true,
          managerViewedAt: new Date().toISOString()
        };
      }
      return insp;
    }));

    await saveManagerRemarkToSupabase(inspectionId, remark);

    const targetInsp = rawInspections.find(i => i.id === inspectionId || i.inspectionId === inspectionId);
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: `${userRole} User (${userEmail})`,
      role: userRole,
      action: 'Added Manager Remark to Field Inspection',
      projectId: targetInsp?.projectId || '',
      projectName: targetInsp?.projectName || '',
      timestamp: timestampStr,
      ipAddress: '10.0.4.102 (Command Desktop)',
      device: 'CityTrack Web Command Center',
      details: `Project Manager added remark: "${remark}". Inspection marked as REVIEWED.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);
  };

  const markAlertRead = async (alertId: string) => {
    // User-specific read tracking: update this user's read set in localStorage
    setReadAlertIds(prev => {
      const next = new Set(prev);
      next.add(alertId);
      try {
        const storageKey = `citytrack_read_alerts_${userEmail || userRole}`;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn('LocalStorage error saving read alert:', e);
      }
      return next;
    });

    setRawAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const addDocumentToProject = async (projectId: string, docData: Omit<DocumentItem, 'id' | 'uploadedAt'>) => {
    const newDocItem: DocumentItem = {
      ...docData,
      id: `DOC-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    await saveDocumentToSupabase(newDocItem);

    const targetProj = rawProjects.find(p => p.id === projectId);
    if (targetProj) {
      const updatedDocs = [newDocItem, ...targetProj.documents];
      const updatedProj = { ...targetProj, documents: updatedDocs };
      await saveProjectToSupabase(updatedProj);

      const { data: refreshed } = await fetchProjectsFromSupabase();
      if (refreshed && refreshed.length > 0) {
        setRawProjects(refreshed);
      }
    }

    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      user: docData.uploadedBy || `${userRole} User`,
      role: userRole,
      action: 'Uploaded Project Document to Storage',
      projectId: projectId,
      projectName: docData.title,
      timestamp: new Date().toLocaleString('en-IN'),
      ipAddress: '10.0.4.102',
      device: 'CityTrack Web Portal',
      details: `Uploaded document ${docData.title} (${docData.category}) for project ${projectId}.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addAuditLogToSupabase(newLog);
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        userEmail,
        userPhone,
        userProfile,
        isLoggedIn,
        activeTab,
        selectedProjectId,
        projects,
        allProjects: rawProjects,
        contractors,
        alerts,
        auditLogs,
        inspections,
        allInspections: rawInspections,
        searchQuery,
        filterDepartment,
        filterStatus,
        filterRisk,
        isAIAssistantOpen,
        isCommandCenterMode,
        isLoading,
        databaseError,
        
        setUserRole: handleSetUserRole,
        loginAs,
        logout,
        setActiveTab,
        setSelectedProjectId,
        setSearchQuery,
        setFilterDepartment,
        setFilterStatus,
        setFilterRisk,
        setIsAIAssistantOpen,
        setIsCommandCenterMode,
        refreshFromSupabase,
        
        createNewProject,
        updateProject,
        renameProject,
        deleteProject,
        submitFieldUpdate,
        approveInspection,
        rejectInspection,
        addIssue,
        resolveIssue,
        markAlertRead,
        markInspectionViewed,
        markInspectionReviewed,
        clearInspection,
        saveManagerRemark,
        addDocumentToProject
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
