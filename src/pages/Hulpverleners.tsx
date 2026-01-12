import { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Lock, MessageSquare, Send, Users as UsersIcon, User as UserIcon, CheckCircle2 } from 'lucide-react';
import type { FamilyMember } from '../lib/types';

interface HelperMessage {
  id: string;
  family_id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  message: string;
  parent_message_id: string | null;
  is_read: boolean;
  status: 'NIEUW' | 'MOET_BEANTWOORDEN' | 'BEANTWOORD';
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

export function Hulpverleners() {
  const { currentFamily, members, refreshFamily, isParent, canAccessFeature } = useFamily();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'helpers' | 'messages'>('messages');
  const [showAdd, setShowAdd] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageData, setNewMessageData] = useState({
    subject: '',
    message: '',
    recipient_id: '',
  });

  const helpers = members.filter((m) => m.role === 'HELPER');
  const canAddHelper = canAccessFeature('helpers');

  const fetchMessages = useCallback(async () => {
    if (!currentFamily || !user) return;

    const { data } = await supabase
      .from('helper_messages')
      .select(`
        *,
        sender:users!helper_messages_sender_id_fkey(id, name, email, account_type),
        recipient:users!helper_messages_recipient_id_fkey(id, name, email, account_type)
      `)
      .eq('family_id', currentFamily.id)
      .is('parent_message_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      const messagesWithReplies = await Promise.all(
        data.map(async (msg: any) => {
          const { data: replies } = await supabase
            .from('helper_messages')
            .select(`
              *,
              sender:users!helper_messages_sender_id_fkey(id, name, email, account_type),
              recipient:users!helper_messages_recipient_id_fkey(id, name, email, account_type)
            `)
            .eq('parent_message_id', msg.id)
            .order('created_at', { ascending: true });

          return {
            ...msg,
            replies: replies || [],
          };
        })
      );

      setMessages(messagesWithReplies);
    }
  }, [currentFamily, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!currentFamily) return;

