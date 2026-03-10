import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SecureStorage } from '../lib/secureStorage';
import type { User, FamilyMember } from '../lib/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  familyMemberships: FamilyMember[];
  loading: boolean;
  rememberMe: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name: string, accountType: 'PARENT' | 'HELPER') => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setRememberMe: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [familyMemberships, setFamilyMemberships] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMeState] = useState(true);

  const fetchUserData = async (userId: string) => {
    console.log('Fetching user data for:', userId);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }

    if (userData) {
      console.log('User data fetched:', userData);
      setUser(userData);

      const { data: memberships } = await supabase
        .from('family_members')
        .select(`
          *,
          family:families!family_members_family_id_fkey (
            id,
            status
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      const activeMemberships = (memberships || []).filter(
        (m: any) => m.family?.status === 'ACTIVE'
      );

      console.log('Family memberships:', activeMemberships);
      setFamilyMemberships(activeMemberships);
    } else {
      console.warn('No user data found for:', userId);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log('[AuthContext] Initializing authentication...');

      const rememberMeEnabled = await SecureStorage.getRememberMe();
      console.log('[AuthContext] Remember Me enabled:', rememberMeEnabled);
      setRememberMeState(rememberMeEnabled);

      const isValid = await SecureStorage.isSessionValid();
      console.log('[AuthContext] Session valid:', isValid);

      if (!isValid && rememberMeEnabled) {
        console.log('[AuthContext] Session expired after 30 days of inactivity');
        await SecureStorage.clearAuthData();
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[AuthContext] Supabase session:', currentSession ? 'Found' : 'Not found');

      setSession(currentSession);
      if (currentSession?.user) {
        console.log('[AuthContext] Fetching user data for:', currentSession.user.id);
        await fetchUserData(currentSession.user.id);
        await SecureStorage.updateLastActive();
      } else {
        console.log('[AuthContext] No active session, showing login');
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserData(newSession.user.id);
          await SecureStorage.updateLastActive();
        } else {
          setUser(null);
          setFamilyMemberships([]);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMeOption = true) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await SecureStorage.setRememberMe(rememberMeOption);
    setRememberMeState(rememberMeOption);
    await SecureStorage.updateLastActive();
  };

  const signUp = async (email: string, password: string, name: string, accountType: 'PARENT' | 'HELPER') => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          account_type: accountType,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Registratie mislukt');

    // Als email verificatie is ingeschakeld heeft Supabase geen actieve sessie na signup
    const needsConfirmation = !authData.session;
    if (needsConfirmation) {
      return { needsConfirmation: true };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: updateError } = await supabase
      .from('users')
      .update({ account_type: accountType })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating account type:', updateError);
    }

    await fetchUserData(authData.user.id);
    return { needsConfirmation: false };
  };

  const signOut = async () => {
    localStorage.removeItem('helper_selected_family');
    await SecureStorage.clearAuthData();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // Session may already be invalid on the server; local data is already cleared
      console.warn('Sign out API call failed (session likely already expired):', error);
    }
  };

  const setRememberMe = async (enabled: boolean) => {
    await SecureStorage.setRememberMe(enabled);
    setRememberMeState(enabled);

    if (user?.id) {
      await supabase
        .from('users')
        .update({ remember_me_enabled: enabled })
        .eq('id', user.id);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserData(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        familyMemberships,
        loading,
        rememberMe,
        signIn,
        signUp,
        signOut,
        refreshUser,
        setRememberMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
