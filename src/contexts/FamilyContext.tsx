import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { notificationService } from '../lib/notificationService';
import type { Family, Subscription, Child, FamilyMember, User } from '../lib/types';

interface FamilyContextType {
  currentFamily: Family | null;
  subscription: Subscription | null;
  children: Child[];
  members: Array<FamilyMember & { user: User }>;
  isParent: boolean;
  isHelper: boolean;
  isHelperMode: boolean;
  loading: boolean;
  selectFamily: (familyId: string) => void;
  clearHelperFamily: () => void;
  refreshFamily: () => Promise<void>;
  canAccessFeature: (feature: 'export' | 'helpers' | 'history' | 'multiple_children') => boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, familyMemberships } = useAuth();
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);
  const [members, setMembers] = useState<Array<FamilyMember & { user: User }>>([]);
  const [loading, setLoading] = useState(true);

  const currentMembership = familyMemberships.find(m => m.family_id === currentFamily?.id);
  const isParent = currentMembership?.role === 'PARENT';
  const isHelper = currentMembership?.role === 'HELPER';
  const isHelperMode = user?.account_type === 'HELPER';

  const fetchFamilyData = async (familyId: string) => {
    setLoading(true);
    try {
      const [familyResult, subResult, childrenResult, membersResult] = await Promise.all([
        supabase.from('families').select('*').eq('id', familyId).single(),
        supabase.from('subscriptions').select('*').eq('family_id', familyId).maybeSingle(),
        supabase.from('children').select('*').eq('family_id', familyId).order('first_name'),
        supabase
          .from('family_members')
          .select('*, user:users(*)')
          .eq('family_id', familyId)
          .eq('status', 'ACTIVE'),
      ]);

      if (familyResult.error) {
        console.error('Failed to fetch family:', familyResult.error);
        return;
      }

      if (childrenResult.error) {
        console.error('Failed to fetch children:', childrenResult.error);
      }

      if (membersResult.error) {
        console.error('Failed to fetch members:', membersResult.error);
      }

      console.log('[FamilyContext] Fetched children:', childrenResult.data);

      if (familyResult.data) setCurrentFamily(familyResult.data);
      setSubscription(subResult.data || null);
      setFamilyChildren(childrenResult.data || []);
      setMembers((membersResult.data as Array<FamilyMember & { user: User }>) || []);
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && currentFamily) {
      notificationService.initialize(user.id, currentFamily.id);
    }

    return () => {
      notificationService.cleanup();
    };
  }, [user, currentFamily]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.account_type === 'HELPER') {
      const selectedFamilyId = localStorage.getItem('helper_selected_family');
      if (selectedFamilyId && familyMemberships.length > 0) {
        const helperMembership = familyMemberships.find(m => m.family_id === selectedFamilyId);
        if (helperMembership) {
          if (!currentFamily || currentFamily.id !== selectedFamilyId) {
            fetchFamilyData(selectedFamilyId);
            return;
          }
        } else {
          localStorage.removeItem('helper_selected_family');
        }
      }
      setLoading(false);
    } else if (familyMemberships.length > 0) {
      const currentMembershipExists = familyMemberships.find(
        m => m.family_id === currentFamily?.id
      );

      if (!currentMembershipExists) {
        const firstFamily = familyMemberships[0];
        fetchFamilyData(firstFamily.family_id);
      } else {
        setLoading(false);
      }
    } else {
      setCurrentFamily(null);
      setSubscription(null);
      setFamilyChildren([]);
      setMembers([]);
      setLoading(false);
    }
  }, [familyMemberships, currentFamily?.id, user]);

  const selectFamily = (familyId: string) => {
    if (familyMemberships.find(m => m.family_id === familyId)) {
      if (isHelperMode) {
        localStorage.setItem('helper_selected_family', familyId);
      }
      fetchFamilyData(familyId);
    }
  };

  const clearHelperFamily = () => {
    localStorage.removeItem('helper_selected_family');
    setCurrentFamily(null);
    setSubscription(null);
    setFamilyChildren([]);
    setMembers([]);
  };

  const refreshFamily = async () => {
    if (currentFamily) {
      await fetchFamilyData(currentFamily.id);
    }
  };

  const canAccessFeature = (feature: 'export' | 'helpers' | 'history' | 'multiple_children'): boolean => {
    const plan = subscription?.plan || 'FREE';

    switch (feature) {
      case 'export':
        return plan === 'PLUS' || plan === 'PRO';
      case 'helpers':
        return plan === 'PRO';
      case 'history':
        return plan === 'PLUS' || plan === 'PRO';
      case 'multiple_children':
        return plan === 'PLUS' || plan === 'PRO';
      default:
        return false;
    }
  };

  return (
    <FamilyContext.Provider
      value={{
        currentFamily,
        subscription,
        children: familyChildren,
        members,
        isParent,
        isHelper,
        isHelperMode,
        loading,
        selectFamily,
        clearHelperFamily,
        refreshFamily,
        canAccessFeature,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
