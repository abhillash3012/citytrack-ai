import React from 'react';
import { useApp } from '../context/AppContext';
import { IndianRupee, TrendingUp, AlertTriangle, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const BudgetView: React.FC = () => {
  const { projects } = useApp();

  const totalAllocated = 3450;
  const totalSpent = 2553;
  const remaining = totalAllocated - totalSpent;
  const utilPct = Math.round((totalSpent / totalAllocated) * 100);

  const pieData = [
    { name: 'Roads & Buildings', value: 1250, color: '#3b82f6' },
    { name: 'HMWSSB Water & Drainage', value: 890, color: '#06b6d4' },
    { name: 'Municipal GHMC', value: 640, color: '#10b981' },
    { name: 'Health & Hospitals', value: 420, color: '#8b5cf6' },
    { name: 'Education & Others', value: 250, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">Municipal Financial & Expenditure Dashboard</h1>
          <p className="text-xs text-slate-400">Capital allocations, disbursement auditing, and variance tracking</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          FY 2026-27 Active Pool
        </span>
      </div>

      {/* Overbudget Warning Alert Banner */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-center space-x-3 text-amber-200 shadow-lg">
        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-white">Expenditure Pacing Warning</h4>
          <p className="text-[11px] text-amber-300">
            Project spending is 14% above expected expenditure velocity relative to physical completion on 4 active road corridors.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Allocated</span>
          <p className="text-2xl font-black font-display text-white mt-1">₹{totalAllocated} Cr</p>
          <span className="text-[10px] text-slate-500">Sanctioned capital pool</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Disbursed Expenditure</span>
          <p className="text-2xl font-black font-display text-emerald-400 mt-1">₹{totalSpent} Cr</p>
          <span className="text-[10px] text-emerald-400">74% Disbursed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Remaining Treasury</span>
          <p className="text-2xl font-black font-display text-cyan-400 mt-1">₹{remaining} Cr</p>
          <span className="text-[10px] text-slate-500">26% Available</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Financial Utilization Rate</span>
          <p className="text-2xl font-black font-display text-indigo-400 mt-1">{utilPct}%</p>
          <span className="text-[10px] text-amber-400">+6% Pacing Fast</span>
        </div>
      </div>

      {/* Pie Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Department Sector Allocations</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Project Financial Health Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Project Name</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Spent</th>
                  <th className="p-3">Utilized %</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {projects.slice(0, 6).map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/50">
                    <td className="p-3 text-white font-bold">{p.name}</td>
                    <td className="p-3">₹{p.totalBudgetCr} Cr</td>
                    <td className="p-3 text-emerald-400">₹{p.spentBudgetCr} Cr</td>
                    <td className="p-3">{Math.round((p.spentBudgetCr / p.totalBudgetCr) * 100)}%</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (p.spentBudgetCr / p.totalBudgetCr) * 100 > p.actualProgressPercentage + 15
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {(p.spentBudgetCr / p.totalBudgetCr) * 100 > p.actualProgressPercentage + 15 ? 'Overbudget' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
