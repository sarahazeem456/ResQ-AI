import React, { useState } from 'react';
import { AuthService, UserProfile } from '../services/authService';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('commander@resq.ai');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = AuthService.login(email, password, email.includes('admin') || email.includes('commander'));
    onLoginSuccess(user);
    if (user.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('dashboard');
    }
  };

  const handleQuickCommander = () => {
    setEmail('commander@resq.ai');
    const user = AuthService.login('commander@resq.ai', 'securepass', true);
    onLoginSuccess(user);
    onNavigate('admin');
  };

  const handleQuickCitizen = () => {
    setEmail('citizen@resq.ai');
    const user = AuthService.login('citizen@resq.ai', 'securepass', false);
    onLoginSuccess(user);
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
            ResQ AI Authentication
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Sign In to ResQ AI
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Supabase Authentication Gateway for Commanders, First Responders, and Civilians
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 py-8 px-4 shadow-2xl border border-slate-800 rounded-xl sm:px-10">
          {/* Quick Demo Accounts */}
          <div className="mb-6 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1.5">
              Quick Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickCommander}
                className="py-1.5 px-2 bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-800/60 rounded text-center text-xs font-semibold cursor-pointer"
              >
                Commander Login
              </button>
              <button
                type="button"
                onClick={handleQuickCitizen}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-center text-xs font-semibold cursor-pointer"
              >
                Citizen Portal
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-red-600/30 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an emergency responder account?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
