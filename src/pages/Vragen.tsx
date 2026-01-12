import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Send, Users as UsersIcon, User, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  helper_has_read_replies: string[];
  closed: boolean;
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
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipient_id: '',
  });

  const parents = members.filter((m) => m.role === 'PARENT');
  const helpers = members.filter((m) => m.role === 'HELPER');

  useEffect(() => {
    if (!currentFamily) return;
    fetchMessages();
  }, [currentFamily, user]);

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

      if (parentMessage.sender_id === user.id) {
        if (parentMessage.recipient_id === null) {
          await supabase
            .from('helper_messages')
            .update({
              has_responded_users: [],
              helper_has_read_replies: [],
              status: 'MOET_BEANTWOORDEN'
            })
            .eq('id', parentMessageId);
        } else {
          await supabase
            .from('helper_messages')
            .update({ status: 'MOET_BEANTWOORDEN' })
            .eq('id', parentMessageId);
        }
      } else {
        if (parentMessage.recipient_id === null) {
          const currentResponders = Array.isArray(parentMessage.has_responded_users)
            ? parentMessage.has_responded_users
            : [];

          if (!currentResponders.includes(user.id)) {
            await supabase
              .from('helper_messages')
              .update({
                has_responded_users: [...currentResponders, user.id],
                status: 'BEANTWOORD'
              })
              .eq('id', parentMessageId);
          }
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
        .update({
          is_read: true,
          status: message.status === 'NIEUW' ? 'MOET_BEANTWOORDEN' : message.status
        })
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

  const handleCloseMessage = async (messageId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('helper_messages')
        .update({ closed: true })
        .eq('id', messageId);

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
                  <option value="">Hele gezin (beide ouders)</option>
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

            const isHelperSentMessage = isHelperMode && message.sender_id === user?.id;
            const parentCount = parents.length;
            const respondedCount = Array.isArray(message.has_responded_users)
              ? message.has_responded_users.length
              : 0;

            const hasNewResponses = isHelperSentMessage &&
              message.replies &&
              message.replies.some(r =>
                !Array.isArray(message.helper_has_read_replies) ||
                !message.helper_has_read_replies.includes(r.id)
              );

            const allParentsResponded = isHelperSentMessage &&
              message.recipient_id === null &&
              respondedCount >= parentCount;

            const respondedParentIds = message.has_responded_users || [];
            const respondedParents = parents.filter(p => respondedParentIds.includes(p.user_id));
            const notRespondedParents = parents.filter(p => !respondedParentIds.includes(p.user_id));

            let messageStatus = '';
            let statusColor = '';

            if (message.closed) {
              messageStatus = 'Gesloten';
              statusColor = 'bg-gray-100 text-gray-800';
            } else if (message.recipient_id === null) {
              const iAmSender = message.sender_id === user?.id;

              if (iAmSender) {
                if (hasNewResponses) {
                  messageStatus = 'Nieuw';
                  statusColor = 'bg-blue-100 text-blue-800';
                } else if (message.status === 'MOET_BEANTWOORDEN') {
                  if (respondedCount === 0) {
                    messageStatus = `Wacht op antwoord (0/${parentCount})`;
                    statusColor = 'bg-gray-200 text-gray-700';
                  } else if (respondedCount < parentCount) {
                    messageStatus = `Wacht op antwoord (${respondedCount}/${parentCount})`;
                    statusColor = 'bg-amber-100 text-amber-800';
                  } else {
                    messageStatus = 'Volledig beantwoord';
                    statusColor = 'bg-green-100 text-green-800';
                  }
                } else if (message.status === 'BEANTWOORD') {
                  if (respondedCount >= parentCount) {
                    messageStatus = 'Volledig beantwoord';
                    statusColor = 'bg-green-100 text-green-800';
                  } else {
                    messageStatus = `Beantwoord (${respondedCount}/${parentCount})`;
                    statusColor = 'bg-green-100 text-green-800';
                  }
                } else {
                  messageStatus = 'Nieuw';
                  statusColor = 'bg-blue-100 text-blue-800';
                }
              } else {
                if (isUnread || hasUnreadReplies) {
                  messageStatus = 'Nieuw';
                  statusColor = 'bg-blue-100 text-blue-800';
                } else if (message.status === 'MOET_BEANTWOORDEN') {
                  messageStatus = 'Moet beantwoorden';
                  statusColor = 'bg-red-100 text-red-800';
                } else if (message.status === 'BEANTWOORD') {
                  messageStatus = 'Beantwoord';
                  statusColor = 'bg-green-100 text-green-800';
                } else {
                  messageStatus = 'Nieuw';
                  statusColor = 'bg-blue-100 text-blue-800';
                }
              }
            } else {
              const iAmRecipient = message.recipient_id === user?.id;
              const iAmSender = message.sender_id === user?.id;

              if (isUnread || hasUnreadReplies) {
                messageStatus = 'Nieuw';
                statusColor = 'bg-blue-100 text-blue-800';
              } else if (message.status === 'NIEUW') {
                if (iAmRecipient) {
                  messageStatus = 'Nieuw';
                  statusColor = 'bg-blue-100 text-blue-800';
                } else {
                  messageStatus = 'Verzonden';
                  statusColor = 'bg-gray-200 text-gray-700';
                }
              } else if (message.status === 'MOET_BEANTWOORDEN') {
                if (iAmRecipient) {
                  messageStatus = 'Moet beantwoorden';
                  statusColor = 'bg-red-100 text-red-800';
                } else {
                  messageStatus = 'Wacht op antwoord';
                  statusColor = 'bg-gray-200 text-gray-700';
                }
              } else if (message.status === 'BEANTWOORD') {
                messageStatus = 'Beantwoord';
                statusColor = 'bg-green-100 text-green-800';
              } else {
                messageStatus = 'Nieuw';
                statusColor = 'bg-blue-100 text-blue-800';
              }
            }

            return (
              <div
                key={message.id}
                className={`bg-white rounded-lg border ${
                  hasNewResponses
                    ? 'border-blue-400 shadow-md'
                    : isUnread || hasUnreadReplies
                    ? 'border-blue-400 shadow-md'
                    : 'border-gray-200'
                }`}
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleMessage(message.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                        {messageStatus && (
                          <span className={`px-2 py-1 text-xs rounded font-medium ${statusColor}`}>
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
                              <User className="w-3 h-3" />
                              Aan: {message.recipient?.name}
                            </>
                          ) : (
                            <>
                              <UsersIcon className="w-3 h-3" />
                              Aan: {isHelperMode ? 'Hele gezin' : 'Alle hulpverleners'}
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

                    {isHelperSentMessage && message.recipient_id === null && (
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-500 mb-3">Status ouders</div>
                        <div className="space-y-2">
                          {respondedParents.map(parent => (
                            <div
                              key={parent.user_id}
                              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2"
                            >
                              <span className="text-sm font-medium text-green-900">
                                {parent.user.name}
                              </span>
                              <span className="text-xs text-green-700 font-medium">
                                Beantwoord
                              </span>
                            </div>
                          ))}
                          {notRespondedParents.map(parent => (
                            <div
                              key={parent.user_id}
                              className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
                            >
                              <span className="text-sm font-medium text-amber-900">
                                {parent.user.name}
                              </span>
                              <span className="text-xs text-amber-700 font-medium">
                                Wacht op antwoord
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

                    {!message.closed ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Antwoord
                        </label>
                        <textarea
                          value={replyText[message.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [message.id]: e.target.value })}
                          placeholder="Typ je antwoord..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                          rows={3}
                          maxLength={2000}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(message.id)}
                            disabled={loading || !replyText[message.id]?.trim()}
                            className="flex-1 flex items-center gap-2 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 justify-center"
                          >
                            <Send className="w-4 h-4" />
                            {loading ? 'Bezig...' : 'Antwoord versturen'}
                          </button>
                          {message.sender_id === user?.id && isHelperMode && (
                            <button
                              onClick={() => handleCloseMessage(message.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                              title="Vraag sluiten"
                            >
                              <X className="w-4 h-4" />
                              Sluiten
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-gray-100 rounded-lg">
                        Deze vraag is gesloten. Er kunnen geen antwoorden meer worden toegevoegd.
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
