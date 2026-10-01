import React from 'react';

interface AboutOpenSourcePageProps {
  onNavigate: (page: string) => void;
}

export const AboutOpenSourcePage: React.FC<AboutOpenSourcePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-slate-800 pb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <span>License: Apache-2.0</span>
            <span aria-hidden="true">·</span>
            <span>Zero Proprietary Lock-In</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            ResQ AI — Open-Source Platform
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Smart Emergency Response & Intelligence Platform built for civilian safety networks, regional first responders, and municipal disaster command centers.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            <a
              href="https://github.com/resq-ai/resq-ai"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow"
            >
              <span>⭐ View on GitHub</span>
            </a>
            <button
              onClick={() => onNavigate('admin')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Launch Live Command Center →
            </button>
          </div>
        </div>

        {/* What is ResQ AI & Why Open Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              What is ResQ AI?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              ResQ AI is an end-to-end incident management platform that converts unstructured crisis reports into actionable operational intelligence. Using natural language processing and spatial heuristics, it categorizes emergencies, calculates severity, suggests unit deployments, detects duplicates, and visualizes live field incidents on an interactive map.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Why Open Source?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Emergency infrastructure should never be gated behind proprietary paywalls or opaque algorithms. Open-source crisis response guarantees auditability, zero vendor lock-in, data sovereignty for municipalities, and rapid adaptability for humanitarian missions and disaster response teams worldwide.
            </p>
          </div>
        </div>

        {/* Technology Stack Architecture */}
        <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Full-Stack Technology Architecture
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
              <span className="font-bold text-cyan-400 block font-mono">Frontend</span>
              <ul className="text-slate-300 space-y-1">
                <li>• React 19 & TypeScript</li>
                <li>• Tailwind CSS & Lucide Icons</li>
                <li>• Leaflet + OpenStreetMap</li>
                <li>• Recharts Analytics</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
              <span className="font-bold text-red-400 block font-mono">Backend</span>
              <ul className="text-slate-300 space-y-1">
                <li>• Python 3.11+</li>
                <li>• FastAPI Web Framework</li>
                <li>• Pydantic v2 Schemas</li>
                <li>• Uvicorn ASGI Server</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
              <span className="font-bold text-emerald-400 block font-mono">Database & Auth</span>
              <ul className="text-slate-300 space-y-1">
                <li>• Supabase PostgreSQL</li>
                <li>• PostGIS Geo Extension</li>
                <li>• Row-Level Security (RLS)</li>
                <li>• Supabase Realtime</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
              <span className="font-bold text-amber-400 block font-mono">AI & Embeddings</span>
              <ul className="text-slate-300 space-y-1">
                <li>• Hugging Face Transformers</li>
                <li>• Sentence Transformers</li>
                <li>• all-MiniLM-L6-v2 Embeddings</li>
                <li>• Zero-Shot BART Classifier</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Run Locally Guide */}
        <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            How to Run Locally
          </h2>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 font-sans font-semibold block mb-1">
                1. Clone Repository
              </span>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300">
                <code>git clone https://github.com/resq-ai/resq-ai.git<br/>cd resq-ai</code>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-sans font-semibold block mb-1">
                2. Run with Docker Compose (Frontend + FastAPI + PostgreSQL)
              </span>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300">
                <code>docker compose up --build</code>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-sans font-semibold block mb-1">
                3. Or Run Frontend & Backend Independently
              </span>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 space-y-1">
                <div className="text-slate-500"># Terminal 1: Backend</div>
                <div>cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000</div>
                <div className="text-slate-500 mt-2"># Terminal 2: Frontend</div>
                <div>cd frontend && npm install && npm run dev</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Guide */}
        <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Contributing to ResQ AI
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            We welcome contributions from emergency service personnel, disaster response researchers, and software engineers! Guidelines for pull requests, model fine-tuning datasets, and unit testing can be found in <code className="text-cyan-400 bg-slate-950 px-1 py-0.5 rounded">docs/contributing.md</code>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('report')}
              className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
            >
              Test Emergency Reporting Flow →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
