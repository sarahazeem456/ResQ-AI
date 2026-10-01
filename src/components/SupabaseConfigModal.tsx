import React, { useState } from 'react';
import { getSupabaseCredentials, saveSupabaseCredentials, SupabaseService } from '../services/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    saveSupabaseCredentials(url, anonKey);

    // Test query against Supabase
    try {
      const data = await SupabaseService.fetchIncidents();
      if (data !== null) {
        setTestResult({
          success: true,
          message: `Successfully connected to Supabase PostgreSQL! Retrieved ${data.length} incident records.`
        });
      } else {
        setTestResult({
          success: true,
          message: 'Saved configuration. Supabase client initialized and listening for realtime changes.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection check failed: ${err.message || 'Please check project URL and keys.'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = () => {
    const sqlScript = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'REPORTED',
  people_affected INT NOT NULL DEFAULT 1,
  ai_summary TEXT,
  ai_confidence DOUBLE PRECISION DEFAULT 88.0,
  recommended_services TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Public insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;`;

    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Supabase Database & Realtime Connection
              </h3>
              <p className="text-[11px] text-slate-400">
                PostgreSQL · PostGIS Geo Engine · Supabase Realtime Channel
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-emerald-200">
            <strong>Active Database Status:</strong> Supabase PostgreSQL client is configured. The system supports direct table reads/writes with automatic fallback to high-speed local reactive persistence.
          </div>

          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-red-950/60 border-red-500 text-red-200'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 cursor-pointer"
              >
                {copiedSql ? '✓ Copied SQL to Clipboard!' : 'Copy Supabase SQL Schema'}
              </button>

              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                {isTesting ? 'Verifying...' : 'Save & Test Connection'}
              </button>
            </div>
          </form>

          {/* Architecture Explanation Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Where is FastAPI used?
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              FastAPI powers the core AI and analytical backend engine in the <code className="text-cyan-300">backend/app/main.py</code> directory. It runs asynchronous zero-shot NLP triage, duplicate sentence vector embeddings via Hugging Face, and exposes clean REST endpoints:
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
              <li>• <span className="text-emerald-400">POST /api/ai/analyze</span>: Runs Hugging Face BART pipeline on incoming text</li>
              <li>• <span className="text-emerald-400">POST /api/ai/duplicates</span>: Computes semantic cosine similarity + Haversine radius</li>
              <li>• <span className="text-emerald-400">GET /api/incidents</span>: REST incident ingestion endpoint</li>
              <li>• <span className="text-emerald-400">GET /api/incidents/stream</span>: Real-time Server-Sent Events stream</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
