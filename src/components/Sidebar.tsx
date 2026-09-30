import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Map, 
  BrainCircuit, 
  Camera, 
  Users, 
  IndianRupee, 
  FileCheck, 
  FileText, 
  Bell, 
  BarChart3, 
  History, 
  Settings,
  Shield
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedProjectId, alerts, userRole } = useApp();
  const unreadAlertCount = alerts.filter(a => !a.isRead).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roleAccess: ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'] },
    { id: 'projects', label: 'Projects', icon: FolderKanban, roleAccess: ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'] },
    { id: 'map', label: 'Interactive Map', icon: Map, roleAccess: ['Administrator', 'Project Manager', 'Contractor'] },
    { id: 'ai-insights', label: 'AI Intelligence', icon: BrainCircuit, badge: 'AI Engine', roleAccess: ['Administrator'] },
    { id: 'field-updates', label: 'Field Updates', icon: Camera, badge: 'Mobile', roleAccess: ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'] },
    { id: 'contractors', label: userRole === 'Contractor' ? 'Workers & Operations' : 'Contractors', icon: Users, roleAccess: ['Administrator', 'Contractor'] },
    { id: 'budget', label: 'Budget & Finance', icon: IndianRupee, roleAccess: ['Administrator'] },
    { id: 'reports', label: 'Reports', icon: FileCheck, roleAccess: ['Administrator', 'Project Manager'] },
    { id: 'documents', label: 'Documents', icon: FileText, roleAccess: ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'] },
    { id: 'alerts', label: 'Alerts', icon: Bell, alertCount: unreadAlertCount, roleAccess: ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roleAccess: ['Administrator', 'Project Manager'] },
    { id: 'audit-log', label: 'Audit Trail', icon: History, roleAccess: ['Administrator'] },
    { id: 'settings', label: 'Settings', icon: Settings, roleAccess: ['Administrator', 'Project Manager', 'Field Officer', 'Contractor'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 hidden md:flex flex-col justify-between py-4 px-3 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        
        {/* Navigation Category Label */}
        <div className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
          City Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRoleAllowed = item.roleAccess.includes(userRole);

          if (!isRoleAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'projects') {
                  setSelectedProjectId(null);
                }
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-cyan-400 border border-blue-500/30 shadow-md shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {item.badge}
                </span>
              )}

              {item.alertCount !== undefined && item.alertCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                  {item.alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Footer Status */}
      <div className="pt-4 border-t border-slate-800 px-3">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">{userRole}</p>
            <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Encrypted Session</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
