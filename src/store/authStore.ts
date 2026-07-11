import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/api/supabase';

interface AuthState {
  session: Session | null;
  initializing: boolean;
  init: () => () => void; // returns an unsubscribe function
  signOutLocal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initializing: true,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initializing: false });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, initializing: false });
    });

    return () => listener.subscription.unsubscribe();
  },

  signOutLocal: () => set({ session: null }),
}));
