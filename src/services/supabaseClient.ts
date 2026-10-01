import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Incident } from '../types';

const STORAGE_KEY_SUPABASE_URL = 'resq_supabase_url';
const STORAGE_KEY_SUPABASE_ANON_KEY = 'resq_supabase_anon_key';

// Default / fallback configurations
const DEFAULT_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://demo-project.supabase.co';
const DEFAULT_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo-anon-key';

let currentClient: SupabaseClient | null = null;
let activeRealtimeChannel: RealtimeChannel | null = null;

export function getSupabaseCredentials() {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_URL, anonKey: DEFAULT_ANON_KEY };
  }
  const url = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || DEFAULT_URL;
  const anonKey = localStorage.getItem(STORAGE_KEY_SUPABASE_ANON_KEY) || DEFAULT_ANON_KEY;
  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_SUPABASE_ANON_KEY, anonKey.trim());
  }
  if (activeRealtimeChannel && currentClient) {
    try {
      currentClient.removeChannel(activeRealtimeChannel);
    } catch {
      // ignore
    }
    activeRealtimeChannel = null;
  }
  currentClient = null; // force re-instantiation
  window.dispatchEvent(new CustomEvent('resq_supabase_config_change'));
}

export function getSupabaseClient(): SupabaseClient {
  if (!currentClient) {
    const { url, anonKey } = getSupabaseCredentials();
    try {
      currentClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
    } catch (e) {
      console.warn('Supabase client initialization fallback:', e);
      currentClient = createClient('https://fallback.supabase.co', 'fallback-key');
    }
  }
  return currentClient;
}

export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  new: Record<string, any>;
  old: Record<string, any>;
  schema: string;
  table: string;
  commit_timestamp?: string;
}

/**
 * Service to sync incidents directly with Supabase PostgreSQL database
 */
export const SupabaseService = {
  isConfigured(): boolean {
    const { url } = getSupabaseCredentials();
    return url && !url.includes('demo-project') && !url.includes('fallback');
  },

  async fetchIncidents(): Promise<Incident[] | null> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch notice (using cache):', error.message);
        return null;
      }
      return data as Incident[];
    } catch (err) {
      console.warn('Supabase query failed:', err);
      return null;
    }
  },

  async insertIncident(incident: Partial<Incident>): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('incidents').insert([incident]);
      if (error) {
        console.warn('Supabase insert warning:', error.message);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  async updateIncidentStatus(id: string, status: string, notes?: string): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('incidents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) return false;
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Set up instantaneous Supabase Realtime postgres_changes subscription
   * for table 'incidents'.
   */
  subscribeToIncidentChanges(
    onPayload: (payload: SupabaseRealtimePayload) => void,
    onStatusChange?: (status: string) => void
  ): () => void {
    try {
      const client = getSupabaseClient();

      const channel = client
        .channel('realtime:public:incidents')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'incidents' },
          (payload: any) => {
            onPayload(payload as SupabaseRealtimePayload);
          }
        )
        // Also listen to broadcast channel for instant intra-app synchronization
        .on('broadcast', { event: 'incident_change' }, (e: any) => {
          if (e.payload) {
            onPayload(e.payload as SupabaseRealtimePayload);
          }
        })
        .subscribe((status: string) => {
          if (onStatusChange) {
            onStatusChange(status);
          }
        });

      activeRealtimeChannel = channel;

      return () => {
        try {
          client.removeChannel(channel);
        } catch {
          // ignore
        }
      };
    } catch (e) {
      console.warn('Supabase Realtime subscription error:', e);
      return () => {};
    }
  },

  /**
   * Broadcast an instant local incident change through Supabase Realtime channel
   */
  broadcastIncidentChange(eventType: 'INSERT' | 'UPDATE' | 'DELETE', record: Record<string, any>) {
    if (activeRealtimeChannel) {
      try {
        activeRealtimeChannel.send({
          type: 'broadcast',
          event: 'incident_change',
          payload: {
            eventType,
            new: record,
            old: eventType === 'DELETE' ? record : {},
            schema: 'public',
            table: 'incidents',
            commit_timestamp: new Date().toISOString()
          }
        });
      } catch (err) {
        console.warn('Supabase broadcast send error:', err);
      }
    }
  }
};
