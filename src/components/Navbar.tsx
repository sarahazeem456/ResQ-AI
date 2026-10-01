import React from 'react';
import { UserProfile } from '../services/authService';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element brand wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="text-lg font-bold tracking-tight text-white hover:text-red-400 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-fast inline-block"></span>
          <span>ResQ AI</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('admin')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              currentPage === 'admin' ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Command Center
          </button>
          <button
            onClick={() => onNavigate('report')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              currentPage === 'report' ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Report Emergency
          </button>
          <button
            onClick={() => onNavigate('sos')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              currentPage === 'sos' ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Instant SOS
          </button>
          <button
            onClick={() => onNavigate('status')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              currentPage === 'status' ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Incident Tracker
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              currentPage === 'dashboard' ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            My Activity
          </button>
          <button
            onClick={() => onNavigate('opensource')}
            className={`cursor-pointer transition-colors whitespace-nowrap ${
              currentPage === 'opensource' ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Open Source
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('sos')}
            className="px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase text-white bg-red-600 hover:bg-red-500 rounded-md transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            🚨 SOS
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-xs text-slate-300 hover:text-white font-medium border border-slate-700 hover:border-slate-600 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
              >
                {currentUser.role === 'admin' ? 'Commander Ops' : currentUser.full_name}
              </button>
              <button
                onClick={onLogout}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
                title="Sign out"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
