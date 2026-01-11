import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User, FamilyMember } from '../lib/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  familyMemberships: FamilyMember[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, accountType: 'PARENT' | 'HELPER') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [familyMemberships, setFamilyMemberships] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

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
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserData(newSession.user.id);
        } else {
          setUser(null);
          setFamilyMemberships([]);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
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

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: updateError } = await supabase
      .from('users')
      .update({ account_type: accountType })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating account type:', updateError);
    }

    await fetchUserData(authData.user.id);
  };

  const signOut = async () => {
    localStorage.removeItem('helper_selected_family');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
        signIn,
        signUp,
        signOut,
        refreshUser,
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
