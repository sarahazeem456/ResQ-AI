import React, { useState } from 'react';
import { Incident } from '../types';
import { answerCommanderQuery } from '../services/aiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

const PRESET_QUERIES = [
  'What are the critical incidents?',
  'Which incidents need medical assistance?',
  'Are there duplicate reports?',
  'Summarize today\'s emergency activity.',
  'Which incidents are still unresolved?'
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onSelectIncident
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'ResQ AI Tactical Dispatch Assistant online. I have live telemetry over all incidents in this sector. How can I assist with triage, unit dispatch, or situational summaries?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = answerCommanderQuery(q, incidents);
      const aiMsg: ChatMessage = {
        sender: 'assistant',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Commander AI Assistant
              </h3>
              <p className="text-[11px] text-slate-400">
                Natural Language Intelligence over Live Incident Records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/30">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-red-600/90 text-white border border-red-500/40'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">{m.time}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-1">Synthesizing live incident data...</span>
            </div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950/50">
          <div className="text-[11px] text-slate-400 font-medium mb-1.5">Common Commander Queries:</div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUERIES.map((pq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(pq)}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                {pq}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask commander assistant about active incidents, medical needs, duplicates..."
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-none rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Query
          </button>
        </form>
      </div>
    </div>
  );
};
