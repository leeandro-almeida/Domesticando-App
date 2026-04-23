import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Cookies from 'js-cookie';

const COOKIE_KEY = 'dc-auth-token';
const COOKIE_OPTIONS = { expires: 30, sameSite: 'Lax' as const, secure: window.location.protocol === 'https:' };

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  // Persist session to cookie
  const persistSession = useCallback((session: Session | null) => {
    if (session) {
      Cookies.set(COOKIE_KEY, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }), COOKIE_OPTIONS);
    } else {
      Cookies.remove(COOKIE_KEY);
    }
  }, []);

  // Initialize: try to restore session from cookie
  useEffect(() => {
    const initAuth = async () => {
      // First try Supabase's built-in session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setState({ user: session.user, session, isLoading: false });
        persistSession(session);
        return;
      }

      // Fallback: try cookie
      const cookieData = Cookies.get(COOKIE_KEY);
      if (cookieData) {
        try {
          const { refresh_token } = JSON.parse(cookieData);
          const { data, error } = await supabase.auth.refreshSession({ refresh_token });
          if (!error && data.session) {
            setState({ user: data.session.user, session: data.session, isLoading: false });
            persistSession(data.session);
            return;
          }
        } catch {
          Cookies.remove(COOKIE_KEY);
        }
      }

      setState({ user: null, session: null, isLoading: false });
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, isLoading: false });
      persistSession(session);
    });

    return () => subscription.unsubscribe();
  }, [persistSession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    Cookies.remove(COOKIE_KEY);
    setState({ user: null, session: null, isLoading: false });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
