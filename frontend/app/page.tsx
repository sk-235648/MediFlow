'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { VitalsMonitor, VitalsState } from '@/components/VitalsMonitor';
import { ChatInterface } from '@/components/ChatInterface';
import { AgentThoughtTrace, AgentThought } from '@/components/AgentThoughtTrace';
import { TriageCard, EsiCardData } from '@/components/TriageCard';
import { KnowledgeModal } from '@/components/KnowledgeModal';
import { SafetyMetricsModal } from '@/components/SafetyMetricsModal';
import { ShieldAlert } from 'lucide-react';

export default function Home() {
  const [vitals, setVitals] = useState<VitalsState>({
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    spo2: '',
    temperature_c: '',
    pain_level: 0,
  });

  const [thoughts, setThoughts] = useState<AgentThought[]>([]);
  const [esiCard, setEsiCard] = useState<EsiCardData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string>('');

  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState<boolean>(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);

  const handleSelectScenario = (prompt: string, presetVitals: Partial<VitalsState>) => {
    setActivePrompt(prompt);
    setVitals((prev) => ({
      ...prev,
      ...presetVitals,
    }));
  };

  const handleReset = () => {
    setThoughts([]);
    setEsiCard(null);
    setActivePrompt('');
    setVitals({
      heart_rate: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      spo2: '',
      temperature_c: '',
      pain_level: 0,
    });
  };

  const handleStartTriage = () => {
    setThoughts([]);
    setEsiCard(null);
  };

  const handleNewThought = (thought: AgentThought) => {
    setThoughts((prev) => [...prev, thought]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        onOpenKnowledge={() => setIsKnowledgeOpen(true)}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onReset={handleReset}
      />

      {/* Main Clinical Cockpit */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (4 cols): Vitals & Rapid Presets */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <VitalsMonitor
              vitals={vitals}
              onChange={setVitals}
              onSelectScenario={handleSelectScenario}
            />
            {/* Thought trace placed here on desktop for optimal balance */}
            <AgentThoughtTrace
              thoughts={thoughts}
              isProcessing={isProcessing}
            />
          </div>

          {/* Center Column (4 cols): Real-Time Streaming Triage Chat */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <ChatInterface
              vitals={vitals}
              onNewThought={handleNewThought}
              onNewAssessment={setEsiCard}
              onStartTriage={handleStartTriage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              activePrompt={activePrompt}
              setActivePrompt={setActivePrompt}
            />
          </div>

          {/* Right Column (4 cols): Triage Assessment Card & Clinical Decisions */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <TriageCard card={esiCard} />
          </div>
        </div>

        {/* Clinical Disclaimer Banner */}
        <footer className="mt-auto border-t border-slate-900 pt-4 pb-6 px-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              <strong>Clinical Assistive Notice:</strong> MediFlow is an autonomous multi-agent triage system for symptom prioritization and decision support. In a medical emergency, call 911 immediately.
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            MediFlow v1.0.0 • LangGraph Multi-Agent • RAG Grounded
          </div>
        </footer>
      </main>

      {/* Modals */}
      <KnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />

      <SafetyMetricsModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />
    </div>
  );
}
