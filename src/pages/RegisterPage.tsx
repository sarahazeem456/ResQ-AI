import React, { useState } from 'react';
import { AuthService, UserProfile } from '../services/authService';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onLoginSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'citizen'>('citizen');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;

    const user = AuthService.register(email, fullName, role);
    onLoginSuccess(user);
    if (role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Create ResQ AI Account
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Join the open-source community crisis response network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 py-8 px-4 shadow-2xl border border-slate-800 rounded-xl sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Marcus Vance"
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-role" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Account Authority Type
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'citizen')}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="citizen">Civilian Reporter / Resident</option>
                <option value="admin">Command Center Dispatcher / Responder (Admin)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-red-600/30 transition-colors cursor-pointer"
            >
              Register & Continue
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
