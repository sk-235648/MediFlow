'use client';

import React from 'react';
import { Activity, ShieldCheck, Database, PhoneCall, BarChart2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenKnowledge: () => void;
  onOpenMetrics: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenKnowledge,
  onOpenMetrics,
  onReset,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
          <Activity className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">MediFlow</h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Autonomous Triage Agent
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            LangGraph Multi-Agent Architecture • ESI v5 Protocol • 95% Grounded RAG
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Knowledge Base */}
        <button
          onClick={onOpenKnowledge}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition"
          title="Browse clinical RAG guidelines"
        >
          <Database className="h-3.5 w-3.5 text-cyan-400" />
          <span className="hidden md:inline">Clinical RAG</span>
        </button>

        {/* Safety & Eval Metrics */}
        <button
          onClick={onOpenMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition"
          title="View 25% hallucination reduction & safety metrics"
        >
          <BarChart2 className="h-3.5 w-3.5 text-teal-400" />
          <span className="hidden md:inline">Safety & Eval (-25%)</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Reset triage session"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Emergency Hotline Button */}
        <a
          href="tel:911"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition animate-pulse-subtle"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Emergency 911</span>
        </a>
      </div>
    </header>
  );
};
