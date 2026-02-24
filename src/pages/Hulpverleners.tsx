// src/pages/Hulpverleners.tsx
import { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Trash2,
  Lock,
  MessageSquare,
  Send,
  Users as UsersIcon,
  User as UserIcon,
  CheckCircle2,
  UserCheck,
  X,
  Clock,
  Link2,
} from 'lucide-react';

interface HelperMessage {
  id: string;
  family_id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  message: string;
  parent_message_id: string | null;
  is_read: boolean;
  status: 'MOET_BEANTWOORDEN' | 'BEANTWOORD';
  has_responded_users: string[];
  closed: boolean;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
    account_type: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
    account_type?: string;
  } | null;
  replies?: HelperMessage[];
}

interface HelperRequest {
  id: string;
  helper_id: string;
  family_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  helper: {
    id: string;
    name: string;
    email: string;
  };
}

type Plan = 'FREE' | 'PLUS' | 'PRO';

function normalizePlan(input?: string | null): Plan {
  const v = (input ?? '').toString().trim().toUpperCase();
  if (v === 'PRO') return 'PRO';
  if (v === 'PLUS') return 'PLUS';
  return 'FREE';
}

export function Hulpverleners() {
  const { user } = useAuth();
  const {
    currentFamily,
    members,
    refreshFamily,
    isParent,
    // Belangrijk: in jouw Layout komt abonnement uit useFamily().subscription
    subscription,
    // (andere velden die je eerder gebruikte zijn hier niet nodig)
  } = useFamily();

  const helpers = members.filter((m: any) => m.role === 'HELPER');

  // ✅ Neem plan exact over zoals Layout dat doet: subscription.plan
  // Fallback FREE als subscription ontbreekt
  const plan: Plan = normalizePlan((subscription as any)?.plan);
  const isPro = plan === 'PRO';

  const [activeTab, setActiveTab] = useState<'helpers' | 'messages' | 'requests' | 'connect'>('messages');

  const [inviteCode, setInviteCode] = useState('');
  const [helperCode, setHelperCode] = useState('');
  const [copiedFamilyCode, setCopiedFamilyCode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [helperRequests, setHelperRequests] = useState<HelperRequest[]>([]);

  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageData, setNewMessageData] = useState({
    subject: '',
    message: '',
    recipient_id: '',
  });

  // PRO-only: functies in deze pagina
  const canUseHelpersFeature = isPro;

  const fetchMessages = useCallback(async () => {
    if (!currentFamily || !user || !canUseHelpersFeature) return;

    const { data } = await supabase
      .from('helper_messages')
      .select(
        `
        *,
        sender:users!helper_messages_sender_id_fkey(id, name, email, account_type),
        recipient:users!helper_messages_recipient_id_fkey(id, name, email, account_type)
      `
      )
      .eq('family_id', currentFamily.id)
      .is('parent_message_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      const messagesWithReplies = await Promise.all(
        (data as any[]).map(async (msg: any) => {
          const { data: replies } = await supabase
            .from('helper_messages')
            .select(
              `
              *,
              sender:users!helper_messages_sender_id_fkey(id, name, email, account_type),
              recipient:users!helper_messages_recipient_id_fkey(id, name, email, account_type)
            `
            )
            .eq('parent_message_id', msg.id)
            .order('created_at', { ascending: true });

          return {
            ...msg,
            replies: replies || [],
          };
        })
      );

      setMessages(messagesWithReplies as any);
    }
  }, [currentFamily, user, canUseHelpersFeature]);

  const fetchHelperRequests = useCallback(async () => {
    if (!currentFamily || !canUseHelpersFeature) return;

    const { data } = await supabase
      .from('helper_requests')
      .select(
        `
        *,
        helper:users!helper_requests_helper_id_fkey(id, name, email)
      `
      )
      .eq('family_id', currentFamily.id)
      .order('requested_at', { ascending: false });

    if (data) setHelperRequests(data as any);
  }, [currentFamily, canUseHelpersFeature]);

  const fetchInviteCode = useCallback(async () => {
    if (!currentFamily || !canUseHelpersFeature) return;

    const { data } = await supabase
      .from('family_invite_codes')
      .select('code')
      .eq('family_id', currentFamily.id)
      .is('used_at', null)
      .maybeSingle();

    setInviteCode((data as any)?.code ?? '');
  }, [currentFamily, canUseHelpersFeature]);

  useEffect(() => {
    // Alleen PRO haalt data op en zet realtime subscriptions
    if (!canUseHelpersFeature) return;

    fetchMessages();
    fetchHelperRequests();
    fetchInviteCode();
  }, [canUseHelpersFeature, fetchMessages, fetchHelperRequests, fetchInviteCode]);

  useEffect(() => {
    if (!currentFamily || !canUseHelpersFeature) return;

    const sub = supabase
      .channel(`helper_data_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'helper_messages',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => fetchMessages()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'helper_requests',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => fetchHelperRequests()
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [currentFamily, canUseHelpersFeature, fetchMessages, fetchHelperRequests]);

  const handleApproveRequest = async (requestId: string) => {
    if (!canUseHelpersFeature) return;
    if (!confirm('Weet je zeker dat je deze hulpverlener wilt goedkeuren?')) return;

    setLoading(true);
    try {
      await supabase.from('helper_requests').update({ status: 'APPROVED' }).eq('id', requestId);
      await fetchHelperRequests();
      await refreshFamily();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Fout bij goedkeuren verzoek');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!canUseHelpersFeature) return;
    if (!confirm('Weet je zeker dat je dit verzoek wilt afwijzen?')) return;

    setLoading(true);
    try {
      await supabase.from('helper_requests').update({ status: 'REJECTED' }).eq('id', requestId);
      await fetchHelperRequests();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Fout bij afwijzen verzoek');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!canUseHelpersFeature) return;
    if (!confirm('Weet je zeker dat je deze hulpverlener wilt verwijderen?')) return;

    setLoading(true);
    try {
      await supabase.from('family_members').delete().eq('id', memberId);
      await refreshFamily();
    } finally {
      setLoading(false);
    }
  };

  const copyFamilyCode = async () => {
    if (!canUseHelpersFeature) return;
    if (!inviteCode) return;

    await navigator.clipboard.writeText(inviteCode);
    setCopiedFamilyCode(true);
    setTimeout(() => setCopiedFamilyCode(false), 2000);
  };

  const handleAddHelperByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseHelpersFeature) return;
    if (!currentFamily || !helperCode) return;

    setLoading(true);
    setError('');

    try {
      const { data: helper } = await supabase
        .from('users')
        .select('*')
        .eq('helper_invite_code', helperCode.toUpperCase())
        .eq('account_type', 'HELPER')
        .maybeSingle();

      if (!helper) {
        setError('Geen hulpverlener gevonden met deze koppelcode');
        return;
      }

      const { error: memberError } = await supabase.from('family_members').insert({
        family_id: currentFamily.id,
        user_id: (helper as any).id,
        role: 'HELPER',
        status: 'ACTIVE',
      });

      if (memberError) {
        if ((memberError as any).code === '23505') {
          setError('Deze hulpverlener is al toegevoegd');
        } else {
          throw memberError;
        }
        return;
      }

      await refreshFamily();
      setHelperCode('');
      setError('');
      alert('Hulpverlener succesvol toegevoegd!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fout bij toevoegen hulpverlener');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUseHelpersFeature) return;
    if (!currentFamily || !user) return;

    setLoading(true);
    try {
      await supabase.from('helper_messages').insert({
        family_id: currentFamily.id,
        sender_id: user.id,
        subject: newMessageData.subject,
        message: newMessageData.message,
        recipient_id: newMessageData.recipient_id || null,
      });

      await fetchMessages();
      setShowNewMessage(false);
      setNewMessageData({ subject: '', message: '', recipient_id: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMessage = async (messageId: string) => {
    if (!canUseHelpersFeature) return;
    if (
      !confirm(
        'Weet je zeker dat je deze vraag wilt sluiten? Er kunnen dan geen nieuwe antwoorden meer worden toegevoegd.'
      )
    )
      return;

    setLoading(true);
    try {
      await supabase
        .from('helper_messages')
        .update({
          closed: true,
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
        })
        .eq('id', messageId);

      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentMessageId: string) => {
    if (!canUseHelpersFeature) return;
    if (!replyText[parentMessageId]?.trim() || !user) return;

    const parentMessage = messages.find((m) => m.id === parentMessageId);
    if (!parentMessage) return;

    if (parentMessage.closed) {
      alert('Deze vraag is gesloten. Er kunnen geen nieuwe antwoorden meer worden toegevoegd.');
      return;
    }

    setLoading(true);
    try {
      const recipientId =
        parentMessage.sender_id === user.id ? parentMessage.recipient_id : parentMessage.sender_id;

      await supabase.from('helper_messages').insert({
        family_id: currentFamily!.id,
        sender_id: user.id,
        recipient_id: recipientId,
        subject: `Re: ${parentMessage.subject}`,
        message: replyText[parentMessageId].trim(),
        parent_message_id: parentMessageId,
      });

      if (parentMessage.recipient_id === null && parentMessage.sender_id !== user.id) {
        const currentResponders = Array.isArray(parentMessage.has_responded_users)
          ? parentMessage.has_responded_users
          : [];

        if (!currentResponders.includes(user.id)) {
          await supabase
            .from('helper_messages')
            .update({
              has_responded_users: [...currentResponders, user.id],
            })
            .eq('id', parentMessageId);
        }
      }

      await fetchMessages();
      setReplyText({ ...replyText, [parentMessageId]: '' });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!canUseHelpersFeature) return;
    if (!user) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    if (message.recipient_id === user.id || (message.recipient_id === null && message.sender_id !== user.id)) {
      await supabase.from('helper_messages').update({ is_read: true }).eq('id', messageId);
    }

    if (message.replies) {
      const unreadReplies = message.replies.filter(
        (r) =>
          !r.is_read &&
          (r.recipient_id === user.id || (r.recipient_id === null && r.sender_id !== user.id))
      );

      for (const reply of unreadReplies) {
        await supabase.from('helper_messages').update({ is_read: true }).eq('id', reply.id);
      }
    }

    await fetchMessages();
  };

  const toggleMessage = async (messageId: string) => {
    if (!canUseHelpersFeature) return;

    if (selectedMessage === messageId) {
      setSelectedMessage(null);
    } else {
      setSelectedMessage(messageId);
      await markAsRead(messageId);
    }
  };

  // 1) Alleen ouders
  if (!isParent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Alleen ouders kunnen hulpverleners beheren</p>
      </div>
    );
  }

  // 2) PRO-only: FREE en PLUS zien géén tabs/inhoud, alleen upgrade melding
  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hulpverleners</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Deze functie is alleen beschikbaar in <strong>PRO</strong>.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Upgrade vereist</h3>
              <p className="text-sm text-amber-800">
                Je hebt nu <strong>{plan}</strong>. Upgrade naar <strong>PRO</strong> om de Hulpverlener-functie te
                gebruiken (koppelen, verzoeken en berichten).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PRO: counters
  const unreadCount = messages.filter((m) => {
    if (m.closed) return false;

    const needsMyResponse =
      m.status === 'MOET_BEANTWOORDEN' &&
      (m.recipient_id === user?.id || (m.recipient_id === null && m.sender_id !== user?.id));

    const hasRepliesThatNeedMyResponse = m.replies?.some(
      (r) =>
        r.status === 'MOET_BEANTWOORDEN' &&
        (r.recipient_id === user?.id || (r.recipient_id === null && r.sender_id !== user?.id))
    );

    return needsMyResponse || hasRepliesThatNeedMyResponse;
  }).length;

  const pendingRequestsCount = helperRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hulpverleners</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Beheer hulpverleners en communiceer met hen</p>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'messages'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Berichten</span>
              {unreadCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Verzoeken</span>
              {pendingRequestsCount > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'connect'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Koppelen</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('helpers')}
            className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'helpers'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Hulpverleners</span> <span>({helpers.length})</span>
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Hulpverleners kunnen een verzoek indienen om toegang te krijgen tot dit gezin. Hier kun je hun verzoeken
              goedkeuren of afwijzen.
            </p>
          </div>

          <div className="space-y-4">
            {helperRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Geen verzoeken ontvangen</div>
            ) : (
              helperRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                          {request.helper.name}
                        </h3>

                        {request.status === 'PENDING' && (
                          <span className="px-2 sm:px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            In afwachting
                          </span>
                        )}
                        {request.status === 'APPROVED' && (
                          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1 whitespace-nowrap">
                            <UserCheck className="w-3 h-3" />
                            Goedgekeurd
                          </span>
                        )}
                        {request.status === 'REJECTED' && (
                          <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium flex items-center gap-1 whitespace-nowrap">
                            <X className="w-3 h-3" />
                            Afgewezen
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 mb-2 break-all">{request.helper.email}</p>

                      {request.message && (
                        <p className="text-xs sm:text-sm text-gray-700 mb-3 bg-gray-50 p-3 rounded break-words">
                          {request.message}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">
                        Verzoek ingediend op {new Date(request.requested_at).toLocaleString('nl-NL')}
                        {request.responded_at && (
                          <span>
                            {' • '}Behandeld op {new Date(request.responded_at).toLocaleString('nl-NL')}
                          </span>
                        )}
                      </div>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Goedkeuren</span>
                        </button>

                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Afwijzen</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'connect' && (
        <div className="flex items-start mb-6">
          <div className="p-3 bg-blue-100 rounded-lg mr-4">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Hulpverlener uitnodigen</h2>
            <p className="text-sm text-gray-600 mb-4">
              Voeg een hulpverlener direct toe aan dit gezin door hun persoonlijke koppelcode in te voeren.
            </p>

            <form onSubmit={handleAddHelperByCode} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hulpverlener koppelcode</label>
                <input
                  type="text"
                  value={helperCode}
                  onChange={(e) => setHelperCode(e.target.value.toUpperCase())}
                  placeholder="Bijv. A1B2C3D4"
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-lg tracking-wider uppercase"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">Vraag de hulpverlener om hun 8-cijferige koppelcode te delen</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <UserIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Wat gebeurt er?</h4>
                    <p className="text-sm text-blue-800">
                      De hulpverlener wordt direct toegevoegd aan dit gezin en krijgt read-only toegang tot alle gegevens.
                      Ze kunnen vragen stellen maar geen data wijzigen.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !helperCode.trim()}
                className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Bezig met toevoegen...' : 'Hulpverlener toevoegen'}
              </button>

              <div className="pt-2">
                <div className="text-sm text-gray-700 mb-2">Of deel de familiecode:</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm bg-white overflow-x-auto">
                    {inviteCode || '—'}
                  </div>
                  <button
                    type="button"
                    onClick={copyFamilyCode}
                    disabled={!inviteCode}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {copiedFamilyCode ? 'Gekopieerd' : 'Kopieer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'helpers' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {helpers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Nog geen hulpverleners gekoppeld</div>
            ) : (
              helpers.map((helper: any) => (
                <div
                  key={helper.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{helper.user?.name}</h3>
                    <p className="text-sm text-gray-600">{helper.user?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Toegevoegd op {helper.joined_at ? new Date(helper.joined_at).toLocaleDateString('nl-NL') : '—'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(helper.id)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Communiceer met hulpverleners</p>
            {!showNewMessage && (
              <button
                onClick={() => setShowNewMessage(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                <Plus className="w-5 h-5" />
                <span>Nieuw bericht</span>
              </button>
            )}
          </div>

          {showNewMessage && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nieuw bericht</h2>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aan</label>
                  <select
                    value={newMessageData.recipient_id}
                    onChange={(e) => setNewMessageData({ ...newMessageData, recipient_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecteer hulpverlener</option>
                    {helpers.map((helper: any) => (
                      <option key={helper.user_id} value={helper.user_id}>
                        {helper.user?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Onderwerp</label>
                  <input
                    type="text"
                    value={newMessageData.subject}
                    onChange={(e) => setNewMessageData({ ...newMessageData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                    maxLength={200}
                    placeholder="Korte omschrijving"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bericht</label>
                  <textarea
                    value={newMessageData.message}
                    onChange={(e) => setNewMessageData({ ...newMessageData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    rows={5}
                    required
                    maxLength={2000}
                    placeholder="Typ je bericht..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {loading ? 'Bezig...' : 'Versturen'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowNewMessage(false);
                      setNewMessageData({ subject: '', message: '', recipient_id: '' });
                    }}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Nog geen berichten</div>
            ) : (
              messages.map((message) => {
                const isSentByMe = message.sender_id === user?.id;
                const senderIsHelper = message.sender.account_type === 'HELPER';

                let messageStatus = '';
                let statusColor = '';

                if (message.closed) {
                  messageStatus = 'Gesloten';
                  statusColor = 'bg-gray-100 text-gray-800';
                } else if (message.status === 'MOET_BEANTWOORDEN') {
                  if (isSentByMe) {
                    messageStatus = 'Wacht op hulpverlener';
                    statusColor = 'bg-amber-100 text-amber-800';
                  } else {
                    messageStatus = 'Moet beantwoorden';
                    statusColor = 'bg-red-100 text-red-800';
                  }
                } else if (message.status === 'BEANTWOORD') {
                  messageStatus = 'Beantwoord';
                  statusColor = 'bg-green-100 text-green-800';
                }

                return (
                  <div key={message.id} className="bg-white rounded-lg border border-gray-200">
                    <div
                      className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleMessage(message.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                              {message.subject}
                            </h3>
                            {messageStatus && (
                              <span className={`px-2 py-1 text-xs ${statusColor} rounded font-medium whitespace-nowrap`}>
                                {messageStatus}
                              </span>
                            )}
                          </div>

                          <p className="text-sm sm:text-base text-gray-700 mb-3 line-clamp-2 break-words">
                            {message.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span className="break-words">Van: {message.sender.name}</span>

                            <span className="hidden sm:inline">•</span>

                            <span className="flex items-center gap-1 break-words">
                              {message.recipient_id ? (
                                <>
                                  <UserIcon className="w-3 h-3 flex-shrink-0" />
                                  <span>Aan: {message.recipient?.name}</span>
                                </>
                              ) : (
                                <>
                                  <UsersIcon className="w-3 h-3 flex-shrink-0" />
                                  <span>Aan: {senderIsHelper ? 'Alle ouders' : 'Hele gezin'}</span>
                                </>
                              )}
                            </span>

                            <span className="hidden sm:inline">•</span>

                            <span className="whitespace-nowrap">
                              {new Date(message.created_at).toLocaleDateString('nl-NL')}
                            </span>

                            {message.replies && message.replies.length > 0 && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="whitespace-nowrap">{message.replies.length} antwoord(en)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedMessage === message.id && (
                      <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                        <div className="mb-6">
                          <div className="text-sm font-medium text-gray-500 mb-2">Origineel bericht</div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>

                        {message.replies && message.replies.length > 0 && (
                          <div className="space-y-3 mb-6">
                            <div className="text-sm font-medium text-gray-500">Antwoorden</div>

                            {message.replies.map((reply) => (
                              <div key={reply.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">{reply.sender.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.created_at).toLocaleString('nl-NL')}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {message.sender_id === user?.id && !message.closed && (
                          <div className="mb-6">
                            <button
                              onClick={() => handleCloseMessage(message.id)}
                              disabled={loading}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Vraag sluiten
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                              Sluit deze vraag af als je alle antwoorden hebt ontvangen. Er kunnen dan geen nieuwe
                              antwoorden meer worden toegevoegd.
                            </p>
                          </div>
                        )}

                        {message.closed && (
                          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-700">
                              Deze vraag is gesloten. Er kunnen geen nieuwe antwoorden meer worden toegevoegd.
                            </p>
                          </div>
                        )}

                        {!message.closed && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Antwoord</label>
                            <textarea
                              value={replyText[message.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [message.id]: e.target.value })}
                              placeholder="Typ je antwoord..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                              rows={3}
                              maxLength={2000}
                            />
                            <button
                              onClick={() => handleReply(message.id)}
                              disabled={loading || !replyText[message.id]?.trim()}
                              className="flex items-center gap-2 w-full py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 justify-center text-sm sm:text-base"
                            >
                              <Send className="w-4 h-4" />
                              <span>{loading ? 'Bezig...' : 'Antwoord versturen'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}