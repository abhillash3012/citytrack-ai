import React from 'react';
import { useApp } from '../context/AppContext';
import { CityMap } from './CityMap';
import { MonitorPlay, X, AlertTriangle, BrainCircuit, Activity, Building2, IndianRupee, Sparkles } from 'lucide-react';

export const CommandCenterMode: React.FC = () => {
  const { isCommandCenterMode, setIsCommandCenterMode, projects, alerts, userRole } = useApp();

  if (!isCommandCenterMode) return null;

  const totalProjects = projects.length;
  const criticalCount = projects.filter(p => p.riskLevel === 'Critical' || (p.aiPrediction && p.aiPrediction.delayProbability > 75)).length;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (Number(p.actualProgressPercentage) || 0), 0) / projects.length) : 0;
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.totalBudgetCr) || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (Number(p.spentBudgetCr) || 0), 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const avgHealth = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.healthScore?.overall || 78), 0) / projects.length) : 78;

  // High risk project for spotlight
  const highRiskProject = projects.find(p => p.riskLevel === 'Critical' || (p.aiPrediction && p.aiPrediction.delayProbability > 70)) || projects[0];

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 z-50 overflow-y-auto p-4 sm:p-6 font-sans">
      
      {/* Top Command Center Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black font-display tracking-tight text-white">
                CITYTRACK AI — SMART CITY COMMAND CENTER
              </h1>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30 animate-pulse">
                LIVE TELEMETRY STREAM
              </span>
            </div>
            <p className="text-xs text-slate-400">Greater Hyderabad Municipal Region • Live Operations Mode</p>
          </div>
        </div>

        <button
          onClick={() => setIsCommandCenterMode(false)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
        >
          <X className="w-4 h-4 text-rose-400" />
          <span>Exit Presentation Mode</span>
        </button>
      </div>

      {/* Futuristic Command Cards Row (Derived Live from Supabase Projects) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Projects</span>
          <span className="text-3xl font-black text-white font-display">{totalProjects}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Delay Risks</span>
          <span className="text-3xl font-black text-rose-400 font-display">{criticalCount}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Progress</span>
          <span className="text-3xl font-black text-cyan-400 font-display">{avgProgress}%</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget Utilized</span>
          <span className="text-3xl font-black text-indigo-400 font-display">{budgetPct}%</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City Health Score</span>
          <span className="text-3xl font-black text-amber-400 font-display">{avgHealth} / 100</span>
        </div>
      </div>

      {/* Main Grid: GIS Map & Live Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large GIS Map */}
        <div className="lg:col-span-2">
          <CityMap />
        </div>

        {/* Live Alerts & AI Feed */}
        <div className="space-y-6">
          
          {/* Spotlight AI Delay Prediction (Hidden for Project Manager) */}
          {userRole !== 'Project Manager' && highRiskProject && (
            <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">AI High Risk Warning</span>
              </div>
              <h3 className="text-sm font-bold text-white">{highRiskProject.name}</h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Delay Probability:</span>
                <span className="font-bold text-rose-400 font-display">{highRiskProject.aiPrediction?.delayProbability ?? 75}% ({highRiskProject.riskLevel?.toUpperCase()} RISK)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Predicted Delay:</span>
                <span className="font-bold text-rose-400 font-mono">+{highRiskProject.aiPrediction?.predictedDelayDays ?? 14} Days</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                {highRiskProject.aiPrediction?.explanation || 'Physical progress is lagging baseline expectations.'}
              </p>
            </div>
          )}

          {/* Live Alerts Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Live System Alerts</span>
            </h3>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {alerts.map(a => (
                <div key={a.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold text-cyan-400">{a.title}</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">{a.message}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
