import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Search, 
  Bell, 
  Bot, 
  MonitorPlay, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { UserRole } from '../types';

export const Header: React.FC = () => {
  const { 
    userRole, 
    userEmail,
    userPhone,
    setUserRole, 
    logout, 
    alerts, 
    markAlertRead,
    searchQuery, 
    setSearchQuery, 
    setIsAIAssistantOpen,
    isAIAssistantOpen,
    isCommandCenterMode,
    setIsCommandCenterMode,
    setSelectedProjectId,
    setActiveTab,
    projects,
    userProfile
  } = useApp();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const roleFilteredAlerts = alerts.filter(alert => {
    // Broadcast alerts targeted to 'ALL', 'All Roles', or unspecified must be visible to all four roles
    const isBroadcast = !alert.targetRole || (alert.targetRole as string) === 'ALL' || (alert.targetRole as string) === 'All Roles';
    if (isBroadcast) {
      return true;
    }

    if (userRole === 'Administrator') {
      return true;
    }

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
    if (userRole === 'Field Officer') {
      return alert.targetRole === 'Field Officer';
    }
    if (userRole === 'Contractor') {
      return alert.targetRole === 'Contractor';
    }
    return true;
  });

  const unreadAlerts = roleFilteredAlerts.filter(a => !a.isRead);


  // Filter projects for global search suggestions
  const searchResults = searchQuery.trim() ? projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];

  const rolesList: UserRole[] = ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  CityTrack <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  Gov v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Monitor. Predict. Act. — Smart City Intelligence
              </p>
            </div>
          </div>

          {/* Global Smart Search */}
          <div className="relative flex-1 max-w-md mx-6 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects, departments, contractors, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-100 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Search Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/60">
                  Projects Found ({searchResults.length})
                </div>
                {searchResults.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setActiveTab('projects');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between border-t border-slate-800/60 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{proj.name}</p>
                      <p className="text-xs text-slate-400">{proj.department} • {proj.location}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      proj.status === 'On Track' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      proj.status === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Header Controls & Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Hackathon Command Center Presentation Mode Toggle */}
            <button
              onClick={() => setIsCommandCenterMode(!isCommandCenterMode)}
              title="Toggle Hackathon Command Center Mode"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isCommandCenterMode
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/25 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              <span className="hidden lg:inline">Command Center</span>
            </button>

            {/* AI Assistant Drawer Toggle Button (Strictly Excluded for Project Manager) */}
            {userRole !== 'Project Manager' && (
              <button
                onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                className="relative group p-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 rounded-lg text-cyan-400 transition-all flex items-center space-x-1.5"
              >
                <Bot className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold hidden sm:inline text-cyan-300">AI Assistant</span>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
              </button>
            )}

            {/* Notification Center Alerts Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">System Alerts ({roleFilteredAlerts.length})</span>
                    </div>
                    <button 
                      onClick={() => setShowAlertsDropdown(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {roleFilteredAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          markAlertRead(alert.id);
                          if (alert.projectId) {
                            setSelectedProjectId(alert.projectId);
                            setActiveTab('projects');
                          }
                          setShowAlertsDropdown(false);
                        }}
                        className={`p-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          !alert.isRead ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {alert.severity === 'Critical' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <span className="text-xs font-bold text-slate-200">{alert.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{alert.timestamp.split(' ')[1]}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 pl-6 line-clamp-2">{alert.message}</p>
                        {alert.projectName && (
                          <p className="text-[10px] font-medium text-cyan-400 mt-1 pl-6">
                            Project: {alert.projectName}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2 bg-slate-950 border-t border-slate-800 text-center">
                    <button 
                      onClick={() => {
                        setActiveTab('alerts');
                        setShowAlertsDropdown(false);
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      View All Alerts in Notification Center →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill for Judge Testing */}
            <div className="hidden xl:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
              <span className="text-[11px] font-medium text-slate-400 mr-1">Role:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-slate-900 text-xs font-semibold text-cyan-300 px-2 py-1 rounded focus:outline-none cursor-pointer border border-slate-700"
              >
                {rolesList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-2.5 border-l border-slate-800 pl-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-xs text-white shadow-md">
                    {userRole.charAt(0)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" title="2FA OTP Verified"></span>
                </div>
                
                <div className="hidden lg:block text-left">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-slate-100">{userRole}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono line-clamp-1 max-w-[140px]" title={`${userEmail} | ${userPhone}`}>
                    {userEmail}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title={`Sign Out (${userEmail})`}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
