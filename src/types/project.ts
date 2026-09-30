import { 
  UserRole, 
  ProjectStatus, 
  RiskLevel, 
  Department, 
  ProjectType, 
  Milestone, 
  SitePhotograph, 
  Issue, 
  FieldUpdate, 
  FieldInspection, 
  Contractor, 
  DocumentItem, 
  AIRiskFactor, 
  AIDelayPrediction, 
  HealthScoreBreakdown, 
  Project, 
  AlertNotification, 
  AuditLog 
} from './index';

export type {
  UserRole,
  ProjectStatus,
  RiskLevel,
  Department,
  ProjectType,
  Milestone,
  SitePhotograph,
  Issue,
  FieldUpdate,
  FieldInspection,
  Contractor,
  DocumentItem,
  AIRiskFactor,
  AIDelayPrediction,
  HealthScoreBreakdown,
  Project,
  AlertNotification,
  AuditLog
};

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  completedAt?: string;
}

export interface BudgetTransaction {
  id: string;
  projectId: string;
  transactionType: 'Allocation' | 'Expense' | 'Adjustment' | 'Payment';
  description: string;
  amount: number;
  transactionDate: string;
  category: string;
  createdBy?: string;
  createdAt: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  uploadedBy?: string;
  filePath: string;
  photoType: 'Before' | 'Progress' | 'After' | 'Inspection';
  description?: string;
  latitude?: number;
  longitude?: number;
  capturedAt: string;
  url?: string;
}
