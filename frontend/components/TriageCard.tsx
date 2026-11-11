'use client';

import React from 'react';
import { AlertTriangle, Clock, MapPin, CheckCircle2, BookOpen, Printer, Download, ShieldCheck } from 'lucide-react';

export interface Citation {
  title: string;
  section: string;
  similarity: number;
}

export interface EsiCardData {
  esi_level: number;
  acuity_label: string;
  badge_text: string;
  color_hex: string;
  recommended_venue: string;
  time_window: string;
  clinical_rationale: string;
  immediate_actions: string[];
  red_flags: string[];
  citations: Citation[];
  vitals_evaluated: Record<string, any>;
  hallucination_score: number;
  factual_accuracy: number;
  safety_status: string;
  generated_at: string;
}

interface TriageCardProps {
  card: EsiCardData | null;
}

export const TriageCard: React.FC<TriageCardProps> = ({ card }) => {
  if (!card) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-500 border-dashed border-slate-800 min-h-[320px]">
        <AlertTriangle className="h-10 w-10 text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-400">No Assessment Generated Yet</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Submit symptoms or click a preset clinical test case to trigger autonomous LangGraph triage.
        </p>
      </div>
    );
  }

  const isEmergency = card.esi_level <= 2;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediflow_triage_esi_${card.esi_level}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col gap-4 border-2 transition ${isEmergency ? 'border-rose-500/60 pulse-glow-rose' : 'border-teal-500/40 pulse-glow-teal'}`}>
      {/* Top Badge & ESI Level */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs uppercase font-extrabold px-3 py-1 rounded-full text-white tracking-wider"
              style={{ backgroundColor: card.color_hex }}
            >
              ESI LEVEL {card.esi_level}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {card.badge_text}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {card.acuity_label}
          </h2>
        </div>

        {/* Export / Print */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Print Clinical Triage Summary"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Download JSON Report"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Recommended Venue & Care Window */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <MapPin className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Recommended Care Venue
            </span>
            <span className="text-xs font-bold text-slate-100">
              {card.recommended_venue}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Target Evaluation Window
            </span>
            <span className="text-xs font-bold text-slate-100">
              {card.time_window}
            </span>
          </div>
        </div>
      </div>

      {/* Red Flags Alert */}
      {card.red_flags && card.red_flags.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/50 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-1.5">
            <AlertTriangle className="h-4 w-4" />
            <span>Critical Red Flags Detected ({card.red_flags.length})</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-0.5">
            {card.red_flags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Clinical Rationale */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Clinical Rationale
        </span>
        <p className="text-xs text-slate-300 leading-relaxed">
          {card.clinical_rationale}
        </p>
      </div>

      {/* Immediate Actions Checklist */}
      {card.immediate_actions && card.immediate_actions.length > 0 && (
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Immediate Recommended Actions
          </span>
          <div className="space-y-1.5">
            {card.immediate_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAG Citations & Factual Grounding Footer */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          <span>Grounded in: <strong>{card.citations?.[0]?.title || 'ESI Guidelines'}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" /> {card.factual_accuracy}% Grounded
          </span>
          <span className="text-slate-500 font-mono">
            Safety: {card.safety_status}
          </span>
        </div>
      </div>
    </div>
  );
};
