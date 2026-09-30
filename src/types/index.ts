export type UserRole = 'Administrator' | 'Project Manager' | 'Field Officer' | 'Contractor';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Completed';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type Department = 
  | 'Roads & Buildings'
  | 'Municipal Administration (GHMC)'
  | 'Water Supply & Sewerage (HMWSSB)'
  | 'Medical & Health'
  | 'School Education'
  | 'Irrigation & CAD'
  | 'Urban Transport (HMR)'
  | 'Electrical & Smart Infrastructure';

export type ProjectType = 
  | 'Roads' 
  | 'Bridges & Flyovers' 
  | 'Hospitals' 
  | 'Schools' 
  | 'Water Supply' 
  | 'Drainage' 
  | 'Public Buildings' 
  | 'Smart Lighting' 
  | 'Waste Management';

export interface Milestone {
  id: string;
  name: string;
  category: 'Planning' | 'Approval' | 'Procurement' | 'Construction' | 'Inspection' | 'Completion';
  targetDate: string;
  actualDate?: string;
  status: 'Completed' | 'In Progress' | 'Overdue' | 'Pending';
  weightPercentage: number;
}

export interface SitePhotograph {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
  latitude: number;
  longitude: number;
  phase: 'Before' | 'In Progress' | 'Latest';
  stageTag: string;
}

export interface Issue {
  id: string;
  projectId: string;
  projectName: string;
  reportedBy: string;
  reportedAt: string;
  type: 'Construction delay' | 'Material shortage' | 'Contractor issue' | 'Budget issue' | 'Safety issue' | 'Quality issue' | 'Approval delay' | 'Environmental issue' | 'Procurement delay';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  description: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface FieldUpdate {
  id: string;
  projectId: string;
  projectName: string;
  officerName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  reportedProgressPercentage: number;
  photoUrl?: string;
  remarks: string;
  issueReported?: boolean;
  issueSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
  aiVisualProgress?: number;
  aiDelayProbability?: number;
  aiRiskLevel?: RiskLevel;
  predictedDelayDays?: number;
  aiExplanation?: string;
  aiRecommendations?: string[];
  beforeImageReference?: string;
  afterImageReference?: string;
  isDemoPrediction?: boolean;
}

export interface FieldInspection {
  id: string;
  inspectionId?: string;
  projectId: string;
  projectName: string;
  projectLocation?: string;
  officerId: string;
  officerName: string;
  fieldOfficerId?: string;
  fieldOfficerName?: string;
  projectManagerId?: string;
  inspectionDate?: string;
  timestamp: string;
  progress: number;
  remarks: string;
  aiGeneratedRemarks?: string;
  officerRemarks?: string;
  officerSubmittedRemarks?: string;
  managerRemark?: string;
  managerRemarkBy?: string;
  managerRemarkAt?: string;
  managerRemarkSavedAt?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  aiVisualProgress: number;
  aiDelayProbability: number;
  aiRiskLevel: RiskLevel;
  predictedDelayDays: number;
  aiExplanation: string;
  constructionActivity?: string;
  visibleWork?: string;
  workersEquipment?: string;
  materials?: string;
  siteCondition?: string;
  safetyConcerns?: string;
  qualityConcerns?: string;
  safetyQualityConcerns?: string;
  visualConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  visualAnalysisConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  aiRecommendations: string[];
  beforeImageReference?: string;
  afterImageReference?: string;
  currentImageReference?: string;
  currentImageUrl?: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'CLEARED';
  clearedAt?: string | null;
  managerViewed: boolean;
  managerViewedAt?: string | null;
  isDemoPrediction?: boolean;
}

export interface Contractor {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number; // 0 - 100
  totalProjectsAssigned: number;
  completedProjects: number;
  delayedProjectsCount: number;
  scheduleScore: number;
  qualityScore: number;
  budgetScore: number;
  reliabilityScore: number;
  overallScore: number;
}

export interface DocumentItem {
  id: string;
  projectId: string;
  title: string;
  category: 'Project Proposal' | 'Government Approval' | 'Tender Document' | 'Contract' | 'Work Order' | 'Inspection Report' | 'Bills & Invoices' | 'Completion Certificate';
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'JPG';
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  version: string;
  fileUrl: string;
}

export interface AIRiskFactor {
  category: 'Schedule Risk' | 'Budget Risk' | 'Contractor Risk' | 'Procurement Risk' | 'Approval Risk' | 'Site Risk' | 'Quality Risk';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number; // 0 - 100
  details: string;
}

export interface AIDelayPrediction {
  delayProbability: number; // 0 - 100%
  riskLevel: RiskLevel;
  predictedDelayDays: number;
  expectedCompletionDate: string;
  revisedCompletionDate: string;
  explanation: string;
  riskFactors: AIRiskFactor[];
  recommendations: string[];
}

export interface HealthScoreBreakdown {
  overall: number; // 0 - 100
  schedule: number;
  budget: number;
  quality: number;
  risk: number;
  contractor: number;
  statusText: string;
}

export interface Project {
  id: string;
  name: string;
  department: Department;
  projectType: ProjectType;
  description: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  managerName: string;
  projectManagerId?: string;
  fieldOfficerId?: string;
  contractorName: string;
  contractorId: string;
  projectId?: string;
  startDate: string;
  expectedCompletionDate: string;
  revisedCompletionDate?: string;
  totalBudgetCr: number; // in Crores INR
  allocatedBudgetCr: number;
  spentBudgetCr: number;
  expectedProgressPercentage: number;
  actualProgressPercentage: number;
  status: ProjectStatus;
  riskLevel: RiskLevel;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  objectives: string[];
  milestones: Milestone[];
  photographs: SitePhotograph[];
  issues: Issue[];
  fieldUpdates: FieldUpdate[];
  fieldInspections?: FieldInspection[];
  latestInspectionId?: string;
  latestInspectionDate?: string;
  fieldInspectionCount?: number;
  latestFieldRemarks?: string;
  lastFieldOfficerUpdate?: string;
  documents: DocumentItem[];
  healthScore: HealthScoreBreakdown;
  aiPrediction: AIDelayPrediction;
  lastUpdated: string;
}

export interface AlertNotification {
  id: string;
  projectId?: string;
  projectName?: string;
  inspectionId?: string;
  title: string;
  message: string;
  reason?: string;
  requiredAction?: string;
  targetRole?: UserRole;
  targetUserId?: string;
  projectManagerId?: string;
  severity: 'Critical' | 'Warning' | 'Info';
  alertSeverityLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  isRead: boolean;
  isResolved?: boolean;
  category: 'AI Delay' | 'Budget Exceeded' | 'Deadline Near' | 'Contractor Alert' | 'Field Update Overdue' | 'Issue Escalated';
}

export interface AuditLog {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  details: string;
}

export * from './database';
export * from './user';
export type { Task, BudgetTransaction, ProjectPhoto } from './project';
