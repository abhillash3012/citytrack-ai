import React from 'react';
import { useApp } from '../context/AppContext';
import { History, Shield, Laptop, Clock } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();

  return (
    <div className="space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">System Security & Audit Trail</h1>
          <p className="text-xs text-slate-400">Immutable ledger of user actions, field updates, status changes, and AI triggers</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          256-Bit Cryptographic Audit
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User & Role</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Project</th>
                <th className="p-3.5">IP & Device Telemetry</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="p-3.5 font-mono text-[11px] text-cyan-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-white block">{log.user}</span>
                    <span className="text-[10px] text-slate-400">{log.role}</span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-200">{log.action}</td>
                  <td className="p-3.5 font-semibold text-cyan-300">{log.projectName || '-'}</td>
                  <td className="p-3.5 text-[10px] text-slate-400 font-mono">
                    <div>{log.ipAddress}</div>
                    <div>{log.device}</div>
                  </td>
                  <td className="p-3.5 text-[11px] text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
