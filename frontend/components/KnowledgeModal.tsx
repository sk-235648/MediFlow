'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Database, BookOpen, Layers, ShieldCheck } from 'lucide-react';

interface ProtocolChunk {
  chunk_id: string;
  source_file: string;
  title: string;
  section: string;
  content: string;
  esi_level?: number;
  similarity_score?: number;
}

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ isOpen, onClose }) => {
  const [protocols, setProtocols] = useState<ProtocolChunk[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolChunk | null>(null);

  useEffect(() => {
    if (isOpen && protocols.length === 0) {
      loadProtocols();
    }
  }, [isOpen]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const loadProtocols = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/protocols`);
      const data = await res.json();
      if (data.protocols) {
        setProtocols(data.protocols);
        if (data.protocols.length > 0) {
          setSelectedProtocol(data.protocols[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load clinical protocols:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadProtocols();
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.protocols) {
        setProtocols(data.protocols);
        if (data.protocols.length > 0) {
          setSelectedProtocol(data.protocols[0]);
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[640px] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Clinical RAG Knowledge Base</h2>
              <p className="text-xs text-slate-400">
                Peer-reviewed clinical guidelines, ESI v5 algorithms & emergency red-flag protocols
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="p-4 border-b border-slate-800 bg-slate-950/40 flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clinical protocols (e.g. 'stroke', 'chest pain', 'ESI Level 2', 'dyspnea')..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition"
          >
            Search
          </button>
        </form>

        {/* Content Explorer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Protocol Index */}
          <div className="w-1/3 border-r border-slate-800 overflow-y-auto p-2 space-y-1.5">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">Querying RAG vectors...</div>
            ) : protocols.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No matching protocols found.</div>
            ) : (
              protocols.map((p) => {
                const isSelected = selectedProtocol?.chunk_id === p.chunk_id;
                return (
                  <button
                    key={p.chunk_id}
                    onClick={() => setSelectedProtocol(p)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition border ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-900/40 border-transparent text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 truncate">{p.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{p.section}</div>
                    {p.esi_level && (
                      <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        ESI Level {p.esi_level}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right Protocol Detail */}
          <div className="w-2/3 p-5 overflow-y-auto bg-slate-950/50">
            {selectedProtocol ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedProtocol.title}</h3>
                    <div className="text-xs text-cyan-400 font-medium">{selectedProtocol.section}</div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Source: {selectedProtocol.source_file}
                  </span>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  {selectedProtocol.content}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                <BookOpen className="h-8 w-8 text-slate-700 mb-2" />
                Select a protocol to inspect clinical evidence
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
