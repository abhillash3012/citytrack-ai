import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileCheck, Download, Printer, CheckCircle2, Building2, ShieldCheck } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { projects } = useApp();
  const [selectedReportType, setSelectedReportType] = useState<string>('Monthly Government Infrastructure Monitoring Summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<boolean>(true);

  const reportOptions = [
    'Monthly Government Infrastructure Monitoring Summary',
    'Project Progress & Schedule Variance Report',
    'Capital Budget & Expenditure Audit Report',
    'AI Project Delay & Risk Prediction Dossier',
    'Contractor Performance Scorecard Report',
    'Department-Wise Capital Works Performance'
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Controls Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">Government Project Report Generator</h1>
          <p className="text-xs text-slate-400">Generate, export, and digitally sign official infrastructure status dossiers</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Report Template</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {reportOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedReportType(opt)}
              className={`p-3 rounded-xl text-xs font-bold text-left transition-all border ${
                selectedReportType === opt
                  ? 'bg-blue-600/20 text-cyan-300 border-blue-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Government Report Document Preview */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl p-8 shadow-2xl space-y-6 font-sans print:shadow-none print:border-none">
        
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg font-display">
              CT
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
                GOVERNMENT OF TELANGANA — MUNICIPAL ADMINISTRATION
              </h2>
              <p className="text-xs font-bold text-slate-600">
                CITYTRACK AI — INTELLIGENT INFRASTRUCTURE MONITORING PLATFORM
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-900">CONFIDENTIAL / OFFICIAL USE</p>
            <p className="text-slate-500 font-mono">Date: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center space-y-1 py-2">
          <h1 className="text-xl font-black uppercase text-slate-900 underline underline-offset-4">
            {selectedReportType}
          </h1>
          <p className="text-xs font-medium text-slate-600">Greater Hyderabad Municipal Corporation (GHMC) Region</p>
        </div>

        {/* Executive Summary Stats Table */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl text-center border border-slate-300 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">Total Monitored Projects</span>
            <span className="text-lg font-black text-slate-900">128</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">Overall Progress</span>
            <span className="text-lg font-black text-blue-700">68%</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">Total Capital Budget</span>
            <span className="text-lg font-black text-emerald-700">₹3,450 Cr</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase text-[10px]">AI Delay Risk Level</span>
            <span className="text-lg font-black text-amber-700">MODERATE (78/100)</span>
          </div>
        </div>

        {/* Highlighted Projects Summary */}
        <div>
          <h3 className="text-xs font-black uppercase text-slate-900 mb-2 border-b border-slate-300 pb-1">
            Highlighted Projects Audit & Delay Forecast Summary
          </h3>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 border border-slate-300">Project ID</th>
                <th className="p-2 border border-slate-300">Project Name</th>
                <th className="p-2 border border-slate-300">Department</th>
                <th className="p-2 border border-slate-300">Progress</th>
                <th className="p-2 border border-slate-300">Budget (Cr)</th>
                <th className="p-2 border border-slate-300">AI Delay Prob</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-medium">
              {projects.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td className="p-2 border border-slate-300 font-mono">{p.id}</td>
                  <td className="p-2 border border-slate-300 font-bold">{p.name}</td>
                  <td className="p-2 border border-slate-300">{p.department}</td>
                  <td className="p-2 border border-slate-300 font-bold">{p.actualProgressPercentage}%</td>
                  <td className="p-2 border border-slate-300">₹{p.totalBudgetCr} Cr</td>
                  <td className="p-2 border border-slate-300 font-bold text-rose-700">{p.aiPrediction.delayProbability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Digital Signature Block */}
        <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">CityTrack AI Automated System Certification</p>
            <p className="text-slate-500">Hash: SHA-256 (0x8f912a...e91a)</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-900 pb-1 font-bold text-slate-900">
              K. Suresh Kumar, EE
            </div>
            <p className="text-[10px] text-slate-500">Executive Engineer, GHMC Approval</p>
          </div>
        </div>

      </div>

    </div>
  );
};
