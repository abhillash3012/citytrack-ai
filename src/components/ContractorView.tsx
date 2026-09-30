import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  Star, 
  HardHat, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  ShieldCheck, 
  Briefcase, 
  Plus, 
  Check, 
  ArrowUpRight,
  Truck,
  Wrench
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

import { fetchContractorWorkforce, updateContractorWorkforce, SiteWorkerRecord } from '../services/supabase/databaseService';

export const ContractorView: React.FC = () => {
  const { contractors, projects, userRole, setSelectedProjectId, setActiveTab } = useApp();

  const isContractor = userRole === 'Contractor';

  // Contractor-owned worker management state - loaded from Supabase PostgreSQL
  const [workers, setWorkers] = useState<SiteWorkerRecord[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState<boolean>(true);
  const [workerError, setWorkerError] = useState<string | null>(null);

  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState('Skilled Tradesperson');
  const [newWorkerShift, setNewWorkerShift] = useState<SiteWorkerRecord['shift']>('Morning Shift (07:00 - 15:30)');
  const [newWorkerContact, setNewWorkerContact] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSavingWorker, setIsSavingWorker] = useState(false);

  // Load workforce from Supabase on mount and when role changes
  useEffect(() => {
    let isMounted = true;
    const loadWorkforce = async () => {
      try {
        setIsLoadingWorkers(true);
        setWorkerError(null);
        const { data, error } = await fetchContractorWorkforce('CON-001');
        if (!isMounted) return;
        if (error) {
          setWorkerError(`Unable to load workforce: ${error}`);
        } else if (data) {
          setWorkers(data);
        }
      } catch (err: any) {
        if (isMounted) setWorkerError(err?.message || 'Error loading workforce');
      } finally {
        if (isMounted) setIsLoadingWorkers(false);
      }
    };
    loadWorkforce();
    return () => { isMounted = false; };
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    try {
      setIsSavingWorker(true);
      const newW: SiteWorkerRecord = {
        id: `W-${String(workers.length + 1).padStart(2, '0')}`,
        name: newWorkerName.trim(),
        trade: newWorkerTrade,
        shift: newWorkerShift,
        status: 'On Site',
        safetyCertified: true,
        contactNumber: newWorkerContact.trim() || '+91 98000 00000'
      };

      const updatedWorkers = [newW, ...workers];
      setWorkers(updatedWorkers);
      setShowAddWorkerModal(false);
      setNewWorkerName('');
      setNewWorkerContact('');

      // Persist to Supabase PostgreSQL table
      const res = await updateContractorWorkforce('CON-001', updatedWorkers);
      if (!res.success) {
        setWorkerError(`Worker was added locally but database sync failed: ${res.error}`);
      } else {
        setSuccessToast(`Worker ${newW.name} registered and saved to Supabase.`);
        setTimeout(() => {
          setSuccessToast(null);
        }, 3500);
      }
    } catch (err: any) {
      setWorkerError(`Failed to save worker: ${err?.message}`);
    } finally {
      setIsSavingWorker(false);
    }
  };

  const chartData = contractors.map(c => ({
    name: c.name.split(' ')[0],
    score: c.overallScore,
    schedule: c.scheduleScore,
    quality: c.qualityScore
  }));

  // If role is Contractor, render the Contractor Site Execution & Worker Operations Console
  if (isContractor) {
    return (
      <div className="space-y-6">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center space-x-1">
                  <HardHat className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Contractor Execution Portal</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  L&T Urban Infra Consortium (CON-001)
                </span>
              </div>
              <h1 className="text-2xl font-extrabold font-display text-white mt-1">
                Site Operations & Workforce Management
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Real-time operational dashboard for assigned construction packages. Monitor progress, assigned field officers, site execution milestones, and manage certified on-site labor.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Projects</span>
                <span className="text-xl font-black text-cyan-400 font-display">{projects.length}</span>
              </div>
              <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">On-Site Workers</span>
                <span className="text-xl font-black text-emerald-400 font-display">{workers.filter(w => w.status === 'On Site').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-xs font-bold text-emerald-300 flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Assigned Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Assigned Infrastructure Packages</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">{projects.length} package(s) allocated</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(proj => (
              <div key={proj.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{proj.projectId}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {proj.department}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{proj.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{proj.location}</span>
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    proj.status === 'On Track' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    proj.status === 'Delayed' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Physical Execution Progress</span>
                    <span className="font-bold text-white font-mono">{proj.actualProgressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${proj.actualProgressPercentage >= 70 ? 'bg-emerald-500' : 'bg-cyan-500'}`} 
                      style={{ width: `${Math.min(100, proj.actualProgressPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Operational Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Assigned PM</span>
                    <span className="font-semibold text-slate-200">{proj.managerName || 'Er. Suresh Sharma'}</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Field Officer</span>
                    <span className="font-semibold text-slate-200">{(proj as any).fieldOfficerName || proj.fieldOfficerId || 'Vikram Patil'}</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Target Completion</span>
                    <span className="font-semibold text-slate-200">{proj.expectedCompletionDate}</span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Execution Budget</span>
                    <span className="font-semibold text-slate-200">₹{proj.totalBudgetCr} Cr</span>
                  </div>
                </div>

                {/* Milestones count and Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Milestones: <strong className="text-white">{proj.milestones?.length || 0} trackable gates</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setActiveTab('projects');
                    }}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-bold rounded-xl border border-blue-500/30 transition-all flex items-center space-x-1"
                  >
                    <span>View Project Package</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker Management & Operational Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>On-Site Workforce & Shift Roster</span>
              </h2>
              <p className="text-xs text-slate-400">Certified trade workers, machine operators, and active site shifts</p>
            </div>

            <button
              onClick={() => setShowAddWorkerModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register Site Worker</span>
            </button>
          </div>

          {/* Feedback & Error states */}
          {workerError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{workerError}</span>
            </div>
          )}

          {isLoadingWorkers && (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2"></div>
              <span>Loading on-site workforce manifest from Supabase...</span>
            </div>
          )}

          {/* Workers Table */}
          {!isLoadingWorkers && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Worker ID & Name</th>
                  <th className="py-3 px-4">Trade / Specialization</th>
                  <th className="py-3 px-4">Shift Assignment</th>
                  <th className="py-3 px-4">Safety Status</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Deployment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {workers.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                          {w.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{w.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{w.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {w.trade}
                    </td>
                    <td className="py-3 px-4 text-slate-300 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{w.shift}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 w-fit">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>PPE Certified</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {w.contactNumber}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Modal: Add Worker */}
        {showAddWorkerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-lg bg-blue-500/20 text-cyan-400">
                    <HardHat className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Register Site Worker</h3>
                    <p className="text-xs text-slate-400">Add certified labor to daily site muster</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddWorker} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Worker Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newWorkerName}
                    onChange={(e) => setNewWorkerName(e.target.value)}
                    placeholder="e.g., Rajesh Sharma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Trade / Skill Category *</label>
                    <select
                      value={newWorkerTrade}
                      onChange={(e) => setNewWorkerTrade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Master Mason / Structural Lead">Master Mason / Structural Lead</option>
                      <option value="Certified Steel & Rebar Welder">Certified Steel & Rebar Welder</option>
                      <option value="Heavy Tower Crane Operator">Heavy Tower Crane Operator</option>
                      <option value="Concrete Pump Specialist">Concrete Pump Specialist</option>
                      <option value="Site Electrician & Heavy Wiring">Site Electrician & Heavy Wiring</option>
                      <option value="General Site Laborer">General Site Laborer</option>
                      <option value="Site Safety Marshal">Site Safety Marshal</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Shift Allocation *</label>
                    <select
                      value={newWorkerShift}
                      onChange={(e) => setNewWorkerShift(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Morning Shift (07:00 - 15:30)">Morning Shift (07:00 - 15:30)</option>
                      <option value="Evening Shift (15:30 - 23:00)">Evening Shift (15:30 - 23:00)</option>
                      <option value="Night Shift (23:00 - 07:00)">Night Shift (23:00 - 07:00)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Contact Number</label>
                  <input
                    type="tel"
                    value={newWorkerContact}
                    onChange={(e) => setNewWorkerContact(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddWorkerModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingWorker}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5"
                  >
                    {isSavingWorker ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Register to Muster</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Administrator & Other Roles: Contractor Performance Index & Benchmark scores
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">Contractor Performance Index</h1>
          <p className="text-xs text-slate-400">Reliability scores, schedule compliance, and quality auditing</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-cyan-400 border border-blue-500/20">
          {contractors.length} Registered Firms
        </span>
      </div>

      {/* Comparative Performance Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Overall Contractor Score Benchmark (0-100)</h2>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Bar dataKey="score" name="Overall Performance Score" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.score > 85 ? '#10b981' : entry.score > 70 ? '#3b82f6' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contractor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractors.map((c) => (
          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">{c.code}</span>
                <h3 className="text-lg font-bold text-white">{c.name}</h3>
                <p className="text-xs text-slate-400">Contact: {c.contactPerson} • {c.email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Score</span>
                <span className={`text-2xl font-black font-display ${
                  c.overallScore > 85 ? 'text-emerald-400' : c.overallScore > 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {c.overallScore} / 100
                </span>
              </div>
            </div>

            {/* Score Breakdown Bar Matrix */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Schedule Compliance</span>
                <span className="font-bold text-slate-200">{c.scheduleScore}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Quality Audit</span>
                <span className="font-bold text-slate-200">{c.qualityScore}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Budget Discipline</span>
                <span className="font-bold text-slate-200">{c.budgetScore}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Reliability Rating</span>
                <span className="font-bold text-slate-200">{c.reliabilityScore}/100</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Assigned Projects: <strong className="text-white">{c.totalProjectsAssigned}</strong></span>
              <span>Delayed: <strong className="text-rose-400">{c.delayedProjectsCount}</strong></span>
              <span>Completed: <strong className="text-emerald-400">{c.completedProjects}</strong></span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