    const subscription = supabase
      .channel(`helper_messages_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'helper_messages',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentFamily, fetchMessages]);

  const handleAddHelper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !inviteCode) return;

    if (!canAddHelper) {
      setError('Upgrade naar PLUS of PRO om hulpverleners toe te voegen');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: helper } = await supabase
        .from('users')
        .select('*')
        .eq('helper_invite_code', inviteCode.toUpperCase())
        .eq('account_type', 'HELPER')
        .maybeSingle();

      if (!helper) {
        setError('Geen hulpverlener gevonden met deze koppelcode');
        return;
      }

      const { error: memberError } = await supabase.from('family_members').insert({
        family_id: currentFamily.id,
        user_id: helper.id,
        role: 'HELPER',
        status: 'ACTIVE',
      });

      if (memberError) {
        if (memberError.code === '23505') {
          setError('Deze hulpverlener is al toegevoegd');
        } else {
          throw memberError;
        }
        return;
      }

      await refreshFamily();
      setInviteCode('');
      setShowAdd(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fout bij toevoegen hulpverlener');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Weet je zeker dat je deze hulpverlener wilt verwijderen?')) return;

    setLoading(true);
    try {
      await supabase.from('family_members').delete().eq('id', memberId);
      await refreshFamily();
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!confirm('Weet je zeker dat je deze vraag wilt sluiten? Er kunnen dan geen nieuwe antwoorden meer worden toegevoegd.')) return;

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
    if (!replyText[parentMessageId]?.trim() || !user) return;

    const parentMessage = messages.find((m) => m.id === parentMessageId);
    if (!parentMessage) return;

    if (parentMessage.closed) {
      alert('Deze vraag is gesloten. Er kunnen geen nieuwe antwoorden meer worden toegevoegd.');
      return;
    }

    setLoading(true);
    try {
      const recipientId = parentMessage.sender_id === user.id
        ? parentMessage.recipient_id
        : parentMessage.sender_id;

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
              has_responded_users: [...currentResponders, user.id]
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
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    if (message.recipient_id === user.id ||
        (message.recipient_id === null && message.sender_id !== user.id)) {
      await supabase
        .from('helper_messages')
        .update({
          is_read: true,
          status: message.status === 'NIEUW' ? 'MOET_BEANTWOORDEN' : message.status
        })
        .eq('id', messageId);
    }

    if (message.replies) {
      const unreadReplies = message.replies.filter(r =>
        !r.is_read &&
        (r.recipient_id === user.id || (r.recipient_id === null && r.sender_id !== user.id))
      );

      for (const reply of unreadReplies) {
        await supabase
          .from('helper_messages')
          .update({
            is_read: true,
            status: reply.status === 'NIEUW' ? 'MOET_BEANTWOORDEN' : reply.status
          })
          .eq('id', reply.id);
      }
    }

    await fetchMessages();
  };

  const toggleMessage = async (messageId: string) => {
    if (selectedMessage === messageId) {
      setSelectedMessage(null);
    } else {
      setSelectedMessage(messageId);
      await markAsRead(messageId);
    }
  };

  if (!isParent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Alleen ouders kunnen hulpverleners beheren</p>
      </div>
    );
  }

  const unreadCount = messages.filter(m => {
    if (m.closed) return false;

    const parentNeedsAttention = (m.status === 'NIEUW' || m.status === 'MOET_BEANTWOORDEN') &&
                                  (m.recipient_id === user?.id ||
                                   (m.recipient_id === null && m.sender_id !== user?.id));

    const hasUnreadReplies = m.replies?.some(r =>
      (r.status === 'NIEUW' || r.status === 'MOET_BEANTWOORDEN') &&
      (r.recipient_id === user?.id ||
       (r.recipient_id === null && r.sender_id !== user?.id))
    );

    return parentNeedsAttention || hasUnreadReplies;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hulpverleners</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Beheer hulpverleners en communiceer met hen
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
              activeTab === 'messages'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Berichten
              {unreadCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('helpers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'helpers'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Hulpverleners ({helpers.length})
            </div>
          </button>
        </nav>
      </div>

      {activeTab === 'helpers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div></div>
            {!showAdd && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                <Plus className="w-5 h-5" />
                <span>Hulpverlener toevoegen</span>
              </button>
            )}
          </div>

          {!canAddHelper && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Upgrade vereist</h3>
                  <p className="text-sm text-amber-800">
                    Met het gratis plan kun je geen hulpverleners koppelen. Upgrade naar PLUS of PRO om
                    professionals toegang te geven tot je dossier.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showAdd && canAddHelper && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hulpverlener toevoegen</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddHelper} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Koppelcode hulpverlener
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Bijv. A1B2C3D4"
                    maxLength={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono text-lg tracking-wider uppercase"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Vraag de hulpverlener om hun 8-cijferige koppelcode
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Hulpverleners krijgen read-only toegang tot alle gegevens in dit gezin. Ze kunnen
                    vragen stellen maar geen data wijzigen.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {loading ? 'Bezig...' : 'Toevoegen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdd(false);
                      setInviteCode('');
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

          <div className="space-y-4">
            {helpers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nog geen hulpverleners gekoppeld
              </div>
            ) : (
              helpers.map((helper) => (
                <div
                  key={helper.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{helper.user.name}</h3>
                    <p className="text-sm text-gray-600">{helper.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Toegevoegd op {new Date(helper.joined_at).toLocaleDateString('nl-NL')}
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
                    {helpers.map((helper) => (
                      <option key={helper.user_id} value={helper.user_id}>
                        {helper.user.name}
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
              <div className="text-center py-12 text-gray-500">
                Nog geen berichten
              </div>
            ) : (
              messages.map((message) => {
                const isGroupMessage = message.recipient_id === null && message.sender_id !== user?.id;
                const hasUserResponded = isGroupMessage &&
                  Array.isArray(message.has_responded_users) &&
                  message.has_responded_users.includes(user!.id);

                const isUnread = !message.is_read &&
                  (message.recipient_id === user?.id ||
                   (isGroupMessage && !hasUserResponded));

                const hasUnreadReplies = message.replies?.some(r =>
                  !r.is_read &&
                  (r.recipient_id === user?.id || (r.recipient_id === null && r.sender_id !== user?.id))
                );

                const senderIsHelper = message.sender.account_type === 'HELPER';
                const recipientIsHelper = message.recipient?.account_type === 'HELPER';
                const numParents = members.filter(m => m.role === 'PARENT').length;
                const numHelpers = helpers.length;

                const isSentByMe = message.sender_id === user?.id;
                const isToWholeFamily = message.recipient_id === null;

                let messageStatus = '';
                let statusColor = '';

                if (message.closed) {
                  messageStatus = 'Gesloten';
                  statusColor = 'bg-gray-100 text-gray-800';
                } else if (isGroupMessage) {
                  const originalSenderId = message.sender_id;
                  const replies = message.replies || [];

                  const lastSenderReply = replies
                    .filter(r => r.sender_id === originalSenderId)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                  const lastSenderReplyTime = lastSenderReply
                    ? new Date(lastSenderReply.created_at).getTime()
                    : new Date(message.created_at).getTime();

                  const myRepliesAfterLastSender = replies.filter(r =>
                    r.sender_id === user?.id &&
                    new Date(r.created_at).getTime() > lastSenderReplyTime
                  );

                  const iHaveResponded = myRepliesAfterLastSender.length > 0;

                  if (!iHaveResponded) {
                    messageStatus = 'Moet beantwoorden';
                    statusColor = 'bg-red-100 text-red-800';
                  } else {
                    const parents = members.filter(m => m.role === 'PARENT');
                    const otherParents = parents.filter(p => p.user_id !== user?.id);

                    const coParentRepliesAfterLastSender = otherParents.some(parent =>
                      replies.some(r =>
                        r.sender_id === parent.user_id &&
                        new Date(r.created_at).getTime() > lastSenderReplyTime
                      )
                    );

                    if (!coParentRepliesAfterLastSender && otherParents.length > 0) {
                      messageStatus = 'Wacht op co-ouder';
                      statusColor = 'bg-amber-100 text-amber-800';
                    } else {
                      messageStatus = 'Beantwoord';
                      statusColor = 'bg-green-100 text-green-800';
                    }
                  }
                } else if (isUnread || hasUnreadReplies) {
                  messageStatus = 'Nieuw';
                  statusColor = 'bg-blue-100 text-blue-800';
                } else if (isSentByMe) {
                  if (isToWholeFamily) {
                    const expectedResponses = senderIsHelper ? numParents : numParents - 1;
                    const actualResponses = message.has_responded_users?.length || 0;

                    if (actualResponses < expectedResponses) {
                      messageStatus = senderIsHelper
                        ? `Wacht op ouders (${actualResponses}/${expectedResponses})`
                        : `Wacht op co-ouder (${actualResponses}/${expectedResponses})`;
                      statusColor = 'bg-amber-100 text-amber-800';
                    } else if (message.replies && message.replies.length > 0) {
                      messageStatus = 'Afgerond';
                      statusColor = 'bg-green-100 text-green-800';
                    }
                  } else if (recipientIsHelper) {
                    if (!message.replies || message.replies.length === 0) {
                      messageStatus = 'Wacht op hulpverlener';
                      statusColor = 'bg-amber-100 text-amber-800';
                    } else {
                      messageStatus = 'Afgerond';
                      statusColor = 'bg-green-100 text-green-800';
                    }
                  } else {
                    if (!message.replies || message.replies.length === 0) {
                      messageStatus = 'Wacht op antwoord';
                      statusColor = 'bg-amber-100 text-amber-800';
                    } else {
                      messageStatus = 'Afgerond';
                      statusColor = 'bg-green-100 text-green-800';
                    }
                  }
                } else {
                  const myReply = message.replies?.find(r => r.sender_id === user?.id);
                  if (myReply) {
                    messageStatus = 'Beantwoord';
                    statusColor = 'bg-green-100 text-green-800';
                  } else if (message.status === 'MOET_BEANTWOORDEN') {
                    messageStatus = 'Moet beantwoorden';
                    statusColor = 'bg-red-100 text-red-800';
                  } else if (message.status === 'NIEUW') {
                    messageStatus = 'Nieuw';
                    statusColor = 'bg-blue-100 text-blue-800';
                  }
                }

                return (
                  <div
                    key={message.id}
                    className={`bg-white rounded-lg border ${isUnread || hasUnreadReplies ? 'border-blue-400 shadow-md' : 'border-gray-200'}`}
                  >
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleMessage(message.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                            {messageStatus && (
                              <span className={`px-2 py-1 text-xs ${statusColor} rounded font-medium`}>
                                {messageStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-3 line-clamp-2">{message.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Van: {message.sender.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {message.recipient_id ? (
                                <>
                                  <UserIcon className="w-3 h-3" />
                                  Aan: {message.recipient?.name}
                                </>
                              ) : (
                                <>
                                  <UsersIcon className="w-3 h-3" />
                                  Aan: {senderIsHelper ? 'Alle ouders' : 'Hele gezin'}
                                </>
                              )}
                            </span>
                            <span>•</span>
                            <span>{new Date(message.created_at).toLocaleDateString('nl-NL')}</span>
                            {message.replies && message.replies.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{message.replies.length} antwoord(en)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedMessage === message.id && (
                      <div className="p-6 bg-gray-50 border-t border-gray-200">
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
                              <div
                                key={reply.id}
                                className="bg-white p-4 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {reply.sender.name}
                                  </span>
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
                              Sluit deze vraag af als je alle antwoorden hebt ontvangen. Er kunnen dan geen nieuwe antwoorden meer worden toegevoegd.
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
                              className="flex items-center gap-2 w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 justify-center"
                            >
                              <Send className="w-4 h-4" />
                              {loading ? 'Bezig...' : 'Antwoord versturen'}
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
