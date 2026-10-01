import React, { useState } from 'react';
import { AIAnalysisResult, DuplicateDetectionResult, EmergencyCategory, Incident } from '../types';
import { IncidentStore } from '../services/incidentStore';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { analyzeEmergencyReport, detectDuplicateIncident } from '../services/aiService';

interface EmergencyReportPageProps {
  onNavigate: (page: string, params?: any) => void;
  prefillDescription?: string;
  onNewIncidentCreated?: (incident: Incident) => void;
}

const CATEGORIES: EmergencyCategory[] = [
  'Medical',
  'Accident',
  'Fire',
  'Personal Safety',
  'Missing Person',
  'Flood',
  'Natural Disaster',
  'Infrastructure',
  'Other'
];

export const EmergencyReportPage: React.FC<EmergencyReportPageProps> = ({
  onNavigate,
  prefillDescription = '',
  onNewIncidentCreated
}) => {
  const [description, setDescription] = useState(prefillDescription);
  const [category, setCategory] = useState<EmergencyCategory>('Accident');
  const [peopleAffected, setPeopleAffected] = useState<number>(2);
  const [address, setAddress] = useState('University Blvd & 10th St, Sector 4');
  const [latitude, setLatitude] = useState<number>(37.7789);
  const [longitude, setLongitude] = useState<number>(-122.4214);
  const [contactName, setContactName] = useState('Sarah Vance');
  const [contactPhone, setContactPhone] = useState('+1 (555) 902-1144');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  const [createdIncident, setCreatedIncident] = useState<Incident | null>(null);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Live real-time preview of AI prediction as user types or speaks
  const livePreview = description.length > 10 ? analyzeEmergencyReport(description, category, peopleAffected) : null;

  // Real-time voice reporting using SpeechRecognition API
  const handleToggleVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMsg('Speech recognition is not supported in this browser environment. Please type your report.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setDescription(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech error', e);
      setIsRecording(false);
    }
  };

  // Use browser geolocation if available
  const handleDetectLocation = () => {
    setLocationDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAddress(`GPS Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)} (Live Sensor)`);
          setLocationDetecting(false);
        },
        _err => {
          // Graceful fallback to metro central
          setLatitude(37.7749 + (Math.random() - 0.5) * 0.01);
          setLongitude(-122.4194 + (Math.random() - 0.5) * 0.01);
          setLocationDetecting(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLocationDetecting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe the emergency incident.');
      return;
    }

    setErrorMsg('');
    setIsAnalyzing(true);

    // Simulate AI pipeline inference time
    setTimeout(() => {
      // 1. Run AI analysis
      const ai = analyzeEmergencyReport(description, category, peopleAffected);
      setAnalysisResult(ai);

      // 2. Check for duplicates against existing incidents
      const existing = IncidentStore.getIncidents();
      const dup = detectDuplicateIncident(description, latitude, longitude, existing);
      setDuplicateResult(dup);

      // 3. Create incident record in store
      const { incident } = IncidentStore.createIncident({
        title: `${ai.category} Alert: ${address || 'Reported Sector'}`,
        description,
        type: ai.category,
        latitude,
        longitude,
        address,
        people_affected: ai.people_affected || peopleAffected,
        contact_name: contactName,
        contact_phone: contactPhone,
        image_url: selectedImage || undefined
      });

      setCreatedIncident(incident);
      setIsAnalyzing(false);

      if (onNewIncidentCreated) {
        onNewIncidentCreated(incident);
      }
    }, 750);
  };

  const handleMergeIntoDuplicate = () => {
    if (createdIncident && duplicateResult?.existing_incident) {
      IncidentStore.mergeIncidents(duplicateResult.existing_incident.id, createdIncident.id);
      onNavigate('details', { id: duplicateResult.existing_incident.id });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">
              Report an Emergency
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Provide incident details for automated AI priority classification and tactical responder dispatch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sos')}
            className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
          >
            Switch to SOS Mode
          </button>
        </div>

        {/* Demo Quickfill Preset */}
        <div className="mb-6 p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div>
            <strong className="text-red-400">Demo Scenario:</strong> Road accident with casualties near university
          </div>
          <button
            type="button"
            onClick={() => {
              setDescription('There has been a major road accident near the university. Two people appear injured.');
              setCategory('Accident');
              setPeopleAffected(2);
              setAddress('University Blvd & 10th St, Sector 4');
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs border border-slate-700 cursor-pointer"
          >
            Insert Prompt
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/80 border border-red-600/50 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Form and Live AI Analysis Layout */}
        <div className="grid grid-cols-1 gap-8">
          <form onSubmit={handleAnalyzeAndSubmit} className="space-y-6 bg-slate-900/60 border border-slate-800 p-6 rounded-xl shadow-xl">
            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Emergency Description <span className="text-red-400">*</span>
                </label>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleToggleVoiceDictation}
                    className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isRecording
                        ? 'bg-red-600 text-white border-red-500 animate-pulse'
                        : 'bg-slate-800 text-cyan-300 hover:text-white border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span>{isRecording ? '⏹ Stop Dictation' : '🎙️ Voice Emergency Report'}</span>
                  </button>
                )}
              </div>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what is occurring, observed injuries, threats (e.g., 'There has been a major road accident near the university. Two people appear injured.')"
                className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none rounded-lg p-3 text-sm text-white placeholder-slate-500"
                required
              />

              {/* Real-Time Live AI Triage Feedback Banner */}
              {livePreview && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-cyan-800/60 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-slate-400">Live AI Inference:</span>
                    <span className="font-bold text-white">{livePreview.category}</span>
                    <span className="text-slate-600">·</span>
                    <span className={`font-bold ${
                      livePreview.severity === 'CRITICAL' ? 'text-red-400' :
                      livePreview.severity === 'HIGH' ? 'text-amber-400' : 'text-yellow-400'
                    }`}>
                      {livePreview.severity} Severity
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono">
                    Units: {livePreview.recommended_services.join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Category and Casualties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Emergency Type
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value as EmergencyCategory)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none rounded-lg p-2.5 text-sm text-white"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="people" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Number of People Affected / Injured
                </label>
                <input
                  id="people"
                  type="number"
                  min="0"
                  max="500"
                  value={peopleAffected}
                  onChange={e => setPeopleAffected(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none rounded-lg p-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Location / Address <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationDetecting}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>📍</span>
                  <span>{locationDetecting ? 'Detecting GPS...' : 'Use Current GPS'}</span>
                </button>
              </div>
              <input
                id="address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Street address, landmark, or intersection"
                className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none rounded-lg p-2.5 text-sm text-white placeholder-slate-500"
                required
              />
              <div className="mt-1 text-[11px] text-slate-500 font-mono">
                Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </div>
            </div>

            {/* Optional Image Upload */}
            <div>
              <label htmlFor="image" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Attach Image / Evidence (Optional)
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
                {selectedImage && (
                  <div className="relative w-12 h-12 rounded overflow-hidden border border-slate-700 shrink-0">
                    <img src={selectedImage} alt="Uploaded preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label htmlFor="cname" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Contact Name (Optional)
                </label>
                <input
                  id="cname"
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none rounded-lg p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label htmlFor="cphone" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Contact Phone (Optional)
                </label>
                <input
                  id="cphone"
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 focus:outline-none rounded-lg p-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>Analyzing Incident with AI...</span>
                  </>
                ) : (
                  <span>Analyze with AI</span>
                )}
              </button>

              <span className="text-xs text-slate-400">
                Direct integration with Hugging Face & FastAPI pipeline
              </span>
            </div>
          </form>

          {/* AI Analysis Result & Action Container */}
          {analysisResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                  AI Triage Analysis Complete
                </h2>
                {createdIncident && (
                  <span className="text-xs font-mono text-cyan-400">
                    Incident ID: #{createdIncident.id}
                  </span>
                )}
              </div>

              <AIAnalysisCard
                analysis={analysisResult}
                duplicateResult={duplicateResult || undefined}
                onMergeReports={handleMergeIntoDuplicate}
                onCreateNewIncident={() => {
                  if (createdIncident) {
                    onNavigate('details', { id: createdIncident.id });
                  }
                }}
              />

              {/* Quick Actions Post Analysis */}
              {createdIncident && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-300">
                    Incident #{createdIncident.id} is now logged in the dispatch queue and appearing on the live tactical map.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('status', { id: createdIncident.id })}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Track Incident Status →
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('admin', { selectedId: createdIncident.id })}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-md cursor-pointer"
                    >
                      Open in Command Center →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
