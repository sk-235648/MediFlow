'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { VitalsState } from './VitalsMonitor';
import { AgentThought } from './AgentThoughtTrace';
import { EsiCardData } from './TriageCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  vitals: VitalsState;
  onNewThought: (thought: AgentThought) => void;
  onNewAssessment: (card: EsiCardData) => void;
  setIsProcessing: (loading: boolean) => void;
  isProcessing: boolean;
  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  vitals,
  onNewThought,
  onNewAssessment,
  setIsProcessing,
  isProcessing,
  activePrompt,
  setActivePrompt,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to **MediFlow Autonomous Triage**. I am your clinical agent assistant. Please describe your symptoms, onset, and any acute concerns, or select a clinical preset on the left to start triage.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync active prompt if preset clicked
  useEffect(() => {
    if (activePrompt) {
      setInput(activePrompt);
    }
  }, [activePrompt]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isProcessing) return;

    // Add user message
    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setActivePrompt('');
    setIsProcessing(true);

    // Prepare assistant placeholder message
    const assistantMsgIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_BASE}/api/triage/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          vitals: {
            heart_rate: vitals.heart_rate === '' ? undefined : vitals.heart_rate,
            blood_pressure_systolic: vitals.blood_pressure_systolic === '' ? undefined : vitals.blood_pressure_systolic,
            blood_pressure_diastolic: vitals.blood_pressure_diastolic === '' ? undefined : vitals.blood_pressure_diastolic,
            spo2: vitals.spo2 === '' ? undefined : vitals.spo2,
            temperature_c: vitals.temperature_c === '' ? undefined : vitals.temperature_c,
            pain_level: vitals.pain_level
          },
          chat_history: messages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              const dataStr = line.replace('data:', '').trim();
              if (!dataStr) continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (currentEvent === 'thought') {
                  onNewThought(parsed);
                } else if (currentEvent === 'token') {
                  setMessages((prev) => {
                    const copy = [...prev];
                    const target = copy[copy.length - 1];
                    if (target && target.role === 'assistant') {
                      target.content += parsed.text || '';
                    }
                    return copy;
                  });
                } else if (currentEvent === 'assessment') {
                  onNewAssessment(parsed);
                } else if (currentEvent === 'done') {
                  setIsProcessing(false);
                }
              } catch (err) {
                console.error('Error parsing SSE event data:', err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Triage stream error:', error);
      setMessages((prev) => {
        const copy = [...prev];
        const target = copy[copy.length - 1];
        if (target && target.role === 'assistant') {
          target.content = '⚠️ Connection error contacting the MediFlow backend engine. Please ensure the FastAPI server is running on port 8000.';
        }
        return copy;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[580px] overflow-hidden border border-slate-800">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg, i) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in ${isAssistant ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAssistant
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-sm'
                    : 'bg-teal-600 text-white font-medium shadow-md shadow-teal-600/20'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-[10px] mt-1.5 font-mono ${
                    isAssistant ? 'text-slate-500' : 'text-teal-200'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex gap-3 items-center text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 p-2.5 rounded-xl max-w-sm">
            <Sparkles className="h-4 w-4 animate-spin shrink-0" />
            <span>Autonomous agents collaborating on clinical assessment...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe symptoms (e.g. 'Severe chest pain radiating to left shoulder...')"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          disabled={isProcessing}
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:hover:bg-teal-500 text-slate-950 font-bold transition shadow-lg shadow-teal-500/20"
          title="Send patient message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
