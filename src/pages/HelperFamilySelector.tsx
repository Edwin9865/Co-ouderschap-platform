import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, ChevronRight, Baby, LogOut, Copy, CheckCircle2, Plus, Clock, UserCheck, X as XIcon, Trash2 } from 'lucide-react';
import type { Family, FamilyMember, Child } from '../lib/types';

interface FamilyWithDetails extends Family {
  members: Array<FamilyMember & { user: { name: string; email: string } }>;
  children: Child[];
  unreadMessagesCount?: number;
}

interface HelperRequest {
  id: string;
  family_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  family: {
    id: string;
    name: string;
  };
}

export function HelperFamilySelector() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [families, setFamilies] = useState<FamilyWithDetails[]>([]);
  const [helperRequests, setHelperRequests] = useState<HelperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [familyCode, setFamilyCode] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.account_type !== 'HELPER') {
      navigate('/families');
      return;
    }

    localStorage.removeItem('helper_selected_family');
    fetchFamilies();
    fetchHelperRequests();
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
              const isGroupMessage = msg.recipient_id === null;

              let needsMyResponse = false;
              if (msg.status === 'MOET_BEANTWOORDEN') {
                if (msg.recipient_id === user.id) {
                  needsMyResponse = true;
                }
              }

              const hasRepliesThatNeedMyResponse = msg.replies?.some((r: any) => {
                if (r.status !== 'MOET_BEANTWOORDEN') return false;

                if (isGroupMessage) {
                  return false;
                }

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

  const fetchHelperRequests = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('helper_requests')
        .select(`
          *,
          family:families!helper_requests_family_id_fkey(id, name)
        `)
        .eq('helper_id', user.id)
        .order('requested_at', { ascending: false });

      if (data) {
        setHelperRequests(data as any);
      }
    } catch (error) {
      console.error('Error fetching helper requests:', error);
    }
  };

  const selectFamily = async (familyId: string) => {
    localStorage.setItem('helper_selected_family', familyId);
    navigate('/dashboard');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !familyCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const codeToLookup = familyCode.trim().toUpperCase();

      const { data: inviteCode } = await supabase
        .from('family_invite_codes')
        .select('family_id, families!inner(id, name, status)')
        .eq('code', codeToLookup)
        .is('used_at', null)
        .maybeSingle();

      if (!inviteCode || !inviteCode.families) {
        setError('Geen gezin gevonden met deze koppelcode');
        setLoading(false);
        return;
      }

      const family = {
        id: inviteCode.families.id,
        name: inviteCode.families.name
      };

      if (inviteCode.families.status !== 'ACTIVE') {
        setError('Dit gezin is niet meer actief');
        setLoading(false);
        return;
      }

      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        setError('Je bent al lid van dit gezin');
        setLoading(false);
        return;
      }

      const { data: existingRequest } = await supabase
        .from('helper_requests')
        .select('id')
        .eq('family_id', family.id)
        .eq('helper_id', user.id)
        .eq('status', 'PENDING')
        .maybeSingle();

      if (existingRequest) {
        setError('Je hebt al een openstaand verzoek bij dit gezin');
        setLoading(false);
        return;
      }

      await supabase.from('helper_requests').insert({
        family_id: family.id,
        helper_id: user.id,
        message: requestMessage.trim() || null,
      });

      await fetchHelperRequests();
      setShowRequestForm(false);
      setFamilyCode('');
      setRequestMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fout bij indienen verzoek');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Weet je zeker dat je dit verzoek wilt annuleren?')) return;

    setLoading(true);
    try {
      await supabase
        .from('helper_requests')
        .update({ status: 'CANCELLED' })
        .eq('id', requestId);

      await fetchHelperRequests();
    } finally {
      setLoading(false);
    }
  };

  const handleUncoupleFromFamily = async (familyId: string) => {
    if (!confirm('Weet je zeker dat je jezelf wilt ontkoppelen van dit gezin?')) return;

    setLoading(true);
    try {
      await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', user?.id);

      await fetchFamilies();
    } finally {
      setLoading(false);
    }
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

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Verzoek toegang tot een gezin
            </h2>
            {!showRequestForm && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nieuw verzoek
              </button>
            )}
          </div>

          {showRequestForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Verzoek indienen bij gezin
              </h3>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gezin koppelcode
                  </label>
                  <input
                    type="text"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                    placeholder="Bijv. A1B2C3D4"
                    maxLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-lg tracking-wider uppercase"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Vraag aan het gezin om hun koppelcode te delen
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bericht (optioneel)
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Laat een bericht achter voor het gezin..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {loading ? 'Bezig...' : 'Verzoek indienen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestForm(false);
                      setFamilyCode('');
                      setRequestMessage('');
                      setError('');
                    }}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          )}

          {helperRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mijn verzoeken</h3>
              {helperRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.family.name}
                        </h3>
                        {request.status === 'PENDING' && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            In afwachting
                          </span>
                        )}
                        {request.status === 'APPROVED' && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Goedgekeurd
                          </span>
                        )}
                        {request.status === 'REJECTED' && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium flex items-center gap-1">
                            <XIcon className="w-3 h-3" />
                            Afgewezen
                          </span>
                        )}
                        {request.status === 'CANCELLED' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium flex items-center gap-1">
                            <XIcon className="w-3 h-3" />
                            Geannuleerd
                          </span>
                        )}
                      </div>
                      {request.message && (
                        <p className="text-sm text-gray-700 mb-2 bg-gray-50 p-3 rounded">
                          {request.message}
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        Verzonden op {new Date(request.requested_at).toLocaleString('nl-NL')}
                        {request.responded_at && (
                          <span>
                            {' • '}Behandeld op {new Date(request.responded_at).toLocaleString('nl-NL')}
                          </span>
                        )}
                      </div>
                    </div>
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={loading}
                        className="ml-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XIcon className="w-4 h-4" />
                        Annuleren
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
              Dien een verzoek in bij een gezin om toegang te krijgen tot hun dossier
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Mijn gezinnen ({families.length})</h2>
            {families.map((family) => {
              const parents = family.members.filter((m) => m.role === 'PARENT');

              return (
                <div
                  key={family.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all"
                >
                  <div
                    onClick={() => selectFamily(family.id)}
                    className="p-6 cursor-pointer hover:bg-gray-50"
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
                  </div>
                  <div className="px-6 pb-4 border-t border-gray-200 pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUncoupleFromFamily(family.id);
                      }}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Ontkoppelen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
