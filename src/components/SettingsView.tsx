import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Shield, Bell, User, Cpu, Lock } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { userRole } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">Platform Settings & Configurations</h1>
          <p className="text-xs text-slate-400">AI prediction thresholds, role-based permissions, and telemetry settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
          {['Profile & Role', 'AI Risk Thresholds', 'Notification Channels', 'Security & Access', 'API Keys'].map((item, idx) => (
            <button
              key={item}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                idx === 0 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white">Active User Profile</h3>
            <p className="text-xs text-slate-400">Currently logged in as {userRole}</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input type="text" readOnly value="Er. K. Suresh Kumar (Executive Engineer)" className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Department</label>
              <input type="text" readOnly value="Municipal Administration (GHMC Zone 3)" className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200" />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">AI Delay Prediction Engine Version</label>
              <input type="text" readOnly value="CityTrack Neural Forecast v2.4 (Active)" className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-mono" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
