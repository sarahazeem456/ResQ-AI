import React, { useState } from 'react';
import { AIAnalysisResult, DuplicateDetectionResult, Incident } from '../types';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { analyzeEmergencyReport, detectDuplicateIncident } from '../services/aiService';
import { IncidentStore } from '../services/incidentStore';

interface AIAnalysisPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState(
    'There has been a major road accident near the university. Two people appear injured.'
  );
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(() =>
    analyzeEmergencyReport('There has been a major road accident near the university. Two people appear injured.', 'Accident', 2)
  );
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(() => {
    const existing = IncidentStore.getIncidents();
    return detectDuplicateIncident('There has been a major road accident near the university. Two people appear injured.', 37.7789, -122.4214, existing);
  });
  const [showJson, setShowJson] = useState(false);

  const handleRunAnalysis = () => {
    const res = analyzeEmergencyReport(inputText);
    setAnalysis(res);
    const existing = IncidentStore.getIncidents();
    const dup = detectDuplicateIncident(inputText, 37.7789, -122.4214, existing);
    setDuplicateResult(dup);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Open-Source AI Evaluation Workbench
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight mt-1">
            AI Emergency Triage Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Zero proprietary lock-in. Compatible with Hugging Face Transformers, Mistral, Llama, and Sentence Transformers embeddings.
          </p>
        </div>

        {/* Input Sandbox */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Emergency Report Text Input
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunAnalysis}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Execute AI Pipeline
              </button>
              <button
                type="button"
                onClick={() => setShowJson(!showJson)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono cursor-pointer border border-slate-700"
              >
                {showJson ? 'Hide Raw JSON' : 'Show Structured JSON'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Presets:</span>
              <button
                onClick={() => setInputText('There has been a major road accident near the university. Two people appear injured.')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Road Accident (Demo)
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setInputText('Black smoke and intense flames pouring from commercial warehouse chemical storage.')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Fire Hazard
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setInputText('Elderly man collapsed at train station platform, breathing shallow with chest pain.')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Cardiac Medical
              </button>
            </div>
          </div>
        </div>

        {/* Structured JSON Output if toggled */}
        {showJson && analysis && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
            <div className="text-[11px] text-slate-400 uppercase font-sans font-bold mb-2">
              FastAPI Structured Pydantic Payload
            </div>
            <pre>{JSON.stringify(analysis, null, 2)}</pre>
          </div>
        )}

        {/* AI Analysis Visual Card */}
        {analysis && (
          <AIAnalysisCard
            analysis={analysis}
            duplicateResult={duplicateResult || undefined}
          />
        )}

        {/* Hugging Face / Transformers Implementation Snippet */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Open-Source Architecture (Hugging Face / Python Transformers)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">backend/app/ai/pipeline.py</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80">
            <code>{`from transformers import pipeline
from sentence_transformers import SentenceTransformer

# 1. Zero-Shot Emergency Classifier
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# 2. Duplicate Detection via Vector Embeddings
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def triage_emergency(text: str):
    labels = ["Accident", "Medical", "Fire", "Personal Safety", "Flood"]
    result = classifier(text, candidate_labels=labels)
    return {"category": result["labels"][0], "confidence": round(result["scores"][0] * 100, 2)}`}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
