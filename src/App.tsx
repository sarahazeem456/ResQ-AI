import { useState, useEffect } from 'react';
import { CommandStats, Incident } from './types';
import { IncidentStore } from './services/incidentStore';
import { AuthService, UserProfile } from './services/authService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { EmergencyReportPage } from './pages/EmergencyReportPage';
import { SOSPage } from './pages/SOSPage';
import { IncidentStatusPage } from './pages/IncidentStatusPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminCommandCenter } from './pages/AdminCommandCenter';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { AboutOpenSourcePage } from './pages/AboutOpenSourcePage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [navParams, setNavParams] = useState<any>({});
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(AuthService.getCurrentUser());
  const [stats, setStats] = useState<CommandStats>(IncidentStore.getStats());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sound alert synthesizer (Web Audio API - polite, soft alert)
  const playTacticalChime = (type: 'emergency' | 'dispatch' | 'resolve') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'emergency') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'dispatch') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext might be blocked until user gesture, graceful silent bypass
    }
  };

  const addToast = (type: 'emergency' | 'dispatch' | 'success' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setToasts(prev => [newToast, ...prev].slice(0, 4));
    playTacticalChime(type === 'emergency' ? 'emergency' : type === 'dispatch' ? 'dispatch' : 'resolve');

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6500);
  };

  // Sync state on IncidentStore updates
  useEffect(() => {
    const unsubscribe = IncidentStore.subscribe(() => {
      setStats(IncidentStore.getStats());
    });

    const handleAuthChange = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };

    window.addEventListener('resq_auth_change', handleAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener('resq_auth_change', handleAuthChange);
    };
  }, []);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIncidentCreated = (incident: Incident) => {
    addToast(
      'emergency',
      `New ${incident.severity} ${incident.type} Alert`,
      `Incident #${incident.id} logged. AI assigned ${incident.recommended_services.join(', ')}.`
    );
  };

  const handleLogout = () => {
    AuthService.logout();
    addToast('info', 'Session Ended', 'Logged out of ResQ AI tactical console.');
    handleNavigate('landing');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      {/* Top Bar Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Page Content */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage onNavigate={handleNavigate} stats={stats} />
        )}

        {currentPage === 'report' && (
          <EmergencyReportPage
            onNavigate={handleNavigate}
            prefillDescription={navParams.prefill || ''}
            onNewIncidentCreated={handleIncidentCreated}
          />
        )}

        {currentPage === 'sos' && (
          <SOSPage
            onNavigate={handleNavigate}
            onNewIncidentCreated={handleIncidentCreated}
          />
        )}

        {currentPage === 'status' && (
          <IncidentStatusPage
            onNavigate={handleNavigate}
            incidentId={navParams.id}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage
            onNavigate={handleNavigate}
            onLoginSuccess={user => {
              setCurrentUser(user);
              addToast('success', 'Authenticated', `Welcome back, ${user.full_name}`);
            }}
          />
        )}

        {currentPage === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onLoginSuccess={user => {
              setCurrentUser(user);
              addToast('success', 'Account Registered', `Welcome to ResQ AI, ${user.full_name}`);
            }}
          />
        )}

        {currentPage === 'dashboard' && (
          <UserDashboard
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        )}

        {currentPage === 'admin' && (
          <AdminCommandCenter
            onNavigate={handleNavigate}
            stats={stats}
            selectedIncidentId={navParams.selectedId}
          />
        )}

        {currentPage === 'details' && (
          <IncidentDetailsPage
            incidentId={navParams.id || '1042'}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'ai_analysis' && (
          <AIAnalysisPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'opensource' && (
          <AboutOpenSourcePage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))}
      />

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
