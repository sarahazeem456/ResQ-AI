export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'citizen';
  badge_number?: string;
  agency?: string;
}

const STORAGE_KEY_AUTH = 'resq_ai_auth_user';

export const AuthService = {
  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) {
      // Default to logged-in Dispatcher / Admin for immediate command capability in demo,
      // or citizen if needed
      const defaultUser: UserProfile = {
        id: 'usr-admin-01',
        email: 'commander@resq.ai',
        full_name: 'Commander Sarah Jenkins',
        role: 'admin',
        badge_number: 'CMD-902',
        agency: 'Metro Emergency Communications'
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(defaultUser));
      return defaultUser;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  login(email: string, _password?: string, asAdmin = false): UserProfile {
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: asAdmin || email.includes('admin') || email.includes('commander')
        ? 'Commander Sarah Jenkins'
        : email.split('@')[0],
      role: asAdmin || email.includes('admin') || email.includes('commander') ? 'admin' : 'citizen',
      badge_number: asAdmin ? 'DISPATCH-404' : undefined,
      agency: asAdmin ? 'Metro Emergency Services' : undefined
    };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('resq_auth_change'));
    return user;
  },

  register(email: string, fullName: string, role: 'admin' | 'citizen'): UserProfile {
    const user: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: fullName,
      role,
      badge_number: role === 'admin' ? `DSP-${Math.floor(Math.random() * 900 + 100)}` : undefined,
      agency: role === 'admin' ? 'Regional Dispatch & Triage' : undefined
    };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('resq_auth_change'));
    return user;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    window.dispatchEvent(new CustomEvent('resq_auth_change'));
  }
};
