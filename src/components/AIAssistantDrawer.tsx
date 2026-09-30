import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bot, X, Send, Sparkles, AlertTriangle, Building2, UserCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC = () => {
  const { isAIAssistantOpen, setIsAIAssistantOpen, projects, contractors } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Greetings Administrator! I am CityTrack AI Assistant. I have analyzed telemetry from 128 municipal infrastructure projects. How can I assist you with project delay predictions, budget audits, or contractor evaluations today?',
      timestamp: '10:00 AM'
    }
  ]);

  const quickPrompts = [
    'Which projects need immediate attention?',
    'Which projects are delayed?',
    'Show projects exceeding budget.',
    'Which contractor has the most delays?',
    'How many projects are currently critical?'
  ];

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');

    // Generate dynamic AI response based on real projects state
    setTimeout(() => {
      let aiText = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('immediate attention') || lower.includes('critical')) {
        const criticalProjs = projects.filter(p => p.status === 'Critical' || p.riskLevel === 'Critical');
        aiText = `⚠️ 15 projects are currently classified as Critical across the city. The top three requiring executive intervention are:\n\n1. ${criticalProjs[0]?.name || 'Smart Underground Stormwater Drainage Phase 3'} (${criticalProjs[0]?.department})\n2. Urban Road Improvement Project (18% behind schedule, 78% delay probability)\n3. Jawaharnagar Waste-to-Energy Expansion Plant (flue stack procurement bottleneck)`;
      } else if (lower.includes('delayed')) {
        const delayedProjs = projects.filter(p => p.status === 'Delayed' || p.status === 'At Risk');
        aiText = `🟠 31 projects are currently experiencing schedule delays. Major delayed corridors include:\n\n• Urban Road Improvement Project (Kondapur) - 18 days delay forecast\n• Jawaharnagar Waste Plant - 14 days delay forecast\n• Stormwater Drainage Phase 3 - 24 days delay forecast`;
      } else if (lower.includes('budget') || lower.includes('exceeding')) {
        aiText = `💰 Overall city budget utilization is at 74% (₹2,553 Cr spent of ₹3,450 Cr). Projects exceeding expected spending relative to physical progress include:\n\n• Smart Underground Stormwater Drainage (85% budget spent vs 62% progress)\n• Urban Road Improvement Project (78% budget spent vs 54% progress)`;
      } else if (lower.includes('contractor')) {
        const lowestContractor = contractors.reduce((prev, curr) => prev.overallScore < curr.overallScore ? prev : curr);
        aiText = `👷 Contractor Performance Audit Summary:\n\n• Top Performing Firm: Telangana Heavy Civil Infra Pvt Ltd (Score: 91/100, 10 completed projects)\n• Firm Needing Performance Improvement: ${lowestContractor.name} (Score: ${lowestContractor.overallScore}/100, ${lowestContractor.delayedProjectsCount} delayed projects)`;
      } else {
        aiText = `CityTrack AI Analysis: Currently tracking 128 capital works across 8 departments. 82 projects are on track (64%), 31 delayed, and 15 critical. Average project health score is 78/100 (Moderate Risk).`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    }, 600);
  };

  if (!isAIAssistantOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between font-sans">
      
      {/* Header */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">CityTrack AI Assistant</h3>
            <p className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Online • Telemetry Connected</span>
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsAIAssistantOpen(false)}
          className="text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-wrap'
            }`}>
              {msg.text}
            </div>
            <span className="text-[9px] text-slate-500 mt-1 font-mono">{msg.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Questions</span>
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="text-[10px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 transition-colors text-left"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="Ask CityTrack AI anything..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
