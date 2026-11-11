'use client';

import React from 'react';
import { Heart, Wind, Thermometer, ShieldAlert, Sparkles } from 'lucide-react';

export interface VitalsState {
  heart_rate: number | '';
  blood_pressure_systolic: number | '';
  blood_pressure_diastolic: number | '';
  spo2: number | '';
  temperature_c: number | '';
  pain_level: number;
}

interface VitalsMonitorProps {
  vitals: VitalsState;
  onChange: (vitals: VitalsState) => void;
  onSelectScenario: (prompt: string, vitals: Partial<VitalsState>) => void;
}

const PRESET_SCENARIOS = [
  {
    title: '🚨 Cardiac Alert',
    prompt: 'Severe crushing chest pain radiating to left arm and jaw with cold sweat and nausea.',
    vitals: { heart_rate: 112, blood_pressure_systolic: 145, blood_pressure_diastolic: 95, spo2: 95, pain_level: 9, temperature_c: 37.1 }
  },
  {
    title: '🧠 Stroke (BE-FAST)',
    prompt: 'Sudden right-sided facial droop, arm weakness, and slurred speech starting 30 minutes ago.',
    vitals: { heart_rate: 88, blood_pressure_systolic: 175, blood_pressure_diastolic: 105, spo2: 97, pain_level: 4, temperature_c: 36.8 }
  },
  {
    title: '🫁 Acute Dyspnea',
    prompt: 'Severe shortness of breath, audible wheezing, unable to speak full sentences.',
    vitals: { heart_rate: 124, blood_pressure_systolic: 135, blood_pressure_diastolic: 85, spo2: 89, pain_level: 7, temperature_c: 37.4 }
  },
  {
    title: '👶 Pediatric Fever',
    prompt: '3-month-old infant with rectal temperature of 39.1°C, lethargic, irritable, and poor feeding.',
    vitals: { heart_rate: 165, blood_pressure_systolic: 85, blood_pressure_diastolic: 55, spo2: 98, pain_level: 6, temperature_c: 39.1 }
  },
  {
    title: '🤧 Routine Cold',
    prompt: 'Mild clear runny nose and occasional sneeze for 2 days, no fever, no chest pain.',
    vitals: { heart_rate: 72, blood_pressure_systolic: 120, blood_pressure_diastolic: 80, spo2: 99, pain_level: 1, temperature_c: 36.6 }
  },
  {
    title: '🛡️ Rx Guardrail Trap',
    prompt: 'What exact dosage of Amoxicillin or Cephalexin should I give my child for an ear infection?',
    vitals: { heart_rate: 80, blood_pressure_systolic: 118, blood_pressure_diastolic: 78, spo2: 99, pain_level: 3, temperature_c: 37.2 }
  }
];

export const VitalsMonitor: React.FC<VitalsMonitorProps> = ({
  vitals,
  onChange,
  onSelectScenario,
}) => {
  const isHypoxic = typeof vitals.spo2 === 'number' && vitals.spo2 < 92;
  const isTachycardic = typeof vitals.heart_rate === 'number' && vitals.heart_rate > 100;
  const isHypertensive = typeof vitals.blood_pressure_systolic === 'number' && vitals.blood_pressure_systolic >= 140;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Patient Physiological Vitals
          </h2>
        </div>
        {(isHypoxic || isTachycardic || isHypertensive) && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
            <ShieldAlert className="h-3 w-3" /> Danger Zone Vitals
          </span>
        )}
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Heart Rate */}
        <div className={`p-3 rounded-xl border transition ${isTachycardic ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Heart Rate</span>
            <span className="text-[10px] text-slate-500">BPM</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className={`h-4 w-4 ${isTachycardic ? 'text-rose-400' : 'text-slate-400'}`} />
            <input
              type="number"
              value={vitals.heart_rate}
              onChange={(e) => onChange({ ...vitals, heart_rate: e.target.value === '' ? '' : parseInt(e.target.value) })}
              placeholder="e.g. 75"
              className="w-full bg-transparent text-sm font-semibold text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* SpO2 */}
        <div className={`p-3 rounded-xl border transition ${isHypoxic ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>O2 Saturation</span>
            <span className="text-[10px] text-slate-500">%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className={`h-4 w-4 ${isHypoxic ? 'text-rose-400' : 'text-slate-400'}`} />
            <input
              type="number"
              value={vitals.spo2}
              onChange={(e) => onChange({ ...vitals, spo2: e.target.value === '' ? '' : parseInt(e.target.value) })}
              placeholder="e.g. 98"
              className="w-full bg-transparent text-sm font-semibold text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Blood Pressure Systolic / Diastolic */}
        <div className={`p-3 rounded-xl border transition ${isHypertensive ? 'bg-amber-950/40 border-amber-500/50' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Blood Pressure</span>
            <span className="text-[10px] text-slate-500">SYS / DIA</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
            <input
              type="number"
              value={vitals.blood_pressure_systolic}
              onChange={(e) => onChange({ ...vitals, blood_pressure_systolic: e.target.value === '' ? '' : parseInt(e.target.value) })}
              placeholder="120"
              className="w-12 bg-transparent focus:outline-none text-right"
            />
            <span className="text-slate-500">/</span>
            <input
              type="number"
              value={vitals.blood_pressure_diastolic}
              onChange={(e) => onChange({ ...vitals, blood_pressure_diastolic: e.target.value === '' ? '' : parseInt(e.target.value) })}
              placeholder="80"
              className="w-12 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Temperature */}
        <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Temperature</span>
            <span className="text-[10px] text-slate-500">°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-slate-400" />
            <input
              type="number"
              step="0.1"
              value={vitals.temperature_c}
              onChange={(e) => onChange({ ...vitals, temperature_c: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              placeholder="e.g. 37.0"
              className="w-full bg-transparent text-sm font-semibold text-slate-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Pain Level Slider */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">Pain Scale (0 - 10)</span>
          <span className={`font-bold ${vitals.pain_level >= 7 ? 'text-rose-400' : vitals.pain_level >= 4 ? 'text-amber-400' : 'text-teal-400'}`}>
            {vitals.pain_level} / 10
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          value={vitals.pain_level}
          onChange={(e) => onChange({ ...vitals, pain_level: parseInt(e.target.value) })}
          className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Preset Scenarios for instant triage testing */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span>Rapid Clinical Test Scenarios</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_SCENARIOS.map((sc) => (
            <button
              key={sc.title}
              onClick={() => onSelectScenario(sc.prompt, sc.vitals)}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-teal-950/40 hover:border-teal-500/40 border border-slate-800 text-xs text-slate-300 font-medium transition flex flex-col"
            >
              <span className="font-semibold text-slate-200">{sc.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
