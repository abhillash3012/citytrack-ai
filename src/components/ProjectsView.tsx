import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  MapPin, 
  Calendar, 
  IndianRupee,
  Edit3,
  Trash2,
  Shield,
  Users,
  Tag,
  Phone,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import { Project, Department, ProjectType, ProjectStatus, RiskLevel } from '../types';
import { fetchProfilesFromSupabase, fetchContractorsFromSupabase } from '../services/supabase/databaseService';

export const ProjectsView: React.FC = () => {
  const { 
    projects, 
    setSelectedProjectId, 
    filterDepartment, 
    setFilterDepartment,
    filterStatus, 
    setFilterStatus,
    filterRisk, 
    setFilterRisk,
    createNewProject,
    updateProject,
    renameProject,
    deleteProject,
    userRole
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Available profiles and contractors for assignment dropdowns
  const [availablePMs, setAvailablePMs] = useState<any[]>([]);
  const [availableFOs, setAvailableFOs] = useState<any[]>([]);
  const [availableContractors, setAvailableContractors] = useState<any[]>([]);

  useEffect(() => {
    fetchProfilesFromSupabase('Project Manager').then(res => {
      if (res.data && res.data.length > 0) {
        setAvailablePMs(res.data);
        setNewPmId(prev => prev || res.data[0].id);
      }
    });
    fetchProfilesFromSupabase('Field Officer').then(res => {
      if (res.data && res.data.length > 0) {
        setAvailableFOs(res.data);
        setNewFoId(prev => prev || res.data[0].id);
      }
    });
    fetchContractorsFromSupabase().then(res => {
      if (res.data && res.data.length > 0) {
        setAvailableContractors(res.data);
        setNewContractorId(prev => prev || res.data[0].id);
      }
    });
  }, []);

  // 9-Section New Project Form State
  // 1. PROJECT INFORMATION
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newDept, setNewDept] = useState<Department>('Municipal Administration (GHMC)');
  const [newType, setNewType] = useState<ProjectType>('Roads');
  const [newDesc, setNewDesc] = useState('');
  
  // 2. LOCATION
  const [newLocation, setNewLocation] = useState('');
  const [newDistrict, setNewDistrict] = useState('Hyderabad');
  const [newLat, setNewLat] = useState(17.4000);
  const [newLng, setNewLng] = useState(78.4500);

  // 3. ASSIGNMENTS
  const [newPmId, setNewPmId] = useState('');
  const [newFoId, setNewFoId] = useState('');
  const [newContractorId, setNewContractorId] = useState('CON-001');

  // 4. SCHEDULE
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTargetDate, setNewTargetDate] = useState('2026-12-31');
  const [newRevisedDate, setNewRevisedDate] = useState('');

  // 5. BUDGET
  const [newBudget, setNewBudget] = useState(15.0);
  const [newAllocatedBudget, setNewAllocatedBudget] = useState(15.0);
  const [newSpentBudget, setNewSpentBudget] = useState(0.0);

  // 6. PROGRESS & RISK
  const [newExpectedProgress, setNewExpectedProgress] = useState(30);
  const [newActualProgress, setNewActualProgress] = useState(0);
  const [newStatus, setNewStatus] = useState<ProjectStatus>('On Track');
  const [newRiskLevel, setNewRiskLevel] = useState<RiskLevel>('Low');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newDelayProb, setNewDelayProb] = useState(15);

  // 7. CONTACT DETAILS
  const [newManagerContact, setNewManagerContact] = useState('+91 98480 12345');
  const [newContractorContact, setNewContractorContact] = useState('+91 94400 67890');

  // 8. DOCUMENTS
  const [newInitialDocTitle, setNewInitialDocTitle] = useState('Government Sanction Order (GO-MS-452)');
  const [newInitialDocCategory, setNewInitialDocCategory] = useState('Government Approval');

  // 9. REMARKS & OBJECTIVES
  const [newObjectives, setNewObjectives] = useState('Deliver high-grade civic infrastructure ahead of schedule.');
  const [newRemarks, setNewRemarks] = useState('Initial administrative sanction granted. Ready for site mobilization.');

  // Rename Project Modal State (Administrator Only)
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Edit Project Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState<Department>('Municipal Administration (GHMC)');
  const [editType, setEditType] = useState<ProjectType>('Roads');
  const [editLocation, setEditLocation] = useState('');
  const [editBudget, setEditBudget] = useState(15);
  const [editProgress, setEditProgress] = useState(25);
  const [editStatus, setEditStatus] = useState<ProjectStatus>('On Track');
  const [editRisk, setEditRisk] = useState<RiskLevel>('Low');
  const [editPmId, setEditPmId] = useState('');
  const [editFoId, setEditFoId] = useState('');
  const [editContractorId, setEditContractorId] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Delete Confirmation Dialog State
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status & Notification Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto clear feedback after 5 seconds
  useEffect(() => {
    if (feedbackNotice) {
      const timer = setTimeout(() => setFeedbackNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackNotice]);

  // Filter Projects Logic
  const filteredProjects = projects.filter(p => {
    const matchesSearch = !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.projectId && p.projectId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = filterDepartment === 'ALL' || p.department === filterDepartment;
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesRisk = filterRisk === 'ALL' || p.riskLevel === filterRisk;

    return matchesSearch && matchesDept && matchesStatus && matchesRisk;
  });

  // Handler: Open Edit Modal
  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDept(project.department);
    setEditType(project.projectType || 'Roads');
    setEditLocation(project.location);
    setEditBudget(project.totalBudgetCr);
    setEditProgress(project.actualProgressPercentage);
    setEditStatus(project.status);
    setEditRisk(project.riskLevel);
    setEditPmId(project.projectManagerId || (availablePMs.length > 0 ? availablePMs[0].id : ''));
    setEditFoId(project.fieldOfficerId || (availableFOs.length > 0 ? availableFOs[0].id : ''));
    setEditContractorId(project.contractorId || (availableContractors.length > 0 ? availableContractors[0].id : 'CON-001'));
    setEditDesc(project.description || '');
  };

  // Handler: Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    if (!editName.trim()) {
      setFeedbackNotice({ type: 'error', message: 'Project name is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPm = availablePMs.find(pm => pm.id === editPmId);
      const selectedCon = availableContractors.find(c => c.id === editContractorId);

      const success = await updateProject(editingProject.id, {
        name: editName,
        department: editDept,
        projectType: editType,
        location: editLocation,
        totalBudgetCr: Number(editBudget),
        allocatedBudgetCr: Number(editBudget),
        actualProgressPercentage: Number(editProgress),
        status: editStatus,
        riskLevel: editRisk,
        projectManagerId: editPmId,
        managerName: selectedPm?.name || selectedPm?.full_name || editingProject.managerName,
        fieldOfficerId: editFoId,
        contractorId: editContractorId,
        contractorName: selectedCon?.name || editingProject.contractorName,
        description: editDesc
      });

      if (success) {
        setFeedbackNotice({ type: 'success', message: 'Project updated successfully in Supabase.' });
        setEditingProject(null);
      } else {
        setFeedbackNotice({ type: 'error', message: 'Failed to update project in Supabase.' });
      }
    } catch (err: any) {
      setFeedbackNotice({ type: 'error', message: err?.message || 'Error updating project.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Open Rename Modal
  const handleOpenRename = (project: Project) => {
    setRenamingProject(project);
    setRenameValue(project.name);
  };

  // Handler: Submit Project Rename
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingProject) return;
    if (!renameValue.trim()) {
      setFeedbackNotice({ type: 'error', message: 'Project Name cannot be empty.' });
      return;
    }

    setIsRenaming(true);
    try {
      const res = await renameProject(renamingProject.id, renameValue.trim());
      if (res.success) {
        setFeedbackNotice({ 
          type: 'success', 
          message: `Project renamed to "${renameValue.trim()}" successfully in Supabase.` 
        });
        setRenamingProject(null);
      } else {
        setFeedbackNotice({ 
          type: 'error', 
          message: res.error || 'Failed to rename project in Supabase.' 
        });
      }
    } catch (err: any) {
      setFeedbackNotice({ type: 'error', message: err?.message || 'Error renaming project.' });
    } finally {
      setIsRenaming(false);
    }
  };

  // Handler: Create Project Submit (9-Section Comprehensive Form)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      setFeedbackNotice({ type: 'error', message: 'Project name is required.' });
      return;
    }
    if (!newLocation.trim()) {
      setFeedbackNotice({ type: 'error', message: 'Location details are required.' });
      return;
    }
    if (newBudget <= 0) {
      setFeedbackNotice({ type: 'error', message: 'Sanctioned Outlay must be greater than ₹0 Cr.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPm = availablePMs.find(pm => pm.id === newPmId);
      const selectedCon = availableContractors.find(c => c.id === newContractorId);

      const created = await createNewProject({
        name: newProjName.trim(),
        projectId: newProjCode.trim() || undefined,
        department: newDept,
        projectType: newType,
        description: newDesc.trim() || 'Civic infrastructure construction project.',
        location: newLocation.trim(),
        district: newDistrict.trim() || 'Hyderabad',
        latitude: Number(newLat) || 17.4000,
        longitude: Number(newLng) || 78.4500,
        totalBudgetCr: Number(newBudget),
        allocatedBudgetCr: Number(newAllocatedBudget || newBudget),
        spentBudgetCr: Number(newSpentBudget || 0),
        projectManagerId: newPmId,
        managerName: selectedPm?.name || selectedPm?.full_name || 'Er. S. Rao (Executive Engineer)',
        fieldOfficerId: newFoId,
        contractorId: newContractorId,
        contractorName: selectedCon?.name || 'Metro Infrastructure Pvt Ltd',
        startDate: newStartDate || new Date().toISOString().split('T')[0],
        expectedCompletionDate: newTargetDate || '2026-12-31',
        revisedCompletionDate: newRevisedDate || undefined,
        expectedProgressPercentage: Number(newExpectedProgress) || 30,
        actualProgressPercentage: Number(newActualProgress) || 0,
        status: newStatus,
        riskLevel: newRiskLevel,
        priority: newPriority,
        delayProbability: Number(newDelayProb) || 15,
        objectives: [newObjectives.trim() || 'Deliver high-grade civic infrastructure ahead of schedule.'],
        initialDocTitle: newInitialDocTitle.trim(),
        initialDocCategory: newInitialDocCategory,
        remarks: newRemarks.trim()
      });

      setShowCreateModal(false);
      setFeedbackNotice({ 
        type: 'success', 
        message: `Project "${created.name}" created and saved to Supabase successfully! Now listed in Project Registry.` 
      });
      // Reset form
      setNewProjName('');
      setNewProjCode('');
      setNewLocation('');
      setNewDesc('');
      setNewRemarks('');
    } catch (err: any) {
      console.error('Failed to create project in Supabase:', err);
      setFeedbackNotice({ 
        type: 'error', 
        message: err?.message || 'Database error: Failed to save project to Supabase.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingProject) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteProject(deletingProject.id);
      if (res.success) {
        setFeedbackNotice({ type: 'success', message: `Project "${deletingProject.name}" deleted successfully.` });
        setDeletingProject(null);
      } else {
        setDeleteError(res.error || 'Failed to delete project.');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Foreign key constraint prevented project deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback Notification */}
      {feedbackNotice && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
          feedbackNotice.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold font-display text-white">Project Registry & Monitoring</h1>
            <p className="text-xs text-slate-400">
              {userRole === 'Administrator' 
                ? 'Full Administrative Project CRUD: create, edit master data, assign managers, and manage registry'
                : `Viewing projects assigned to your role: ${userRole}`}
            </p>
          </div>

          {/* "+ Create New Project" Button: STRICTLY ADMINISTRATOR ONLY */}
          {userRole === 'Administrator' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Project</span>
            </button>
          )}
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID, name, contractor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="Municipal Administration (GHMC)">GHMC Municipal Admin</option>
              <option value="Water Supply & Sewerage (HMWSSB)">HMWSSB Water Grid</option>
              <option value="Roads & Buildings">Roads & Buildings</option>
              <option value="Medical & Health">Medical & Health</option>
              <option value="School Education">School Education</option>
              <option value="Urban Transport (HMR)">HMR Metro Rail</option>
              <option value="Electrical & Smart Infrastructure">Electrical Infrastructure</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Delayed">Delayed</option>
              <option value="Critical">Critical</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Project ID & Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Contractor</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Budget (₹ Cr)</th>
                <th className="py-3.5 px-4">Target Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">AI Risk</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    No projects found matching the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => (
                  <tr 
                    key={proj.id} 
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    
                    {/* Project ID & Name */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p 
                          className="font-bold text-slate-100 hover:text-cyan-400 cursor-pointer transition-colors" 
                          onClick={() => setSelectedProjectId(proj.id)}
                        >
                          {proj.name}
                        </p>
                        <span className="text-[10px] font-mono text-cyan-400">{proj.projectId || proj.id}</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {proj.department}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {proj.location}
                    </td>

                    {/* Contractor */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-semibold text-slate-200">{proj.contractorName}</span>
                    </td>

                    {/* Progress */}
                    <td className="py-3.5 px-4">
                      <div className="w-24">
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-200">{proj.actualProgressPercentage}%</span>
                          <span className="text-slate-500 font-normal">tgt {proj.expectedProgressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              proj.actualProgressPercentage >= proj.expectedProgressPercentage ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} 
                            style={{ width: `${proj.actualProgressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      ₹{proj.totalBudgetCr} Cr
                      <span className="block text-[10px] text-slate-500 font-normal">Spent: ₹{proj.spentBudgetCr} Cr</span>
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {proj.expectedCompletionDate}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        proj.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        proj.status === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        proj.status === 'Delayed' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        proj.status === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {proj.status}
                      </span>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1">
                        <span className={`text-[10px] font-extrabold ${
                          proj.aiPrediction?.delayProbability >= 70 ? 'text-rose-400' :
                          proj.aiPrediction?.delayProbability >= 40 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {proj.aiPrediction?.delayProbability ?? 10}% Delay Prob
                        </span>
                      </div>
                    </td>

                    {/* Actions: Role-Scoped */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Administrator CRUD Actions */}
                        {userRole === 'Administrator' && (
                          <>
                            <button
                              onClick={() => handleOpenRename(proj)}
                              title="Rename Project (Admin Only)"
                              className="p-1.5 bg-slate-800 hover:bg-amber-600 hover:text-white text-amber-400 font-bold rounded-lg transition-all text-xs"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(proj)}
                              title="Edit Project Master Data"
                              className="p-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 font-bold rounded-lg transition-all text-xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingProject(proj);
                                setDeleteError(null);
                              }}
                              title="Delete Project (Admin Only)"
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 font-bold rounded-lg transition-all text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedProjectId(proj.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-bold rounded-lg transition-all text-xs inline-flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create New Project — 9-Section Complete Master Registration (Administrator Only) */}
      {showCreateModal && userRole === 'Administrator' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600/20 text-cyan-400 border border-blue-500/30 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-white">Create New Infrastructure Project</h2>
                  <p className="text-xs text-slate-400">Complete 9-section master administrative registration with real Supabase persistence</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6 mt-4 overflow-y-auto pr-2 flex-1">
              
              {/* SECTION 1: PROJECT INFORMATION */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                  <span>Project Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amberpet 4-Lane Flyover & Grade Separator"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Project Reference / Code</label>
                    <input
                      type="text"
                      placeholder="Auto-generated e.g. PRJ-GHM-2026-008"
                      value={newProjCode}
                      onChange={(e) => setNewProjCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value as Department)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Municipal Administration (GHMC)">GHMC Municipal Administration</option>
                      <option value="Water Supply & Sewerage (HMWSSB)">HMWSSB Water Supply & Sewerage</option>
                      <option value="Roads & Buildings">Roads & Buildings Dept</option>
                      <option value="Medical & Health">Medical & Health Dept</option>
                      <option value="School Education">School Education</option>
                      <option value="Urban Transport (HMR)">HMR Hyderabad Metro Rail</option>
                      <option value="Electrical & Smart Infrastructure">Electrical & Smart Infra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Project Type / Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ProjectType)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Roads">Roads & Corridors</option>
                      <option value="Bridges & Flyovers">Bridges & Flyovers</option>
                      <option value="Hospitals">Hospitals & Clinics</option>
                      <option value="Schools">Schools & Colleges</option>
                      <option value="Water Supply">Water Pipeline & Reservoirs</option>
                      <option value="Drainage">Stormwater Drainage</option>
                      <option value="Public Buildings">Public Buildings & Hubs</option>
                      <option value="Smart Lighting">Smart City Lighting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Scope & Description</label>
                    <input
                      type="text"
                      placeholder="High-level engineering scope and deliverables..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: LOCATION */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                  <span>Location & GIS Coordinates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location Details *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amberpet 6-No. Junction, East Zone"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">District / Zone</label>
                    <input
                      type="text"
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Coordinates (Lat / Lng)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        step="0.0001"
                        value={newLat}
                        onChange={(e) => setNewLat(Number(e.target.value))}
                        className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono text-center"
                        title="Latitude"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        value={newLng}
                        onChange={(e) => setNewLng(Number(e.target.value))}
                        className="px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono text-center"
                        title="Longitude"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ASSIGNMENTS */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                  <span>Personnel & Contractor Assignments</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Project Manager</label>
                    <select
                      value={newPmId}
                      onChange={(e) => setNewPmId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {availablePMs.map(pm => (
                        <option key={pm.id} value={pm.id}>{pm.name || pm.full_name} ({pm.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Field Officer</label>
                    <select
                      value={newFoId}
                      onChange={(e) => setNewFoId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {availableFOs.map(fo => (
                        <option key={fo.id} value={fo.id}>{fo.name || fo.full_name} ({fo.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Contractor</label>
                    <select
                      value={newContractorId}
                      onChange={(e) => setNewContractorId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {availableContractors.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: SCHEDULE */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">4</span>
                  <span>Project Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Completion Date *</label>
                    <input
                      type="date"
                      required
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Revised Completion Date</label>
                    <input
                      type="date"
                      value={newRevisedDate}
                      onChange={(e) => setNewRevisedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: BUDGET */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">5</span>
                  <span>Financial Outlay & Budget</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sanctioned Outlay (₹ Cr) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={newBudget}
                      onChange={(e) => setNewBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Allocated Budget (₹ Cr)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={newAllocatedBudget}
                      onChange={(e) => setNewAllocatedBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Spent (₹ Cr)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newSpentBudget}
                      onChange={(e) => setNewSpentBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: PROGRESS & RISK */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">6</span>
                  <span>Progress & Risk Baseline</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Progress %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newExpectedProgress}
                      onChange={(e) => setNewExpectedProgress(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Actual Progress %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newActualProgress}
                      onChange={(e) => setNewActualProgress(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Critical">Critical</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Risk Level</label>
                    <select
                      value={newRiskLevel}
                      onChange={(e) => setNewRiskLevel(e.target.value as RiskLevel)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                      <option value="Critical">Critical Risk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Delay Probability %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newDelayProb}
                      onChange={(e) => setNewDelayProb(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 7: CONTACT DETAILS */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">7</span>
                  <span>Contact Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Project Manager Contact / Hotline</label>
                    <input
                      type="text"
                      value={newManagerContact}
                      onChange={(e) => setNewManagerContact(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Contractor Emergency Contact</label>
                    <input
                      type="text"
                      value={newContractorContact}
                      onChange={(e) => setNewContractorContact(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 8: DOCUMENTS */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">8</span>
                  <span>Initial Sanction Document</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title</label>
                    <input
                      type="text"
                      value={newInitialDocTitle}
                      onChange={(e) => setNewInitialDocTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Document Category</label>
                    <select
                      value={newInitialDocCategory}
                      onChange={(e) => setNewInitialDocCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Government Approval">Government Approval Order</option>
                      <option value="Tender / DPR">Detailed Project Report (DPR)</option>
                      <option value="Environmental Clearance">Environmental Clearance</option>
                      <option value="Technical Sanction">Technical Sanction</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 9: REMARKS & OBJECTIVES */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">9</span>
                  <span>Project Objectives & Remarks</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Key Objectives</label>
                    <input
                      type="text"
                      value={newObjectives}
                      onChange={(e) => setNewObjectives(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Remarks / Directives</label>
                    <textarea
                      rows={2}
                      value={newRemarks}
                      onChange={(e) => setNewRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Form Submission Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Inserting into Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Register Project in Supabase</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: Rename Project (Administrator Only) */}
      {renamingProject && userRole === 'Administrator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold font-display text-white">Rename Infrastructure Project</h2>
              </div>
              <button 
                onClick={() => setRenamingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Update project title in PostgreSQL database for <span className="font-mono text-cyan-400 font-semibold">{renamingProject.id}</span>
            </p>

            <form onSubmit={handleRenameSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRenamingProject(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center space-x-1.5"
                >
                  {isRenaming ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      <span>Renaming in Supabase...</span>
                    </>
                  ) : (
                    <span>Save Project Name</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Project (Administrator Only) */}
      {editingProject && userRole === 'Administrator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold font-display text-white">Edit Project Master Data</h2>
              </div>
              <button 
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Modifying record UUID: <span className="font-mono text-cyan-400">{editingProject.id}</span>
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value as Department)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Municipal Administration (GHMC)">GHMC Municipal Administration</option>
                    <option value="Water Supply & Sewerage (HMWSSB)">HMWSSB Water Supply & Sewerage</option>
                    <option value="Roads & Buildings">Roads & Buildings Dept</option>
                    <option value="Medical & Health">Medical & Health Dept</option>
                    <option value="School Education">School Education</option>
                    <option value="Urban Transport (HMR)">HMR Hyderabad Metro Rail</option>
                    <option value="Electrical & Smart Infrastructure">Electrical & Smart Infra</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="On Track">On Track</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Critical">Critical</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Risk Level</label>
                  <select
                    value={editRisk}
                    onChange={(e) => setEditRisk(e.target.value as RiskLevel)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Critical">Critical Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Budget (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={editBudget}
                    onChange={(e) => setEditBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Assignment Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Project Manager</label>
                  <select
                    value={editPmId}
                    onChange={(e) => setEditPmId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer"
                  >
                    {availablePMs.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.name || pm.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Field Officer</label>
                  <select
                    value={editFoId}
                    onChange={(e) => setEditFoId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer"
                  >
                    {availableFOs.map(fo => (
                      <option key={fo.id} value={fo.id}>{fo.name || fo.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Contractor</label>
                  <select
                    value={editContractorId}
                    onChange={(e) => setEditContractorId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 cursor-pointer"
                  >
                    {availableContractors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Objectives</label>
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
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1"
                >
                  {isSubmitting ? (
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

      {/* MODAL 3: Delete Project Confirmation Dialog (Administrator Only) */}
      {deletingProject && userRole === 'Administrator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-scale-up">
            
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
              <p className="text-sm font-bold text-white">{deletingProject.name}</p>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">UUID:</span>
                <span className="font-mono text-cyan-400 text-[11px] select-all">{deletingProject.id}</span>
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
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center space-x-1.5"
              >
                {isDeleting ? (
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

    </div>
  );
};
