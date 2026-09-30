import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateActionPlan } from '../services/aiEngine';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  AlertTriangle, 
  BrainCircuit, 
  Clock, 
  FileText, 
  Camera, 
  Users, 
  Activity, 
  Sparkles, 
  ArrowLeft, 
  Share2, 
  Download, 
  ShieldAlert,
  AlertCircle,
  FileCheck,
  CheckSquare,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getSignedInspectionPhotoUrl } from '../services/supabase/storageService';
import { fetchProfilesFromSupabase, fetchContractorsFromSupabase } from '../services/supabase/databaseService';
import { Department, ProjectType, ProjectStatus, RiskLevel } from '../types';

type Priority = 'High' | 'Medium' | 'Low' | 'Urgent';

/**
 * InspectionImage helper component to resolve signed URLs from private Supabase Storage
 */
const InspectionImage: React.FC<{ src?: string; alt?: string; className?: string }> = ({ src, alt, className }) => {
  const [resolvedUrl, setResolvedUrl] = React.useState<string>(src || '');

  React.useEffect(() => {
    if (!src) return;
    if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
      setResolvedUrl(src);
      return;
    }
    getSignedInspectionPhotoUrl(src, 3600).then(url => {
      if (url) setResolvedUrl(url);
    });
  }, [src]);

  return (
    <img 
      src={resolvedUrl || src} 
      alt={alt || 'Inspection Site Photo'} 
      className={className} 
    />
  );
};

