import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export const AnalyticsView: React.FC = () => {
  const statusPieData = [
    { name: 'On Track', value: 82, color: '#10b981' },
    { name: 'At Risk', value: 18, color: '#f59e0b' },
    { name: 'Delayed', value: 31, color: '#f97316' },
    { name: 'Critical', value: 15, color: '#ef4444' },
    { name: 'Completed', value: 8, color: '#3b82f6' },
  ];

  const monthlyDelayTrends = [
    { month: 'Jan', delayed: 12 },
    { month: 'Mar', delayed: 18 },
    { month: 'May', delayed: 24 },
    { month: 'Jul', delayed: 28 },
    { month: 'Sep', delayed: 31 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">Smart City Infrastructure Analytics</h1>
          <p className="text-xs text-slate-400">Cross-department status distribution, delay velocity & risk profiling</p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Project Status Distribution Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Project Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay Velocity Trends */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Monthly Delay Trends (2026)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDelayTrends}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="delayed" name="Delayed Projects Count" stroke="#f97316" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
