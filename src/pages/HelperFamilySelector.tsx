import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, ChevronRight, Baby, LogOut, Copy, CheckCircle2 } from 'lucide-react';
import type { Family, FamilyMember, Child } from '../lib/types';

interface FamilyWithDetails extends Family {
  members: Array<FamilyMember & { user: { name: string; email: string } }>;
  children: Child[];
  unreadMessagesCount?: number;
}

export function HelperFamilySelector() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [families, setFamilies] = useState<FamilyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (user?.account_type !== 'HELPER') {
      navigate('/families');
      return;
    }

    localStorage.removeItem('helper_selected_family');
    fetchFamilies();
  }, [user, navigate]);

  const fetchFamilies = async () => {
    if (!user) return;

    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          family:families!family_members_family_id_fkey (
            id,
            name,
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'HELPER')
        .eq('status', 'ACTIVE');

      if (membershipsError) throw membershipsError;

      const activeFamilies = memberships
        ?.filter((m: any) => m.family?.status === 'ACTIVE')
        .map((m: any) => m.family) || [];

      const familiesWithDetails = await Promise.all(
        activeFamilies.map(async (family: any) => {
          const { data: members } = await supabase
            .from('family_members')
            .select(`
              *,
              user:users!family_members_user_id_fkey (
                name,
                email
              )
            `)
            .eq('family_id', family.id)
            .eq('status', 'ACTIVE');

          const { data: children } = await supabase
            .from('children')
            .select('*')
            .eq('family_id', family.id);

          const { data: allMessages } = await supabase
            .from('helper_messages')
            .select('id, sender_id, recipient_id, status, closed, parent_message_id, has_responded_users')
            .eq('family_id', family.id)
            .eq('closed', false)
            .is('parent_message_id', null);

          let unreadCount = 0;

          if (allMessages && allMessages.length > 0) {
            const messagesWithReplies = await Promise.all(
              allMessages.map(async (msg: any) => {
                const { data: replies } = await supabase
                  .from('helper_messages')
                  .select('id, sender_id, recipient_id, status, created_at, has_responded_users')
                  .eq('parent_message_id', msg.id)
                  .order('created_at', { ascending: true });

                return {
                  ...msg,
                  replies: replies || [],
                };
              })
            );

            unreadCount = messagesWithReplies.filter((msg: any) => {
              let needsMyResponse = false;
              if (msg.status === 'MOET_BEANTWOORDEN') {
                if (msg.recipient_id === user.id) {
                  needsMyResponse = true;
                }
              }

              const hasRepliesThatNeedMyResponse = msg.replies?.some((r: any) => {
                if (r.status !== 'MOET_BEANTWOORDEN') return false;
                if (r.recipient_id === user.id) {
                  return true;
                }
                return false;
              });

              return needsMyResponse || hasRepliesThatNeedMyResponse;
            }).length;
          }

          return {
            ...family,
            members: members || [],
            children: children || [],
            unreadMessagesCount: unreadCount,
          };
        })
      );

      setFamilies(familiesWithDetails);
    } catch (error) {
      console.error('Error fetching families:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectFamily = async (familyId: string) => {
    localStorage.setItem('helper_selected_family', familyId);
    navigate('/dashboard');
  };

  const copyInviteCode = async () => {
    if (user?.helper_invite_code) {
      await navigator.clipboard.writeText(user.helper_invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welkom, {user?.name}</h1>
              <p className="text-gray-600 mt-1">Selecteer een gezin om te bekijken</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen
            </button>
          </div>

          {user?.helper_invite_code && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Jouw hulpverlener koppelcode
                  </p>
                  <p className="text-2xl font-mono font-bold text-blue-700">
                    {user.helper_invite_code}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Deel deze code met gezinnen die je willen toevoegen
                  </p>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Gekopieerd
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kopieer
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {families.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nog geen gezinnen gekoppeld
            </h2>
            <p className="text-gray-600 mb-6">
              Deel je koppelcode met gezinnen om toegang te krijgen tot hun dossiers
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Mijn gezinnen ({families.length})</h2>
            {families.map((family) => {
              const parents = family.members.filter((m) => m.role === 'PARENT');

              return (
                <button
                  key={family.id}
                  onClick={() => selectFamily(family.id)}
                  className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg">
                      <Users className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {family.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{parents.length} ouder(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Baby className="w-4 h-4" />
                          <span>{family.children.length} kind(eren)</span>
                        </div>
                      </div>
                      {parents.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Ouders: {parents.map((p) => p.user.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {family.unreadMessagesCount && family.unreadMessagesCount > 0 && (
                        <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {family.unreadMessagesCount}
                        </span>
                      )}
                      <ChevronRight className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
