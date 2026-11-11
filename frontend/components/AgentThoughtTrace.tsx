'use client';

import React from 'react';
import { GitFork, Cpu, ShieldCheck, Database, Compass, CheckCircle, Loader2 } from 'lucide-react';

export interface AgentThought {
  agent_name: string;
  step_type: string;
  thought: string;
  timestamp: string;
}

interface AgentThoughtTraceProps {
  thoughts: AgentThought[];
  isProcessing: boolean;
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  'Symptom & Vitals Extractor': <Cpu className="h-4 w-4 text-cyan-400" />,
  'Clinical RAG Specialist': <Database className="h-4 w-4 text-teal-400" />,
  'Clinical Triage Reasoner': <Compass className="h-4 w-4 text-amber-400" />,
  'Safety & Guardrail Evaluator': <ShieldCheck className="h-4 w-4 text-emerald-400" />,
  'Output Formatter': <CheckCircle className="h-4 w-4 text-blue-400" />,
};

export const AgentThoughtTrace: React.FC<AgentThoughtTraceProps> = ({
  thoughts,
  isProcessing,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-teal-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            LangGraph Multi-Agent Thought Trace
          </h2>
        </div>
        {isProcessing ? (
          <span className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Reasoning in progress...
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            {thoughts.length} Agent State Transitions
          </span>
        )}
      </div>

      {/* Timeline Stream */}
      <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
        {thoughts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            Patient input will activate the multi-agent reasoning graph. Awaiting intake...
          </div>
        ) : (
          thoughts.map((item, idx) => {
            const isRefinement = item.thought.includes('refinement') || item.step_type === 'refinement' || item.thought.includes('Self-Correction');
            const icon = AGENT_ICONS[item.agent_name] || <Cpu className="h-4 w-4 text-slate-400" />;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition animate-fade-in ${
                  isRefinement
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Agent & Step Meta */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-slate-800 border border-slate-700">
                      {icon}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {item.agent_name}
                    </span>
                    {isRefinement && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                        Self-Correction Loop
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {item.timestamp}
                  </span>
                </div>

                {/* Thought Content */}
                <p className="text-xs text-slate-300 leading-relaxed pl-7">
                  {item.thought}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
