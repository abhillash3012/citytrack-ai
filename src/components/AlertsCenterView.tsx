import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  ArrowUpRight, 
  ShieldAlert, 
  Filter, 
  UserCheck,
  Check,
  Plus,
  X,
  Send
} from 'lucide-react';
import { AlertNotification } from '../types';
import { addAlertToSupabase } from '../services/supabase/databaseService';

export const AlertsCenterView: React.FC = () => {
  const { alerts, markAlertRead, setSelectedProjectId, setActiveTab, userRole, userEmail, userProfile, projects, refreshFromSupabase } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('UNREAD');

  // Administrator Create Alert State
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'Critical' | 'Warning' | 'Info'>('Warning');
  const [alertProjectId, setAlertProjectId] = useState(projects[0]?.id || '');
  const [alertRecipientScope, setAlertRecipientScope] = useState<'ALL' | 'Project Manager' | 'Field Officer' | 'Contractor'>('ALL');
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) {
      setAlertFeedback({ type: 'error', message: 'Please provide both an alert title and message.' });
      return;
    }

    try {
      setIsSubmittingAlert(true);
      setAlertFeedback(null);

      const targetProj = projects.find(p => p.id === alertProjectId) || projects[0];
      const newAlertId = crypto.randomUUID ? crypto.randomUUID() : `alert-${Date.now()}`;

      const newAlert: AlertNotification = {
        id: newAlertId,
        projectId: targetProj?.id || undefined,
        projectName: targetProj?.name || 'City Infrastructure',
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        severity: alertSeverity,
        targetRole: alertRecipientScope === 'ALL' ? 'ALL' : (alertRecipientScope as any),
        projectManagerId: targetProj?.projectManagerId,
        timestamp: 'Just now',
        isRead: false,
        category: alertSeverity === 'Critical' ? 'Issue Escalated' : 'Contractor Alert',
        reason: `Administrative directive broadcasted by ${userEmail || 'System Administrator'}`,
        requiredAction: 'Review directive immediately and execute corrective action.'
      };

      const res = await addAlertToSupabase(newAlert);
      if (!res.success) {
        throw new Error(res.error || 'Failed to persist alert in Supabase');
      }

      await refreshFromSupabase();
      const successMsg = res.notificationWarning 
        ? `Alert created in Supabase! Notice: ${res.notificationWarning}`
        : 'System alert created and broadcasted successfully to all target roles.';
      setAlertFeedback({ type: 'success', message: successMsg });
      setTimeout(() => {
        setShowCreateAlertModal(false);
        setAlertTitle('');
        setAlertMessage('');
        setAlertFeedback(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create alert:', err);
      setAlertFeedback({ type: 'error', message: err.message || 'Error saving alert to Supabase' });
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  // 1. Role-Based Alert Visibility Filter (Broadcast alerts to all 4 roles, role-specific to intended recipient)
  const roleFilteredAlerts = alerts.filter(alert => {
    // Broadcast alerts targeted to 'ALL', 'All Roles', or unspecified must be visible to all four roles
    const isBroadcast = !alert.targetRole || (alert.targetRole as string) === 'ALL' || (alert.targetRole as string) === 'All Roles';
    if (isBroadcast) {
      return true;
    }

    // ADMIN: Organization-wide oversight
    if (userRole === 'Administrator') {
      return true;
    }

    // PROJECT MANAGER: Focus on projects assigned to that PM or PM-targeted alerts
    if (userRole === 'Project Manager') {
      if (alert.targetRole === 'Project Manager') return true;
      let alertPMId = alert.projectManagerId;
      if (!alertPMId && alert.projectId) {
        const matchingProj = projects.find(p => p.id === alert.projectId);
        if (matchingProj) alertPMId = matchingProj.projectManagerId;
      }
      const pmUid = userProfile?.id;
      if (!pmUid) return false;
      return alertPMId === pmUid || !alertPMId;
    }

    // FIELD OFFICER: Only assigned tasks/actions relevant to Field Officer
    if (userRole === 'Field Officer') {
      return alert.targetRole === 'Field Officer';
    }

    // CONTRACTOR: Only execution/work-related actions
    if (userRole === 'Contractor') {
      return alert.targetRole === 'Contractor';
    }

    return true;
  });

  // 2. Secondary Filter according to UI severity & read/unread status
  const filteredAlerts = roleFilteredAlerts.filter(a => {
    if (filterSeverity === 'CRITICAL' && a.severity !== 'Critical') return false;
    if (filterSeverity === 'HIGH' && a.severity !== 'Warning') return false;
    if (filterStatus === 'UNREAD' && a.isRead) return false;
    return true;
  });

  const criticalCount = roleFilteredAlerts.filter(a => a.severity === 'Critical').length;
  const highCount = roleFilteredAlerts.filter(a => a.severity === 'Warning').length;
  const unreadCount = roleFilteredAlerts.filter(a => !a.isRead).length;

  const handleAlertClick = (alert: AlertNotification) => {
    markAlertRead(alert.id);
    if (alert.projectId) {
      setSelectedProjectId(alert.projectId);
      setActiveTab('projects');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Role-Based Smart Alert System</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center space-x-1">
                <UserCheck className="w-3 h-3 text-cyan-400" />
                <span>Filtered for Role: <strong>{userRole}</strong></span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold font-display text-white mt-1">
              {userRole === 'Administrator' ? 'Executive Admin Alerts Center' :
               userRole === 'Project Manager' ? 'Project Manager Priority Alerts' :
               userRole === 'Field Officer' ? 'Field Officer Inspection Tasks' :
               'Contractor Action Items Center'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {userRole === 'Administrator' && 'Displays critical multi-project risks, severe delay forecasts, major budget variances, and contractor defaults requiring executive intervention.'}
              {userRole === 'Project Manager' && 'Displays alerts strictly scoped to your assigned infrastructure projects. Includes new field inspections, high delay probability, milestone delays, and site safety issues.'}
              {userRole === 'Field Officer' && 'Displays assigned site inspection tasks, PM follow-up requests, and required site evidence uploads.'}
              {userRole === 'Contractor' && 'Displays execution work updates required, overdue milestone alerts, and PM corrective action requests.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {userRole === 'Administrator' && (
              <button
                onClick={() => {
                  setShowCreateAlertModal(true);
                  if (projects[0]?.id && !alertProjectId) {
                    setAlertProjectId(projects[0].id);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create System Alert</span>
              </button>
            )}
            <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Critical Alerts</span>
              <span className="text-xl font-black text-rose-400 font-display">{criticalCount}</span>
            </div>
            <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unread Issues</span>
              <span className="text-xl font-black text-amber-400 font-display">{unreadCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        
        {/* Severity Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </span>
          
          {[
            { id: 'ALL', label: 'All Important Alerts' },
            { id: 'CRITICAL', label: '🔴 CRITICAL' },
            { id: 'HIGH', label: '🟠 HIGH PRIORITY' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterSeverity(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterSeverity === btn.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Read/Unread Filter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterStatus(filterStatus === 'UNREAD' ? 'ALL' : 'UNREAD')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filterStatus === 'UNREAD'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {filterStatus === 'UNREAD' ? 'Showing Unread Only' : 'Showing All Statuses'}
          </button>
        </div>

      </div>

      {/* Action-Oriented Alerts Cards List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white font-display">No Critical Issues Requiring Immediate Action</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All monitored projects for {userRole} role are performing within baseline tolerance thresholds or alerts have been marked as resolved.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isCritical = alert.severity === 'Critical';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border shadow-xl transition-all space-y-3 ${
                  isCritical 
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-rose-950/10' 
                    : 'bg-amber-950/20 border-amber-500/40 shadow-amber-950/10'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-black font-mono tracking-wider ${
                      isCritical ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {isCritical ? '🔴 CRITICAL' : '🟠 HIGH'}
                    </span>

                    <span className="text-xs font-bold text-white font-display">{alert.projectName}</span>
                    {alert.projectId && <span className="text-[10px] text-slate-400 font-mono">({alert.projectId})</span>}
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 font-mono">{alert.timestamp}</span>
                    {!alert.isRead && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                        NEW
                      </span>
                    )}
                  </div>
                </div>

                {/* What Happened & Title */}
                <div>
                  <h3 className="text-sm font-extrabold text-white">{alert.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">
                    {alert.message}
                  </p>
                </div>

                {/* Action-Oriented Quadrants */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  
                  {/* Why It Matters */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Why This Matters:
                    </span>
                    <p className="text-slate-300">{alert.reason || 'Project schedule variance or milestone delay threshold exceeded.'}</p>
                  </div>

                  {/* Who Needs to Act & Required Action */}
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Action Required ({alert.targetRole || userRole}):
                    </span>
                    <p className="text-slate-200 font-medium">
                      {alert.requiredAction || 'Intervention required. Inspect details & issue corrective orders.'}
                    </p>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Category: {alert.category} • Target Role: {alert.targetRole || userRole}
                  </span>

                  <div className="flex items-center space-x-2">
                    {!alert.isRead && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark Read</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleAlertClick(alert)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
                    >
                      <span>View Inspection & Project</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Create Alert Modal for Administrator */}
      {showCreateAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Create System Alert</h3>
                  <p className="text-xs text-slate-400">Broadcast an administrative directive to Supabase</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowCreateAlertModal(false); setAlertFeedback(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="p-6 space-y-4">
              {alertFeedback && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                  alertFeedback.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {alertFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{alertFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Alert Title *</label>
                <input 
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="e.g., Mandatory Quality Inspection Directive"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Severity *</label>
                  <select 
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Critical">🔴 Critical (Immediate Action)</option>
                    <option value="Warning">🟠 Warning (High Priority)</option>
                    <option value="Info">🔵 Informational</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Recipient Scope *</label>
                  <select 
                    value={alertRecipientScope}
                    onChange={(e) => setAlertRecipientScope(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="ALL">All Roles (Broadcast)</option>
                    <option value="Project Manager">Project Manager Only</option>
                    <option value="Field Officer">Field Officer Only</option>
                    <option value="Contractor">Contractor Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Associated Project *</label>
                <select 
                  value={alertProjectId}
                  onChange={(e) => setAlertProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Alert Message / Directive *</label>
                <textarea 
                  required
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Detail the issue, mandatory safety protocol, or required corrective measure..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateAlertModal(false); setAlertFeedback(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAlert}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5"
                >
                  {isSubmittingAlert ? (
                    <span>Broadcasting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Alert</span>
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
};

