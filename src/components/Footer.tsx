import React from 'react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="font-semibold text-slate-200">ResQ AI</span>
            <span aria-hidden="true">·</span>
            <span>Open-Source Emergency Intelligence Platform</span>
            <span aria-hidden="true">·</span>
            <span>Apache-2.0</span>
          </div>
          <p className="text-slate-500 max-w-xl text-[11px] leading-relaxed">
            Automated intelligence assistance only. Not a substitute for 911/112 public safety answering points or human dispatcher authority.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => onNavigate('opensource')}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            GitHub Architecture & Code
          </button>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <button
            onClick={() => onNavigate('admin')}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Command Center
          </button>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <button
            onClick={() => onNavigate('report')}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Report Portal
          </button>
        </div>
      </div>
    </footer>
  );
};