export const ProjectDetailsView: React.FC = () => {
  const { selectedProjectId, projects, setSelectedProjectId, setActiveTab, resolveIssue, userRole, updateProject, deleteProject, contractors, auditLogs, inspections, markInspectionReviewed, clearInspection } = useApp();

  const project = projects.find(p => p.id === selectedProjectId) || projects[0];

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'ai-intelligence' | 'progress' | 'timeline' | 'issues' | 'site-photos' | 'documents' | 'contractor' | 'activity' | 'field-inspections'
  >(userRole === 'Project Manager' ? 'overview' : 'ai-intelligence');

  // Enforce PM cannot access AI sub-tab
  useEffect(() => {
    if (userRole === 'Project Manager' && activeSubTab === 'ai-intelligence') {
      setActiveSubTab('overview');
    }
  }, [userRole, activeSubTab]);

  const [actionPlanText, setActionPlanText] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50); // For Before/After photo comparison slider
  const [selectedInspModal, setSelectedInspModal] = useState<any>(null);

  // Administrator Edit & Delete State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDownloadCsv = () => {
    if (!project) return;
    const rows = [
      ['CityTrack AI — Project Dossier Report'],
      ['Project Name', `"${project.name}"`],
      ['Project ID', project.id],
      ['Department', `"${project.department}"`],
      ['Location', `"${project.location}"`],
      ['District', `"${project.district || 'Hyderabad'}"`],
      ['Status', project.status],
      ['Risk Level', project.riskLevel],
      ['Total Budget (Cr)', project.totalBudgetCr],
      ['Spent Budget (Cr)', project.spentBudgetCr],
      ['Actual Progress (%)', project.actualProgressPercentage],
      ['Expected Progress (%)', project.expectedProgressPercentage],
      ['AI Delay Probability (%)', project.aiPrediction?.delayProbability || 'N/A'],
      ['AI Delay Forecast (Days)', project.aiPrediction?.predictedDelayDays || 'N/A'],
      ['Project Manager', `"${project.managerName}"`],
      ['Contractor', `"${project.contractorName}"`],
      [],
      ['Milestones'],
      ['Name', 'Target Date', 'Actual Date', 'Status', 'Weight (%)'],
      ...(project.milestones || []).map(m => [`"${m.name}"`, m.targetDate, m.actualDate || 'Pending', m.status, m.weightPercentage]),
      [],
      ['Recent Field Inspections'],
      ['Officer', 'Date', 'Progress (%)', 'Status', 'Officer Remarks', 'Manager Remark'],
      ...(project.fieldInspections || []).map(i => [`"${i.officerName}"`, i.timestamp, i.progress, i.status || 'SUBMITTED', `"${i.remarks || ''}"`, `"${i.managerRemark || ''}"`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Project_Dossier_${project.projectId || project.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState<Department>('Municipal Administration (GHMC)');
  const [editType, setEditType] = useState<ProjectType>('Roads');
  const [editLoc, setEditLoc] = useState('');
  const [editBudget, setEditBudget] = useState(10);
  const [editSpent, setEditSpent] = useState(0);
  const [editDate, setEditDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('High');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('On Track');
  const [editDesc, setEditDesc] = useState('');
  const [editPmId, setEditPmId] = useState('');
  const [editFoId, setEditFoId] = useState('');
  const [editContractorId, setEditContractorId] = useState('');

  // Available profiles and contractors for dropdowns
  const [availablePMs, setAvailablePMs] = useState<any[]>([]);
  const [availableFOs, setAvailableFOs] = useState<any[]>([]);
  const [availableContractors, setAvailableContractors] = useState<any[]>([]);

  useEffect(() => {
    fetchProfilesFromSupabase('Project Manager').then(res => {
      if (res.data) setAvailablePMs(res.data);
    });
    fetchProfilesFromSupabase('Field Officer').then(res => {
      if (res.data) setAvailableFOs(res.data);
    });
    fetchContractorsFromSupabase().then(res => {
      if (res.data) setAvailableContractors(res.data);
    });
  }, []);

  const openEditModal = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDept(project.department);
    setEditType(project.projectType || 'Roads');
    setEditLoc(project.location);
    setEditBudget(project.totalBudgetCr);
    setEditSpent(project.spentBudgetCr);
    setEditDate(project.expectedCompletionDate);
    setEditPriority((project.priority as Priority) || 'High');
    setEditStatus(project.status || 'On Track');
    setEditDesc(project.description || '');
    setEditPmId(project.projectManagerId || '');
    setEditFoId(project.fieldOfficerId || '');
    setEditContractorId(project.contractorId || '');
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    const pmObj = availablePMs.find(p => p.id === editPmId);
    const foObj = availableFOs.find(f => f.id === editFoId);
    const cObj = availableContractors.find(c => c.id === editContractorId);

    const success = await updateProject(project.id, {
      name: editName,
      department: editDept,
      projectType: editType,
      location: editLoc,
      totalBudgetCr: Number(editBudget),
      spentBudgetCr: Number(editSpent),
      expectedCompletionDate: editDate,
      priority: editPriority,
      status: editStatus,
      description: editDesc,
      projectManagerId: editPmId || undefined,
      fieldOfficerId: editFoId || undefined,
      contractorId: editContractorId || undefined,
      managerName: pmObj ? pmObj.full_name : project.managerName,
      contractorName: cObj ? cObj.name : project.contractorName,
    });

    setIsSubmittingEdit(false);
    if (success) {
      setShowEditModal(false);
    } else {
      setEditError('Failed to update project in Supabase');
    }
  };

  const handleConfirmDelete = async () => {
    if (!project) return;
    setIsSubmittingDelete(true);
    setDeleteError(null);

    const res = await deleteProject(project.id);
    setIsSubmittingDelete(false);
    if (res.success) {
      setShowDeleteModal(false);
      setActiveTab('projects');
    } else {
      setDeleteError(res.error || 'Failed to delete project from Supabase');
    }
  };

  // Guard against missing/loading project
  if (!project) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl space-y-4 my-6">
        <div className="w-12 h-12 bg-blue-500/10 text-cyan-400 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white font-display">No Project Selected or Loading...</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The requested project record is currently loading from Supabase or was not found. Return to the Project Registry to view active projects.
        </p>
        <button
          onClick={() => {
            setSelectedProjectId(null);
            setActiveTab('projects');
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30"
        >
          Return to Project Registry
        </button>
      </div>
    );
  }

  // Line Chart Data for Expected vs Actual Progress
  const progressHistoryData = [
    { month: 'Jan 2026', expected: 15, actual: 15 },
    { month: 'Mar 2026', expected: 30, actual: 30 },
    { month: 'May 2026', expected: 45, actual: 42 },
    { month: 'Jul 2026', expected: 60, actual: 48 },
    { month: 'Sep 2026', expected: project?.expectedProgressPercentage || 50, actual: project?.actualProgressPercentage || 40 },
    { month: 'Nov 2026', expected: 100, actual: 82 },
  ];

  const handleGeneratePlan = () => {
    if (!project) return;
    const plan = generateActionPlan(project);
    setActionPlanText(plan);
  };

  const beforePhoto = project?.photographs?.find(p => p.phase === 'Before') || project?.photographs?.[0];
  const latestPhoto = project?.photographs?.find(p => p.phase === 'Latest') || project?.photographs?.[(project?.photographs?.length || 1) - 1];
  const projectInspections = (inspections || []).filter(
    i => (i.projectId === project?.id || i.projectId === project?.projectId) && i.status !== 'CLEARED'
  );

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            setSelectedProjectId(null);
            setActiveTab('projects');
          }}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects List</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Project Dossier</span>
          </button>

          {userRole === 'Administrator' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={openEditModal}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Project</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="font-mono text-cyan-400 font-semibold">{project.id}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{project.department}</span>
          </div>
        </div>
      </div>

      {/* Main Project Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                {project.id}
              </span>

              <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
                project.aiPrediction.riskLevel === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                project.aiPrediction.riskLevel === 'High' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                🤖 AI Delay Risk: {project.aiPrediction.delayProbability}% ({project.aiPrediction.riskLevel})
              </span>

              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Priority: {project.priority}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">{project.name}</h1>

            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{project.location}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Contractor: {project.contractorName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Target: {project.expectedCompletionDate}</span>
              </span>
            </p>
          </div>

          {/* Health Score & Key Progress Numbers */}
          <div className="flex items-center space-x-6 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="text-center border-r border-slate-800 pr-5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Score</span>
              <span className="text-2xl font-black font-display text-amber-400">{project.healthScore.overall} / 100</span>
              <span className="text-[10px] text-slate-400 block">{project.healthScore.statusText}</span>
            </div>

            <div className="text-center border-r border-slate-800 pr-5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Physical Progress</span>
              <span className="text-2xl font-black font-display text-cyan-400">{project.actualProgressPercentage}%</span>
              <span className="text-[10px] text-rose-400 block">Target: {project.expectedProgressPercentage}%</span>
            </div>

            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Budget Spent</span>
              <span className="text-2xl font-black font-display text-emerald-400">₹{project.spentBudgetCr} Cr</span>
              <span className="text-[10px] text-slate-400 block">Total: ₹{project.totalBudgetCr} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sub-Tabs Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-lg overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {[
            ...(userRole !== 'Project Manager' ? [{ id: 'ai-intelligence', label: 'AI Delay Prediction', icon: BrainCircuit, highlight: true }] : []),
            ...(userRole !== 'Contractor' ? [{ id: 'field-inspections', label: `Field Inspections (${projectInspections.length})`, icon: FileCheck }] : []),
            { id: 'overview', label: 'Project Summary', icon: Building2 },
            { id: 'progress', label: 'Physical vs Budget Progress', icon: Activity },
            { id: 'timeline', label: `Milestones (${project.milestones.length})`, icon: Calendar },
            { id: 'issues', label: `Issues (${project.issues.length})`, icon: AlertTriangle },
            { id: 'site-photos', label: `Site Photos (${project.photographs.length})`, icon: Camera },
            { id: 'documents', label: `Documents (${project.documents.length})`, icon: FileText },
            { id: 'contractor', label: 'Contractor Info', icon: Users },
            { id: 'activity', label: 'Activity Log', icon: Clock },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
                  isActive
                    ? tab.highlight 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: AI INTELLIGENCE & DELAY PREDICTION */}
      {activeSubTab === 'ai-intelligence' && userRole !== 'Project Manager' && (
        <div className="space-y-6">
          
          {/* Main AI Forecast Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-5 h-5 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    CityTrack AI Prediction & Risk Engine
                  </span>
                </div>
                <h2 className="text-2xl font-black font-display text-white">
                  {project.aiPrediction.delayProbability}% Probability of Delay — {project.aiPrediction.riskLevel.toUpperCase()} RISK
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {project.aiPrediction.explanation}
                </p>
              </div>

              <div className="flex items-center space-x-4 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Predicted Delay</span>
                  <span className="text-3xl font-black text-rose-400 font-display">+{project.aiPrediction.predictedDelayDays} Days</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Revised Completion</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{project.aiPrediction.revisedCompletionDate}</span>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI Prediction generated using 12 telemetry risk variables</span>
              </div>
              <button
                onClick={handleGeneratePlan}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Generate Executive Action Plan</span>
              </button>
            </div>
          </div>

          {/* Render Action Plan Document if Generated */}
          {actionPlanText && (
            <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Generated Action Plan & Protocol
                  </span>
                </div>
                <button
                  onClick={() => setActionPlanText(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Plan
                </button>
              </div>
              <pre className="text-xs font-mono text-cyan-200 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-slate-900 p-4 rounded-xl border border-slate-800">
                {actionPlanText}
              </pre>
            </div>
          )}

          {/* 7-Dimension Risk Breakdown Cards */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
              7-Dimension AI Risk Factor Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.aiPrediction.riskFactors.map((rf, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{rf.category}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      rf.riskLevel === 'HIGH' || rf.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      rf.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {rf.riskLevel} ({rf.score}/100)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        rf.riskLevel === 'HIGH' || rf.riskLevel === 'CRITICAL' ? 'bg-rose-500' :
                        rf.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${rf.score}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{rf.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable AI Recommendations List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-4 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Actionable Recommendations</span>
            </h3>

            <div className="space-y-3">
              {project.aiPrediction.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">Project Description & Scope</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{project.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Key Project Objectives</h3>
              <div className="space-y-2">
                {project.objectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Start Date</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{project.startDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expected Completion</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{project.expectedCompletionDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Assigned Engineer</span>
                <span className="text-xs font-bold text-slate-200">{project.managerName}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
              Financial Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Sanctioned Budget:</span>
                <span className="font-bold text-white">₹{project.totalBudgetCr} Cr</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Allocated Funds:</span>
                <span className="font-bold text-slate-200">₹{project.allocatedBudgetCr} Cr</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Disbursed Expenditure:</span>
                <span className="font-bold text-emerald-400">₹{project.spentBudgetCr} Cr</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Remaining Balance:</span>
                <span className="font-bold text-slate-300">₹{(project.totalBudgetCr - project.spentBudgetCr).toFixed(2)} Cr</span>
              </div>
            </div>

            <div className="pt-3">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1">Budget Utilization Rate</span>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full" 
                  style={{ width: `${(project.spentBudgetCr / project.totalBudgetCr) * 100}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {Math.round((project.spentBudgetCr / project.totalBudgetCr) * 100)}% utilized vs {project.actualProgressPercentage}% physical completion
              </span>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: PROGRESS TRACKING */}
      {activeSubTab === 'progress' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold font-display text-white">Planned vs Actual Progress Trajectory</h2>
              <p className="text-xs text-slate-400">Tracking schedule variance over project lifecycle</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="text-emerald-400">Expected Progress: {project.expectedProgressPercentage}%</span>
              <span className="text-rose-400">Actual Progress: {project.actualProgressPercentage}%</span>
              <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                Variance: {project.actualProgressPercentage - project.expectedProgressPercentage}%
              </span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressHistoryData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="expected" name="Expected Baseline %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="actual" name="Actual Physical %" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
            <strong className="text-cyan-400">Schedule Variance Alert:</strong> Project is currently {Math.abs(project.actualProgressPercentage - project.expectedProgressPercentage)}% behind schedule. Sub-base compaction stage has been prolonged due to material delivery bottlenecks.
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TIMELINE & MILESTONES */}
      {activeSubTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold font-display text-white">Milestone Execution Sequence</h2>
            <span className="text-xs text-slate-400 font-mono">
              {project.milestones.filter(m => m.status === 'Completed').length} of {project.milestones.length} Milestones Completed
            </span>
          </div>

          <div className="space-y-4">
            {project.milestones.map((m, idx) => (
              <div 
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  m.status === 'Overdue' ? 'bg-rose-950/20 border-rose-500/40' :
                  m.status === 'Completed' ? 'bg-emerald-950/10 border-emerald-500/30' :
                  m.status === 'In Progress' ? 'bg-blue-950/20 border-blue-500/30' :
                  'bg-slate-950/50 border-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    m.status === 'Completed' ? 'bg-emerald-500 text-slate-950' :
                    m.status === 'Overdue' ? 'bg-rose-500 text-white animate-pulse' :
                    m.status === 'In Progress' ? 'bg-blue-600 text-white' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{m.name}</h4>
                    <p className="text-xs text-slate-400">Category: {m.category} • Weight: {m.weightPercentage}%</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target Date</span>
                    <span className="font-mono font-bold text-slate-200">{m.targetDate}</span>
                  </div>
                  {m.actualDate && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Actual Date</span>
                      <span className="font-mono font-bold text-emerald-400">{m.actualDate}</span>
                    </div>
                  )}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    m.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    m.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
                    m.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SITE PHOTOS & BEFORE/AFTER SLIDER */}
      {activeSubTab === 'site-photos' && (
        <div className="space-y-6">
          
          {/* Interactive Before & After Slider */}
          {beforePhoto && latestPhoto && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Interactive Before vs Latest Progress Comparison</span>
                  </h3>
                  <p className="text-xs text-slate-400">Drag slider to visually compare initial site condition against latest inspection</p>
                </div>
              </div>

              {/* Before/After Image Slider Container */}
              <div className="relative w-full h-[400px] rounded-2xl overflow-hidden select-none border border-slate-700 shadow-2xl">
                
                {/* Background Image (Latest Progress) */}
                <img
                  src={latestPhoto.url}
                  alt="Latest Progress"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-bold text-cyan-400">
                  LATEST PROGRESS ({latestPhoto.stageTag})
                </div>

                {/* Foreground Image (Before) clipped by sliderPos */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={beforePhoto.url}
                    alt="Before Baseline"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: '100%', maxWidth: 'none' }}
                  />
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-bold text-slate-300">
                    INITIAL BASELINE SITE ({beforePhoto.stageTag})
                  </div>
                </div>

                {/* Slider Handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize z-20 flex items-center justify-center"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white">
                    ↔
                  </div>
                </div>

                {/* Invisible Range Input Slider overlay */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                />
              </div>

            </div>
          )}

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.photographs.map((photo) => (
              <div key={photo.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-2 p-3">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400">{photo.uploadedAt}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{photo.phase}</span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-1">{photo.caption}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Uploaded by {photo.uploadedBy}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB-TAB 6: ISSUES TRACKER */}
      {activeSubTab === 'issues' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold font-display text-white">Active Issue & Escalation Log</h2>
              <p className="text-xs text-slate-400">Reported site bottlenecks and resolution workflow</p>
            </div>
          </div>

          <div className="space-y-3">
            {project.issues.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-xs">No active issues recorded for this project.</p>
            ) : (
              project.issues.map((iss) => (
                <div key={iss.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">{iss.id}</span>
                      <span className="text-xs font-bold text-white">{iss.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        iss.severity === 'Critical' || iss.severity === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {iss.severity} Severity
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        iss.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        iss.status === 'Escalated' ? 'bg-rose-500/20 text-rose-300 animate-pulse' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {iss.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{iss.description}</p>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span>Reported by {iss.reportedBy} on {iss.reportedAt}</span>
                    {iss.status !== 'Resolved' && (userRole === 'Administrator' || userRole === 'Project Manager') && (
                      <button
                        onClick={() => resolveIssue(iss.id, 'Resolved after site inspection and supplier expedite.')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold font-display text-white">Project Documents & Sanctions</h2>
              <p className="text-xs text-slate-400">Technical sanctions, contract agreements, DPRs, and compliance certificates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(project.documents && project.documents.length > 0) ? (
              project.documents.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-white line-clamp-1">{doc.title}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{doc.category}</span>
                      <span>{doc.fileSize || '1.2 MB'}</span>
                      <span>Uploaded {doc.uploadedAt}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">By: {doc.uploadedBy}</span>
                  </div>
                  <a
                    href={doc.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors shrink-0"
                    title="View Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-500 text-xs">
                No documents uploaded yet for this infrastructure project.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: CONTRACTOR INFO */}
      {activeSubTab === 'contractor' && (() => {
        const contractor: any = contractors.find(c => c.id === project.contractorId || c.name?.includes(project.contractorName)) || {
          id: project.contractorId || 'CON-001',
          code: project.contractorId || 'CON-001',
          name: project.contractorName || 'Metro Infrastructure Pvt Ltd',
          companyName: project.contractorName || 'Metro Infrastructure Pvt Ltd',
          email: 'contractor@citytrack.ai',
          phone: '+91 98480 12345',
          address: 'Road No 36, Jubilee Hills, Hyderabad',
          rating: 84,
          scheduleScore: 78,
          qualityScore: 88,
          budgetScore: 82,
          reliabilityScore: 85,
          overallScore: 84
        };

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-display text-white">{contractor.name}</h2>
                  <p className="text-xs text-slate-400">{contractor.companyName || contractor.name} • Code: {contractor.code || contractor.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Overall Rating:</span>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/30">
                  {contractor.rating || contractor.overallScore || 80} / 100
                </span>
              </div>
            </div>

            {/* Performance KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'Schedule Adherence', score: contractor.scheduleScore || 75 },
                { label: 'Civil Quality', score: contractor.qualityScore || 85 },
                { label: 'Budget Management', score: contractor.budgetScore || 80 },
                { label: 'Reliability', score: contractor.reliabilityScore || 82 },
                { label: 'Overall Score', score: contractor.overallScore || contractor.rating || 84 }
              ].map((metric, i) => (
                <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">{metric.label}</span>
                  <span className="text-xl font-black font-display text-cyan-400">{metric.score}%</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-cyan-500 h-full" style={{ width: `${metric.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact & Registration Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Contact Email</span>
                <span className="text-slate-200 font-mono">{contractor.email || 'contractor@citytrack.ai'}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Telephone</span>
                <span className="text-slate-200 font-mono">{contractor.phone || '+91 98480 12345'}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Office Address</span>
                <span className="text-slate-200">{contractor.address || contractor.contactPerson || 'Hyderabad Regional Office'}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB: ACTIVITY LOG */}
      {activeSubTab === 'activity' && (() => {
        const projectLogs = auditLogs.filter(l => 
          l.projectId === project.id || 
          l.projectName === project.name || 
          (l.details && l.details.includes(project.id))
        );

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold font-display text-white">Project Activity & Audit Trail</h2>
                <p className="text-xs text-slate-400">Timestamped record of administrative and field updates</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {projectLogs.length} Events Logged
              </span>
            </div>

            <div className="space-y-3">
              {projectLogs.length === 0 ? (
                <p className="text-center py-8 text-slate-500 text-xs">No activity logs recorded yet for this project.</p>
              ) : (
                projectLogs.map(log => (
                  <div key={log.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">{log.role}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300">{log.details}</p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500 pt-1">
                      <span>User: {log.user}</span>
                      <span>Device: {log.device}</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB: FIELD INSPECTIONS REPORT */}
      {activeSubTab === 'field-inspections' && (() => {
        const displayInspections = projectInspections;

        if (displayInspections.length === 0) {
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                <FileCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Field Inspection Reports</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are no active field inspection reports submitted for this project. Inspections submitted by Field Officers will appear here.
                </p>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
                Total Reports: 0
              </div>
            </div>
          );
        }

        // SECTION 21: Progress Trend Chart Data
        const trendData = displayInspections.slice().reverse().map(insp => ({
          date: insp.timestamp.split(',')[0] || insp.timestamp,
          progress: insp.progress,
          aiProgress: insp.aiVisualProgress,
          delayProb: insp.aiDelayProbability
        }));

        return (
          <div className="space-y-6">
            
            {/* SECTION 21: PROGRESS TREND CHART */}
            {trendData.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold font-display text-white">Inspection Progress & Delay Risk Trend</h3>
                    <p className="text-xs text-slate-400">Historical Field Inspection Date vs Actual Progress & AI Delay Risk</p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                    {displayInspections.length} Inspection Log(s)
                  </span>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="progress" name="Actual Progress %" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="aiProgress" name="AI Visual Progress %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="delayProb" name="AI Delay Risk %" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* SECTION 1 - 3: FIELD INSPECTION REPORTS LIST */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold font-display text-white">Field Officer Inspection Reports — {project.name}</h2>
                  <p className="text-xs text-slate-400">Field inspections submitted for {project.name} ({project.id})</p>
                </div>
              </div>

              <div className="space-y-3">
                {displayInspections.map((insp: any, index: number) => {
                  const isUnread = !insp.managerViewed;
                  return (
                    <div 
                      key={insp.id || index} 
                      className={`p-4 rounded-xl border transition-all ${
                        isUnread ? 'bg-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-500/5' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {isUnread && (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                                NEW
                              </span>
                            )}
                            <span className="text-xs font-mono text-cyan-400 font-bold">{insp.id || insp.inspectionId}</span>
                            <span className="text-xs font-semibold text-white">• {insp.projectName}</span>
                          </div>

                          <p className="text-xs text-slate-200 line-clamp-1 font-medium">
                            "{insp.officerRemarks || insp.remarks}"
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                            <span>Field Officer: <strong className="text-slate-200">{insp.officerName}</strong></span>
                            <span>Date: <strong className="text-slate-200">{insp.timestamp}</strong></span>
                            <span>Actual Progress: <strong className="text-cyan-400">{insp.progress}%</strong></span>
                            <span>AI Visual: <strong className="text-emerald-400">{insp.aiVisualProgress}%</strong></span>
                            <span>Delay Probability: <strong className="text-amber-400">{insp.aiDelayProbability}%</strong></span>
                            <span>Status: <strong className={insp.status === 'REVIEWED' ? 'text-emerald-400' : 'text-blue-400'}>{insp.status || (insp.managerViewed ? 'REVIEWED' : 'SUBMITTED')}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                            insp.aiRiskLevel === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                            insp.aiRiskLevel === 'High' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          }`}>
                            {insp.aiRiskLevel ? insp.aiRiskLevel.toUpperCase() : 'HIGH'}
                          </span>

                          <button
                            onClick={() => setSelectedInspModal(insp)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1"
                          >
                            <span>View Details</span>
                            <FileCheck className="w-3.5 h-3.5" />
                          </button>

                          {insp.status === 'REVIEWED' && (userRole === 'Project Manager' || userRole === 'Administrator') && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const success = await clearInspection(insp.id || insp.inspectionId);
                                if (success && selectedInspModal?.id === (insp.id || insp.inspectionId)) {
                                  setSelectedInspModal(null);
                                }
                              }}
                              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1"
                              title="Clear reviewed inspection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Clear</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })()}

      {/* SECTION 4 - 22: Detailed View Inspection Modal in Project Details */}
      {selectedInspModal && (() => {
        const isHighOrCriticalRisk = selectedInspModal.aiRiskLevel === 'High' || selectedInspModal.aiRiskLevel === 'Critical';

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-scale-up text-slate-100">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                      FIELD INSPECTION REPORT
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedInspModal.timestamp}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      selectedInspModal.status === 'REVIEWED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      STATUS: {selectedInspModal.status || 'SUBMITTED'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-display text-white mt-1">
                    {selectedInspModal.projectName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Project ID: <strong className="text-cyan-400 font-mono">{selectedInspModal.projectId}</strong> • {selectedInspModal.projectLocation || project.location}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedInspModal(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700"
                >
                  Close Report
                </button>
              </div>

              {/* HIGH / CRITICAL ALERT BANNER */}
              {isHighOrCriticalRisk && (
                <div className="p-4 bg-rose-950/50 border-2 border-rose-500/60 rounded-xl shadow-lg flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                        ⚠️ {selectedInspModal.aiRiskLevel.toUpperCase()} DELAY RISK ALERT
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded">
                        +{selectedInspModal.predictedDelayDays} DAYS PREDICTED DELAY
                      </span>
                    </div>
                    <p className="text-xs text-rose-200 leading-relaxed font-medium">
                      This project is currently showing a high probability ({selectedInspModal.aiDelayProbability}%) of schedule delay. Immediate site intervention and contractor review is recommended.
                    </p>
                  </div>
                </div>
              )}

              {/* PROJECT INFORMATION */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-display flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>PROJECT INFORMATION</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Project Name</span>
                    <span className="font-bold text-white">{project.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Project Location</span>
                    <span className="font-semibold text-slate-200">{project.location}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Contractor</span>
                    <span className="font-bold text-slate-200">{project.contractorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Contractor Performance</span>
                    <span className="font-bold text-emerald-400">78 / 100 Score</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expected Progress</span>
                    <span className="font-bold text-slate-200">{project.expectedProgressPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Actual Progress</span>
                    <span className="font-bold text-cyan-400">{selectedInspModal.progress}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Budget</span>
                    <span className="font-bold text-slate-200">₹{project.totalBudgetCr} Cr</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Budget Utilization</span>
                    <span className="font-bold text-amber-400">
                      {Math.round((project.spentBudgetCr / project.totalBudgetCr) * 100)}% (₹{project.spentBudgetCr} Cr spent)
                    </span>
                  </div>
                </div>
              </div>

              {/* FIELD OFFICER INFORMATION */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>FIELD OFFICER INFORMATION</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Submitted By</span>
                    <span className="font-bold text-white">{selectedInspModal.officerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Officer ID</span>
                    <span className="font-mono text-cyan-400 font-semibold">{selectedInspModal.officerId || 'OFF-HYD-042'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Inspection Date</span>
                    <span className="font-mono text-slate-200">{selectedInspModal.timestamp.split(',')[0]}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Inspection Time</span>
                    <span className="font-mono text-slate-200">{selectedInspModal.timestamp.split(',')[1] || '14:30 IST'}</span>
                  </div>
                </div>
              </div>

              {/* SITE PHOTOS (Contractor restricted) */}
              {userRole !== 'Contractor' && (selectedInspModal.afterImageReference || selectedInspModal.beforeImageReference || selectedInspModal.currentImageUrl) && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>CONSTRUCTION SITE PHOTOGRAPHS</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedInspModal.beforeImageReference && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Before Photo (Baseline)</span>
                        <InspectionImage 
                          src={selectedInspModal.beforeImageReference} 
                          alt="Before Photo" 
                          className="h-48 w-full object-cover rounded-xl border border-slate-800 shadow"
                        />
                      </div>
                    )}
                    {(selectedInspModal.afterImageReference || selectedInspModal.currentImageUrl) && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Current Construction Photo</span>
                        <InspectionImage 
                          src={selectedInspModal.afterImageReference || selectedInspModal.currentImageUrl} 
                          alt="Current Photo" 
                          className="h-48 w-full object-cover rounded-xl border border-slate-800 shadow"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI PHOTO ANALYSIS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-display flex items-center space-x-1.5">
                    <BrainCircuit className="w-4 h-4 text-cyan-400" />
                    <span>AI PHOTO ANALYSIS (SITE OBSERVATIONS)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Confidence: {selectedInspModal.visualAnalysisConfidence || 'HIGH'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">Construction Activity:</span>
                    <p className="text-slate-200 mt-0.5">{selectedInspModal.constructionActivity || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">Visible Work:</span>
                    <p className="text-slate-200 mt-0.5">{selectedInspModal.visibleWork || selectedInspModal.constructionActivity || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">Workers & Equipment:</span>
                    <p className="text-slate-200 mt-0.5">{selectedInspModal.workersEquipment || 'None reported'}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">Materials Observed:</span>
                    <p className="text-slate-200 mt-0.5">{selectedInspModal.materials || 'None recorded'}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">Site Condition:</span>
                    <p className="text-slate-200 mt-0.5">{selectedInspModal.siteCondition || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-amber-400 font-bold block">Safety / Quality Concerns:</span>
                    <p className="text-slate-200 mt-0.5">{selectedInspModal.safetyQualityConcerns || 'No safety or quality issues reported.'}</p>
                  </div>
                </div>
              </div>

              {/* AI RISK ANALYSIS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-display flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>AI PROJECT RISK ANALYSIS</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Actual Progress</span>
                    <span className="text-2xl font-black text-cyan-400 font-display">{selectedInspModal.progress}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">AI Visual Progress</span>
                    <span className="text-2xl font-black text-emerald-400 font-display">{selectedInspModal.aiVisualProgress}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">AI Delay Probability</span>
                    <span className="text-2xl font-black text-amber-400 font-display">{selectedInspModal.aiDelayProbability}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Risk Level</span>
                    <span className={`text-xl font-black font-display ${
                      selectedInspModal.aiRiskLevel === 'Critical' ? 'text-rose-400' :
                      selectedInspModal.aiRiskLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {selectedInspModal.aiRiskLevel ? selectedInspModal.aiRiskLevel.toUpperCase() : 'HIGH'}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Predicted Delay</span>
                    <span className="text-2xl font-black text-rose-400 font-display">+{selectedInspModal.predictedDelayDays} Days</span>
                  </div>
                </div>
              </div>

              {/* AI EXPLANATION */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  AI Explanation
                </span>
                <p className="text-slate-200 leading-relaxed italic bg-slate-900 p-3 rounded-lg border border-slate-800">
                  "{selectedInspModal.aiExplanation}"
                </p>
              </div>

              {/* AI REMARKS VS OFFICER REMARKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block flex items-center space-x-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Generated Remarks (Original Suggestion)</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {selectedInspModal.aiGeneratedRemarks || selectedInspModal.remarks}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Officer Submitted Remarks (Final Officer Entry)</span>
                  </span>
                  <p className="text-white leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 font-medium">
                    "{selectedInspModal.officerRemarks || selectedInspModal.remarks}"
                  </p>
                </div>
              </div>

              {/* RECOMMENDATIONS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  AI Actionable Recommendations
                </span>
                <div className="space-y-1.5">
                  {(selectedInspModal.aiRecommendations || []).map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2 text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{idx + 1}. {rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                <div className="flex items-center space-x-2">
                  {(userRole === 'Project Manager' || userRole === 'Administrator') && (
                    selectedInspModal.status !== 'REVIEWED' ? (
                      <button
                        onClick={async () => {
                          const success = await markInspectionReviewed(selectedInspModal.id || selectedInspModal.inspectionId);
                          if (success) {
                            setSelectedInspModal((prev: any) => prev ? { ...prev, status: 'REVIEWED' } : null);
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark as Reviewed</span>
                      </button>
                    ) : (
                      <>
                        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-black uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>STATUS: REVIEWED</span>
                        </div>
                        <button
                          onClick={async () => {
                            const success = await clearInspection(selectedInspModal.id || selectedInspModal.inspectionId);
                            if (success) {
                              setSelectedInspModal(null);
                            }
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center space-x-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Clear</span>
                        </button>
                      </>
                    )
                  )}
                </div>

                <button
                  onClick={() => setSelectedInspModal(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700"
                >
                  Close Inspection Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL: Administrator Edit Project Modal */}
      {showEditModal && userRole === 'Administrator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto animate-scale-up text-slate-100">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Edit Project Registry</h3>
                  <p className="text-xs text-slate-400">Update project details, assignees, and timeline</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Project Name *</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                  <select 
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value as Department)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Municipal Administration (GHMC)">Municipal Administration (GHMC)</option>
                    <option value="Water Supply & Sewerage (HMWSSB)">Water Supply & Sewerage (HMWSSB)</option>
                    <option value="Roads & Buildings (R&B)">Roads & Buildings (R&B)</option>
                    <option value="Energy & Electrical">Energy & Electrical</option>
                    <option value="Health & Medical Infrastructure">Health & Medical Infrastructure</option>
                    <option value="Hyderabad Metro Rail (HMR)">Hyderabad Metro Rail (HMR)</option>
                    <option value="School Education Infrastructure">School Education Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Project Type</label>
                  <select 
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ProjectType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Roads">Roads</option>
                    <option value="Bridges & Flyovers">Bridges & Flyovers</option>
                    <option value="Hospitals">Hospitals</option>
                    <option value="Schools">Schools</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Drainage">Drainage</option>
                    <option value="Public Buildings">Public Buildings</option>
                    <option value="Smart Lighting">Smart Lighting</option>
                    <option value="Waste Management">Waste Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Location *</label>
                  <input 
                    type="text" 
                    required
                    value={editLoc}
                    onChange={(e) => setEditLoc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Target Completion Date *</label>
                  <input 
                    type="date" 
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Total Budget (₹ Cr) *</label>
                  <input 
                    type="number" 
                    required
                    step="0.1"
                    min="0"
                    value={editBudget}
                    onChange={(e) => setEditBudget(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Spent Budget (₹ Cr)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={editSpent}
                    onChange={(e) => setEditSpent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                  <select 
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Project Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Critical">Critical</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assignment Controls */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 block uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Assign Project Roles (Supabase Profiles)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Project Manager</label>
                    <select
                      value={editPmId}
                      onChange={(e) => setEditPmId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      {availablePMs.map(pm => (
                        <option key={pm.id} value={pm.id}>
                          {pm.full_name} ({pm.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Field Officer</label>
                    <select
                      value={editFoId}
                      onChange={(e) => setEditFoId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      {availableFOs.map(fo => (
                        <option key={fo.id} value={fo.id}>
                          {fo.full_name} ({fo.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Contractor</label>
                    <select
                      value={editContractorId}
                      onChange={(e) => setEditContractorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Unassigned</option>
                      {availableContractors.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1"
                >
                  {isSubmittingEdit ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Updating Supabase...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: Administrator Delete Confirmation Dialog */}
      {showDeleteModal && userRole === 'Administrator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-scale-up text-slate-100">
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Delete Infrastructure Project</h3>
                <p className="text-xs text-slate-400">Irreversible Administrator Operation</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mb-4">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target Project</span>
              <p className="text-sm font-bold text-white">{project.name}</p>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">UUID:</span>
                <span className="font-mono text-cyan-400 text-[11px] select-all">{project.id}</span>
              </div>
            </div>

            <p className="text-xs text-rose-300 leading-relaxed mb-4">
              Warning: Deleting this project will remove its master registry record and associated child tracking rows from Supabase PostgreSQL. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDelete}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5"
              >
                {isSubmittingDelete ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Deleting from Supabase...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Executive Project Dossier & Export Report */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto text-slate-100 print:border-none print:shadow-none print:max-w-none print:w-full print:bg-white print:text-black">
            
            {/* Header / Report Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4 print:border-b-2 print:border-black">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30 print:border-black print:text-black">
                    OFFICIAL INFRASTRUCTURE DOSSIER
                  </span>
                  <span className="text-xs font-mono text-slate-400 print:text-gray-600">
                    Generated: {new Date().toLocaleString('en-IN')}
                  </span>
                </div>
                <h2 className="text-2xl font-black font-display text-white mt-1 print:text-black">
                  {project.name}
                </h2>
                <p className="text-xs text-slate-400 print:text-gray-600">
                  Project Code: <strong className="font-mono text-cyan-400 print:text-black">{project.projectId || project.id}</strong> • Department: {project.department}
                </p>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Content Body */}
            <div className="space-y-6 pt-6 print:space-y-4">
              
              {/* SECTION 1: MASTER SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs print:bg-gray-50 print:border-gray-300">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
                  <span className="font-bold text-white print:text-black">{project.location}, {project.district || 'Hyderabad'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Execution Status</span>
                  <span className="font-bold text-cyan-400 print:text-black">{project.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Risk Level</span>
                  <span className={`font-bold ${
                    project.riskLevel === 'Critical' ? 'text-rose-400' :
                    project.riskLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'
                  } print:text-black`}>
                    {project.riskLevel} ({project.aiPrediction?.delayProbability || 78}% Delay Prob.)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Completion</span>
                  <span className="font-mono font-bold text-white print:text-black">{project.expectedCompletionDate}</span>
                </div>
              </div>

              {/* SECTION 2: FINANCIAL & PHYSICAL PROGRESS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Financial Audit (INR)</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Sanctioned Outlay: <strong className="text-white print:text-black">₹{project.totalBudgetCr} Cr</strong></div>
                    <div>Allocated Outlay: <strong className="text-white print:text-black">₹{project.allocatedBudgetCr} Cr</strong></div>
                    <div>Disbursed Expenditure: <strong className="text-emerald-400 print:text-black">₹{project.spentBudgetCr} Cr</strong></div>
                    <div>Remaining Balance: <strong className="text-slate-300 print:text-black">₹{(project.totalBudgetCr - project.spentBudgetCr).toFixed(2)} Cr</strong></div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Physical Schedule Metrics</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Expected Milestone: <strong className="text-white print:text-black">{project.expectedProgressPercentage}%</strong></div>
                    <div>Actual Physical Completion: <strong className="text-cyan-400 print:text-black">{project.actualProgressPercentage}%</strong></div>
                    <div>Schedule Variance: <strong className="text-rose-400 print:text-black">{project.actualProgressPercentage - project.expectedProgressPercentage}%</strong></div>
                    <div>Predicted Delay: <strong className="text-rose-400 print:text-black">+{project.aiPrediction?.predictedDelayDays || 18} Days</strong></div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: KEY ROLES */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs print:bg-gray-50 print:border-gray-300">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Assigned Stakeholders & Contractors</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>Project Manager: <strong className="text-white print:text-black block">{project.managerName}</strong></div>
                  <div>Contractor Entity: <strong className="text-white print:text-black block">{project.contractorName}</strong></div>
                  <div>Contractor Code: <strong className="font-mono text-cyan-400 print:text-black block">{project.contractorId || 'CON-001'}</strong></div>
                </div>
              </div>

              {/* SECTION 4: MILESTONES TABLE */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">Milestone Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-200 print:text-black border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 print:border-gray-400 print:text-black">
                        <th className="py-2 pr-3">Milestone Name</th>
                        <th className="py-2 px-3">Target Date</th>
                        <th className="py-2 px-3">Actual Date</th>
                        <th className="py-2 px-3">Weight</th>
                        <th className="py-2 pl-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                      {(project.milestones || []).map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/40">
                          <td className="py-2 pr-3 font-medium text-white print:text-black">{m.name}</td>
                          <td className="py-2 px-3 font-mono">{m.targetDate}</td>
                          <td className="py-2 px-3 font-mono">{m.actualDate || '—'}</td>
                          <td className="py-2 px-3">{m.weightPercentage}%</td>
                          <td className="py-2 pl-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
                              m.status === 'Overdue' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-300'
                            } print:text-black print:bg-transparent`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5: RECENT FIELD INSPECTIONS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">Field Inspections & PM Reviews</h4>
                <div className="space-y-2">
                  {(project.fieldInspections && project.fieldInspections.length > 0) ? (
                    project.fieldInspections.slice(0, 3).map((insp, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 print:bg-gray-50 print:border-gray-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white print:text-black">Officer: {insp.officerName} ({insp.timestamp})</span>
                          <span className="font-bold text-cyan-400 print:text-black">Status: {insp.status || 'SUBMITTED'}</span>
                        </div>
                        <p className="text-slate-300 print:text-black">Officer Remark: "{insp.remarks}"</p>
                        {insp.managerRemark && (
                          <p className="text-emerald-400 print:text-black">PM Review Remark: "{insp.managerRemark}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs py-2">No recent field inspections recorded.</p>
                  )}
                </div>
              </div>

              {/* SECTION 6: AI DELAY EXPLANATION */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs space-y-1 print:bg-gray-50 print:border-gray-400">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block print:text-black">
                  AI Forensic Risk Assessment
                </span>
                <p className="text-rose-200 print:text-black italic leading-relaxed">
                  "{project.aiPrediction?.explanation || 'Statistical pacing calculation active.'}"
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 print:border-gray-400">
              <span>CityTrack AI Platform • Official Governance Registry</span>
              <span>Confidential & Proprietary State Data</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
