import { useState, useEffect, useRef } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Send, Users as UsersIcon, User, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

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
  helper_has_read_replies: string[];
  closed: boolean;
  allow_parent_reply: boolean;
  created_at: string;
  updated_at: string;
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
    account_type: string;
  } | null;
  replies?: HelperMessage[];
}

export function Vragen() {
  const { currentFamily, members, isHelper, isHelperMode } = useFamily();
  const { user } = useAuth();
  const [messages, setMessages] = useState<HelperMessage[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [allowParentReplyToggle, setAllowParentReplyToggle] = useState<Record<string, boolean>>({});
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipient_id: '',
  });

  const parents = members.filter((m) => m.role === 'PARENT');
  const helpers = members.filter((m) => m.role === 'HELPER');

  // Ref zodat de realtime-callback altijd de laatste versie van fetchMessages aanroept
  const fetchMessagesRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!currentFamily) return;
    fetchMessagesRef.current();
  }, [currentFamily, user]);

  useEffect(() => {
    if (!currentFamily) return;
    const channel = supabase
      .channel(`vragen_messages_${currentFamily.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'helper_messages', filter: `family_id=eq.${currentFamily.id}` }, () => fetchMessagesRef.current())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentFamily]);

  const fetchMessages = async () => {
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
  };
  fetchMessagesRef.current = fetchMessages;

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;

    if (!isHelperMode && !formData.recipient_id) {
      alert('Selecteer een hulpverlener om een bericht naar te sturen');
      return;
    }

    setLoading(true);
    try {
      const messageData: any = {
        family_id: currentFamily.id,
        sender_id: user.id,
        subject: formData.subject,
        message: formData.message,
        recipient_id: formData.recipient_id || null,
        status: 'MOET_BEANTWOORDEN',
        allow_parent_reply: true,
      };

      await supabase.from('helper_messages').insert(messageData);

      await fetchMessages();
      setShowCreate(false);
      setFormData({ subject: '', message: '', recipient_id: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentMessageId: string) => {
    if (!replyText[parentMessageId]?.trim() || !user) return;

    const parentMessage = messages.find((m) => m.id === parentMessageId);
    if (!parentMessage) return;

    setLoading(true);
    try {
      const isGroupMessage = parentMessage.recipient_id === null;

      let recipientId;
      if (isGroupMessage) {
        recipientId = null;
      } else {
        recipientId = parentMessage.sender_id === user.id
          ? parentMessage.recipient_id
          : parentMessage.sender_id;
      }

      await supabase.from('helper_messages').insert({
        family_id: currentFamily!.id,
        sender_id: user.id,
        recipient_id: recipientId,
        subject: `Re: ${parentMessage.subject}`,
        message: replyText[parentMessageId].trim(),
        parent_message_id: parentMessageId,
      });

      if (isHelperMode) {
        // Helper controls allow_parent_reply and status
        const shouldAllowParentReply = allowParentReplyToggle[parentMessageId] !== false;
        const helperReplyStatus: 'MOET_BEANTWOORDEN' | 'BEANTWOORD' = shouldAllowParentReply ? 'MOET_BEANTWOORDEN' : 'BEANTWOORD';
        // allow_parent_reply is a new column — cast needed until types are regenerated
        await (supabase as any)
          .from('helper_messages')
          .update({
            allow_parent_reply: shouldAllowParentReply,
            status: helperReplyStatus,
          })
          .eq('id', parentMessageId);
      } else {
        // Parent is replying
        if (isGroupMessage) {
          const { data: allReplies } = await supabase
            .from('helper_messages')
            .select('sender_id')
            .eq('parent_message_id', parentMessageId);

          const parentIds = parents.map(p => p.user_id);
          const respondedIds = [...new Set(
            [...(allReplies || []).map((r: any) => r.sender_id), user.id]
              .filter((id: string) => parentIds.includes(id))
          )];
          const allParentsResponded = respondedIds.length >= parents.length;

          await supabase
            .from('helper_messages')
            .update({ status: allParentsResponded ? 'BEANTWOORD' : 'MOET_BEANTWOORDEN' })
            .eq('id', parentMessageId);
        } else if (parentMessage.recipient_id === user.id) {
          await supabase
            .from('helper_messages')
            .update({ status: 'BEANTWOORD' })
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
        .update({ is_read: true })
        .eq('id', messageId);
    }

    if (isHelperMode && message.replies && message.replies.length > 0) {
      const replyIds = message.replies.map(r => r.id);
      const currentReadReplies = Array.isArray(message.helper_has_read_replies)
        ? message.helper_has_read_replies
        : [];
      const newReadReplies = [...new Set([...currentReadReplies, ...replyIds])];
      await supabase
        .from('helper_messages')
        .update({ helper_has_read_replies: newReadReplies })
        .eq('id', messageId);
    } else if (message.replies) {
      const unreadReplies = message.replies.filter(r =>
        !r.is_read &&
        (r.recipient_id === user.id || (r.recipient_id === null && r.sender_id !== user.id))
      );
      for (const reply of unreadReplies) {
        await supabase
          .from('helper_messages')
          .update({ is_read: true })
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

  const handleCloseMessage = async (messageId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase
        .from('helper_messages')
        .update({ closed: true, allow_parent_reply: false })
        .eq('id', messageId);
      setConfirmClose(null);
      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  const canSendTo = isHelperMode ? parents : helpers;

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMessagesForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return messages.filter(message => {
      const messageDate = new Date(message.created_at);
      return messageDate >= monthStart && messageDate <= monthEnd;
    });
  };

  const monthlyMessages = getMessagesForMonth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vragen & Berichten</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {isHelperMode
              ? 'Communiceer met ouders over dit gezin'
              : 'Communiceer met hulpverleners'}
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuw bericht</span>
          </button>
        )}
      </div>

      {/* Banner voor hulpverleners */}
      {isHelperMode && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            <strong>Let op:</strong> Sluit een vraag zodra het onderwerp is afgerond. Ouders kunnen daarna geen nieuwe antwoorden meer toevoegen. U heeft altijd de regie over het gesprek.
          </p>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nieuw bericht</h2>
          <form onSubmit={handleCreateMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aan
              </label>
              <select
                value={formData.recipient_id}
                onChange={(e) => setFormData({ ...formData, recipient_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                {isHelperMode ? (
                  <option value="">Beide ouders</option>
                ) : (
                  <option value="">Selecteer hulpverlener</option>
                )}
                {canSendTo.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Onderwerp</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
                maxLength={200}
                placeholder="Korte omschrijving"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bericht</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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
                  setShowCreate(false);
                  setFormData({ subject: '', message: '', recipient_id: '' });
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {monthlyMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Geen berichten in deze maand
          </div>
        ) : (
          monthlyMessages.map((message) => {
            const iAmSender = message.sender_id === user?.id;
            const isGroupMessage = message.recipient_id === null;
            const senderIsHelper = helpers.some(h => h.user_id === message.sender_id);

            // Per-ronde tracking voor groepsberichten van hulpverlener
            let iHaveRepliedThisRound = false;
            let allParentsRepliedThisRound = false;
            let respondedParentIdsThisRound: string[] = [];
            let respondedParentsThisRound: typeof parents = [];
            let notRespondedParentsThisRound: typeof parents = [];

            if (isGroupMessage && senderIsHelper) {
              const helperReplies = (message.replies || []).filter(r =>
                helpers.some(h => h.user_id === r.sender_id)
              );
              // replies zijn gesorteerd ascending op created_at
              const lastHelperReply = helperReplies[helperReplies.length - 1];
              const roundStartTime = lastHelperReply
                ? new Date(lastHelperReply.created_at)
                : new Date(message.created_at);

              const parentRepliesThisRound = (message.replies || []).filter(r =>
                parents.some(p => p.user_id === r.sender_id) &&
                new Date(r.created_at) > roundStartTime
              );

              respondedParentIdsThisRound = [...new Set(parentRepliesThisRound.map(r => r.sender_id))];
              allParentsRepliedThisRound = respondedParentIdsThisRound.length >= parents.length;
              iHaveRepliedThisRound = respondedParentIdsThisRound.includes(user?.id || '');
              respondedParentsThisRound = parents.filter(p => respondedParentIdsThisRound.includes(p.user_id));
              notRespondedParentsThisRound = parents.filter(p => !respondedParentIdsThisRound.includes(p.user_id));
            }

            // Kan de huidige ouder nu antwoorden?
            const parentCanReply = !isHelperMode && !message.closed && message.allow_parent_reply && (
              isGroupMessage && senderIsHelper ? !iHaveRepliedThisRound : true
            );

            // Bepaal statusbadge
            let messageStatus = '';
            let statusColor = '';

            if (message.closed) {
              messageStatus = 'Gesloten';
              statusColor = 'bg-gray-100 text-gray-800';
            } else if (isGroupMessage && senderIsHelper) {
              if (isHelperMode) {
                if (allParentsRepliedThisRound) {
                  messageStatus = `Alle ouders geantwoord (${respondedParentIdsThisRound.length}/${parents.length})`;
                  statusColor = 'bg-green-100 text-green-800';
                } else {
                  messageStatus = `Wacht op antwoord (${respondedParentIdsThisRound.length}/${parents.length})`;
                  statusColor = 'bg-amber-100 text-amber-800';
                }
              } else {
                if (iHaveRepliedThisRound && allParentsRepliedThisRound) {
                  messageStatus = 'Beantwoord — wacht op hulpverlener';
                  statusColor = 'bg-green-100 text-green-800';
                } else if (iHaveRepliedThisRound) {
                  messageStatus = 'Beantwoord — wacht op andere ouder';
                  statusColor = 'bg-amber-100 text-amber-800';
                } else if (!message.allow_parent_reply) {
                  messageStatus = 'Geen reactie nodig';
                  statusColor = 'bg-gray-100 text-gray-600';
                } else {
                  messageStatus = 'Moet beantwoorden';
                  statusColor = 'bg-red-100 text-red-800';
                }
              }
            } else {
              if (message.status === 'MOET_BEANTWOORDEN') {
                if (iAmSender) {
                  messageStatus = isHelperMode ? 'Wacht op antwoord' : 'Wacht op hulpverlener';
                  statusColor = 'bg-amber-100 text-amber-800';
                } else {
                  messageStatus = 'Moet beantwoorden';
                  statusColor = 'bg-red-100 text-red-800';
                }
              } else if (message.status === 'BEANTWOORD') {
                messageStatus = 'Beantwoord';
                statusColor = 'bg-green-100 text-green-800';
              }
            }

            return (
              <div
                key={message.id}
                className="bg-white rounded-lg border border-gray-200"
              >
                <div
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleMessage(message.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{message.subject}</h3>
                        {messageStatus && (
                          <span className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${statusColor}`}>
                            {messageStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 mb-3 line-clamp-2 break-words">{message.message}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="break-words">Van: {message.sender.name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1 break-words">
                          {message.recipient_id ? (
                            <>
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span>Aan: {message.recipient?.name}</span>
                            </>
                          ) : (
                            <>
                              <UsersIcon className="w-3 h-3 flex-shrink-0" />
                              <span>Aan: {isHelperMode ? 'Beide ouders' : 'Alle hulpverleners'}</span>
                            </>
                          )}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">{new Date(message.created_at).toLocaleDateString('nl-NL')}</span>
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
                    {/* Origineel bericht */}
                    <div className="mb-6">
                      <div className="text-sm font-medium text-gray-500 mb-2">Origineel bericht</div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>

                    {/* Status ouders (hulpverlener-view, groepsbericht) */}
                    {isHelperMode && iAmSender && isGroupMessage && (
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-500 mb-3">Status ouders (deze ronde)</div>
                        <div className="space-y-2">
                          {respondedParentsThisRound.map(parent => (
                            <div
                              key={parent.user_id}
                              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2"
                            >
                              <span className="text-sm font-medium text-green-900">{parent.user.name}</span>
                              <span className="text-xs text-green-700 font-medium">Geantwoord</span>
                            </div>
                          ))}
                          {notRespondedParentsThisRound.map(parent => (
                            <div
                              key={parent.user_id}
                              className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
                            >
                              <span className="text-sm font-medium text-amber-900">{parent.user.name}</span>
                              <span className="text-xs text-amber-700 font-medium">Wacht op antwoord</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {message.replies && message.replies.length > 0 && (
                      <div className="space-y-3 mb-6">
                        <div className="text-sm font-medium text-gray-500">Antwoorden</div>
                        {message.replies.map((reply) => {
                          const replySenderIsHelper = helpers.some(h => h.user_id === reply.sender_id);
                          return (
                            <div
                              key={reply.id}
                              className={`p-4 rounded-lg border ${
                                replySenderIsHelper
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className={`text-sm font-medium ${replySenderIsHelper ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {reply.sender.name}
                                  {replySenderIsHelper && (
                                    <span className="ml-2 text-xs font-normal text-blue-600">hulpverlener</span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.created_at).toLocaleString('nl-NL')}
                                </span>
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Antwoordgebied */}
                    {message.closed ? (
                      <div className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg">
                        Deze vraag is gesloten. Er kunnen geen antwoorden meer worden toegevoegd.
                      </div>
                    ) : isHelperMode ? (
                      /* Hulpverlener: actiesectie */
                      <div className="space-y-4">
                        {isGroupMessage && iAmSender && allParentsRepliedThisRound && (
                          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-800">
                              Alle ouders hebben geantwoord. U kunt nu reageren of de vraag sluiten.
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Uw reactie
                          </label>
                          <textarea
                            value={replyText[message.id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [message.id]: e.target.value })}
                            placeholder="Typ uw reactie..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                            rows={3}
                            maxLength={2000}
                          />
                        </div>

                        {/* Toggle: ouders mogen reageren */}
                        <button
                          type="button"
                          onClick={() => {
                            const current = allowParentReplyToggle[message.id] !== false;
                            setAllowParentReplyToggle({ ...allowParentReplyToggle, [message.id]: !current });
                          }}
                          className="flex items-center gap-3 select-none w-fit"
                        >
                          <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                            allowParentReplyToggle[message.id] !== false ? 'bg-slate-700' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              allowParentReplyToggle[message.id] !== false ? 'translate-x-4' : ''
                            }`} />
                          </div>
                          <span className="text-sm text-gray-700 text-left">
                            Ouders mogen verder reageren na uw antwoord
                          </span>
                        </button>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleReply(message.id)}
                            disabled={loading || !replyText[message.id]?.trim()}
                            className="flex-1 flex items-center gap-2 py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 justify-center text-sm sm:text-base"
                          >
                            <Send className="w-4 h-4" />
                            <span>{loading ? 'Bezig...' : 'Reactie versturen'}</span>
                          </button>

                          {confirmClose === message.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCloseMessage(message.id)}
                                disabled={loading}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                              >
                                {loading ? 'Bezig...' : 'Bevestig sluiten'}
                              </button>
                              <button
                                onClick={() => setConfirmClose(null)}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                              >
                                Annuleren
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmClose(message.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 justify-center text-sm sm:text-base"
                            >
                              <X className="w-4 h-4" />
                              <span>Vraag sluiten</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : parentCanReply ? (
                      /* Ouder kan antwoorden */
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Uw antwoord
                        </label>
                        <textarea
                          value={replyText[message.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [message.id]: e.target.value })}
                          placeholder="Typ uw antwoord..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          rows={3}
                          maxLength={2000}
                        />
                        <button
                          onClick={() => handleReply(message.id)}
                          disabled={loading || !replyText[message.id]?.trim()}
                          className="w-full flex items-center gap-2 py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 justify-center text-sm sm:text-base"
                        >
                          <Send className="w-4 h-4" />
                          <span>{loading ? 'Bezig...' : 'Antwoord versturen'}</span>
                        </button>
                        {isGroupMessage && (
                          <p className="text-xs text-gray-500">
                            U kunt één antwoord geven. Uw antwoord is pas zichtbaar voor de andere ouder als beide ouders hebben geantwoord.
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Ouder kan niet (meer) antwoorden */
                      <div className="text-center py-4 rounded-lg bg-gray-100 text-gray-600 text-sm">
                        {iHaveRepliedThisRound
                          ? 'U heeft geantwoord. De hulpverlener reageert zodra alle informatie beschikbaar is.'
                          : 'De hulpverlener heeft aangegeven dat er geen verdere reacties nodig zijn.'}
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
  );
}
