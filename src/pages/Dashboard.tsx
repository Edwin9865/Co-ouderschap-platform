import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, BookOpen, AlertCircle, UserPlus } from 'lucide-react';
import type { Event, LogEntry, Request } from '../lib/types';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 59, g: 130, b: 246 };
};

const getColorStyles = (hexColor: string) => {
  const rgb = hexToRgb(hexColor);
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`,
    borderColor: hexColor,
    color: hexColor,
  };
};

export function Dashboard() {
  const { currentFamily, children, subscription, isHelper, isHelperMode, members } = useFamily();
  const { user } = useAuth();
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [hasCoupling, setHasCoupling] = useState(false);
  const [unansweredMessages, setUnansweredMessages] = useState<any[]>([]);

  const getChildColor = (childId: string | null) => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child ? getColorStyles(child.color || '#3b82f6') : null;
  };

  const generateRecurringEvents = (baseEvent: Event, maxDate: Date, maxInstances = 10): Event[] => {
    if (!baseEvent.recurrence_rule) return [baseEvent];

    const events: Event[] = [baseEvent];
    const startDate = new Date(baseEvent.start_at);
    const endDate = baseEvent.recurrence_end_date
      ? new Date(baseEvent.recurrence_end_date)
      : maxDate;

    let currentDate = new Date(startDate);
    let instanceCount = 0;

    while (currentDate <= endDate && instanceCount < maxInstances) {
      switch (baseEvent.recurrence_rule) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'YEARLY':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          return events;
      }

      if (currentDate > endDate) break;

      const duration = baseEvent.end_at
        ? new Date(baseEvent.end_at).getTime() - startDate.getTime()
        : 0;

      const recurringEvent: Event = {
        ...baseEvent,
        id: `${baseEvent.id}-recur-${instanceCount}`,
        start_at: currentDate.toISOString(),
        end_at: duration > 0
          ? new Date(currentDate.getTime() + duration).toISOString()
          : baseEvent.end_at,
      };

      events.push(recurringEvent);
      instanceCount++;
    }

    return events;
  };

  const fetchData = useCallback(async () => {
    if (!currentFamily || !user) return;
      const basePromises = [
        supabase
          .from('events')
          .select('*')
          .eq('family_id', currentFamily.id)
          .is('parent_event_id', null)
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true }),
        supabase
          .from('log_entries')
          .select('*')
          .eq('family_id', currentFamily.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5),
      ];

      if (isHelper || isHelperMode) {
        basePromises.push(
          supabase
            .from('helper_messages')
            .select('id, subject, created_at, sender_id, recipient_id, status, closed')
            .eq('family_id', currentFamily.id)
            .eq('closed', false)
            .is('parent_message_id', null)
            .order('created_at', { ascending: false })
        );
      } else {
        basePromises.push(
          supabase
            .from('requests')
            .select('*')
            .eq('family_id', currentFamily.id)
            .in('status', ['OPEN', 'COUNTERED'])
            .order('created_at', { ascending: false })
        );
        basePromises.push(
          supabase
            .from('family_invite_codes')
            .select('code')
            .eq('family_id', currentFamily.id)
            .is('used_at', null)
            .maybeSingle()
        );
        basePromises.push(
          supabase
            .from('family_members')
            .select('id')
            .eq('family_id', currentFamily.id)
            .eq('status', 'ACTIVE')
        );
      }

      const results = await Promise.all(basePromises);
      const [eventsResult, logsResult] = results;

      if (isHelper || isHelperMode) {
        const messagesResult = results[2];

        const messagesWithReplies = await Promise.all(
          (messagesResult.data || []).map(async (msg: any) => {
            const { data: replies } = await supabase
              .from('helper_messages')
              .select('id, sender_id, recipient_id, status, created_at')
              .eq('parent_message_id', msg.id);

            return {
              ...msg,
              replies: replies || [],
            };
          })
        );

        const unanswered = messagesWithReplies.filter((msg: any) => {
          const parentNeedsAttention = (msg.status === 'NIEUW' || msg.status === 'MOET_BEANTWOORDEN') &&
                                        (msg.recipient_id === user.id ||
                                         (msg.recipient_id === null && msg.sender_id !== user.id));

          const hasUnreadReplies = msg.replies?.some((r: any) =>
            (r.status === 'NIEUW' || r.status === 'MOET_BEANTWOORDEN') &&
            (r.recipient_id === user.id ||
             (r.recipient_id === null && r.sender_id !== user.id))
          );

          return parentNeedsAttention || hasUnreadReplies;
        });

        setUnansweredMessages(unanswered);
      } else {
        const [, , requestsResult, inviteCodeResult, familyMembersResult] = results;
        const myOpenRequests = (requestsResult.data || []).filter(
          (req: Request) => req.last_action_by !== user.id
        );
        setOpenRequests(myOpenRequests);
        setInviteCode(inviteCodeResult.data?.code || '');
        setHasCoupling((familyMembersResult.data?.length || 0) > 1);

        const { data: parentMessages } = await supabase
          .from('helper_messages')
          .select('id, sender_id, recipient_id, status, closed')
          .eq('family_id', currentFamily.id)
          .eq('closed', false)
          .is('parent_message_id', null);

        const parentMessagesWithReplies = await Promise.all(
          (parentMessages || []).map(async (msg: any) => {
            const { data: replies } = await supabase
              .from('helper_messages')
              .select('id, sender_id, recipient_id, status')
              .eq('parent_message_id', msg.id);

            return {
              ...msg,
              replies: replies || [],
            };
          })
        );

        const parentUnanswered = parentMessagesWithReplies.filter((msg: any) => {
          const parentNeedsAttention = (msg.status === 'NIEUW' || msg.status === 'MOET_BEANTWOORDEN') &&
                                        (msg.recipient_id === user.id ||
                                         (msg.recipient_id === null && msg.sender_id !== user.id));

          const hasUnreadReplies = msg.replies?.some((r: any) =>
            (r.status === 'NIEUW' || r.status === 'MOET_BEANTWOORDEN') &&
            (r.recipient_id === user.id ||
             (r.recipient_id === null && r.sender_id !== user.id))
          );

          return parentNeedsAttention || hasUnreadReplies;
        });

        setUnansweredMessages(parentUnanswered);
      }

      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

      const allEvents = (eventsResult.data || [])
        .flatMap(event => generateRecurringEvents(event, twoMonthsFromNow, 10))
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        .slice(0, 5);

      setRecentEvents(allEvents);
      setRecentLogs(logsResult.data || []);
      setLoading(false);
  }, [currentFamily, user, isHelper, isHelperMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!currentFamily) return;

    const messagesChannel = supabase
      .channel(`dashboard_messages_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'helper_messages',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const requestsChannel = supabase
      .channel(`dashboard_requests_${currentFamily.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `family_id=eq.${currentFamily.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      requestsChannel.unsubscribe();
    };
  }, [currentFamily, fetchData]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  const eventTypeLabels: Record<Event['type'], string> = {
    medical: 'Medisch',
    school: 'School',
    sport: 'Sport',
    handover: 'Overdracht',
    other: 'Anders',
  };

  const categoryLabels: Record<LogEntry['category'], string> = {
    health: 'Gezondheid',
    behavior: 'Gedrag',
    development: 'Ontwikkeling',
    incident: 'Incident',
    achievement: 'Prestatie',
    communication: 'Communicatie',
    other: 'Anders',
  };

  if (isHelper || isHelperMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Overzicht van {currentFamily?.name || 'gezin'}</p>
        </div>

        {unansweredMessages.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  {unansweredMessages.length} openstaande {unansweredMessages.length === 1 ? 'vraag' : 'vragen'}
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  Deze vragen wachten nog op antwoorden van een of beide ouders.
                </p>
                <Link
                  to="/vragen"
                  className="text-sm text-amber-800 hover:underline font-medium"
                >
                  Bekijk openstaande vragen
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{children.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              {children.length === 1 ? 'Kind' : 'Kinderen'}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{unansweredMessages.length}</div>
            <div className="text-sm text-gray-600 mt-1">Wachtend op antwoord</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{recentEvents.length}</div>
            <div className="text-sm text-gray-600 mt-1">Aankomende afspraken</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-slate-600" />
                Aankomende agenda
              </h2>
              <Link to="/agenda" className="text-sm text-slate-700 hover:underline">
                Alles bekijken
              </Link>
            </div>
            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Geen aankomende afspraken</p>
              ) : (
                recentEvents.map((event) => {
                  const child = event.child_id ? children.find(c => c.id === event.child_id) : null;
                  const colors = child ? getChildColor(child.id) : null;
                  return (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{event.title}</span>
                            {child && colors && (
                              <span
                                className="px-2.5 py-0.5 text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: colors.backgroundColor,
                                  color: colors.color,
                                }}
                              >
                                {child.first_name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {eventTypeLabels[event.type]}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.start_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-slate-600" />
                Recent logboek
              </h2>
              <Link to="/logboek" className="text-sm text-slate-700 hover:underline">
                Alles bekijken
              </Link>
            </div>
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500">Geen logboekregistraties</p>
              ) : (
                recentLogs.map((log) => {
                  const child = log.child_id ? children.find(c => c.id === log.child_id) : null;
                  const colors = child ? getChildColor(child.id) : null;
                  return (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 line-clamp-1">{log.title}</span>
                        {child && colors && (
                          <span
                            className="px-2.5 py-0.5 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor: colors.backgroundColor,
                              color: colors.color,
                            }}
                          >
                            {child.first_name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{categoryLabels[log.category]}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.created_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overzicht van recente activiteiten en openstaande items</p>
      </div>

      {(openRequests.length > 0 || unansweredMessages.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div className="flex-1">
              {openRequests.length > 0 && (
                <>
                  <h3 className="font-semibold text-amber-900 mb-2">
                    {openRequests.length} openstaande {openRequests.length === 1 ? 'verzoek' : 'verzoeken'}
                  </h3>
                  <Link
                    to="/verzoeken"
                    className="text-sm text-amber-800 hover:underline font-medium"
                  >
                    Bekijk openstaande verzoeken
                  </Link>
                </>
              )}
              {unansweredMessages.length > 0 && (
                <>
                  <h3 className={`font-semibold text-amber-900 mb-2 ${openRequests.length > 0 ? 'mt-4' : ''}`}>
                    {unansweredMessages.length} openstaande {unansweredMessages.length === 1 ? 'vraag' : 'vragen'}
                  </h3>
                  <p className="text-sm text-amber-800 mb-3">
                    Deze vragen wachten op jouw antwoord.
                  </p>
                  <Link
                    to="/vragen"
                    className="text-sm text-amber-800 hover:underline font-medium"
                  >
                    Bekijk openstaande vragen
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!hasCoupling && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-semibold text-gray-900">Co-ouder uitnodigen</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Deel deze koppelcode met je co-ouder. Hij/zij kan deze code gebruiken bij het registreren om toegang te krijgen tot dit gezin.
              </p>
              <div className="flex items-center gap-3">
                <div className="bg-white px-6 py-3 rounded-lg border-2 border-slate-300 font-mono text-2xl font-bold text-slate-900 tracking-wider">
                  {inviteCode || 'LADEN...'}
                </div>
                <button
                  onClick={handleCopyCode}
                  disabled={!inviteCode}
                  className="px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {codeCopied ? 'Gekopieerd!' : 'Kopieer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{children.length}</div>
          <div className="text-sm text-gray-600 mt-1">
            {children.length === 1 ? 'Kind' : 'Kinderen'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{openRequests.length}</div>
          <div className="text-sm text-gray-600 mt-1">Open verzoeken</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-lg font-semibold text-slate-700">{subscription?.plan || 'FREE'}</div>
          <div className="text-sm text-gray-600 mt-1">Huidig abonnement</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-slate-600" />
              Aankomende agenda
            </h2>
            <Link to="/agenda" className="text-sm text-slate-700 hover:underline">
              Alles bekijken
            </Link>
          </div>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Geen aankomende afspraken</p>
            ) : (
              recentEvents.map((event) => {
                const child = event.child_id ? children.find(c => c.id === event.child_id) : null;
                const colors = child ? getChildColor(child.id) : null;
                return (
                  <div key={event.id} className="relative group">
                    <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{event.title}</span>
                            {child && colors && (
                              <span
                                className="px-2.5 py-0.5 text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: colors.backgroundColor,
                                  color: colors.color,
                                }}
                              >
                                {child.first_name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {eventTypeLabels[event.type]}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.start_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                    <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                          {eventTypeLabels[event.type]}
                        </span>
                        {child && (() => {
                          const colors = getChildColor(child.id);
                          return colors ? (
                            <span
                              className="px-2.5 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: colors.backgroundColor,
                                color: colors.color,
                              }}
                            >
                              {child.first_name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-3">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">
                          {event.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <strong>Start:</strong>{' '}
                          {new Date(event.start_at).toLocaleString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {event.end_at && (
                          <div>
                            <strong>Eind:</strong>{' '}
                            {new Date(event.end_at).toLocaleString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        {event.location && (
                          <div>
                            <strong>Locatie:</strong> {event.location}
                          </div>
                        )}
                        {event.recurrence_rule && (
                          <div>
                            <strong>Herhaling:</strong> {event.recurrence_rule}
                            {event.recurrence_end_date && (
                              <span> (tot {new Date(event.recurrence_end_date).toLocaleDateString('nl-NL')})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-slate-600" />
              Recent logboek
            </h2>
            <Link to="/logboek" className="text-sm text-slate-700 hover:underline">
              Alles bekijken
            </Link>
          </div>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500">Nog geen logboekitems</p>
            ) : (
              recentLogs.map((log) => {
                const child = log.child_id ? children.find(c => c.id === log.child_id) : null;
                const colors = child ? getChildColor(child.id) : null;
                return (
                  <div key={log.id} className="relative group">
                    <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{log.title}</span>
                            {child && colors && (
                              <span
                                className="px-2.5 py-0.5 text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: colors.backgroundColor,
                                  color: colors.color,
                                }}
                              >
                                {child.first_name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {categoryLabels[log.category]}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.occurred_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    </div>
                    <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                          {categoryLabels[log.category]}
                        </span>
                        {child && (() => {
                          const colors = getChildColor(child.id);
                          return colors ? (
                            <span
                              className="px-2.5 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: colors.backgroundColor,
                                color: colors.color,
                              }}
                            >
                              {child.first_name}
                            </span>
                          ) : null;
                        })()}
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(log.occurred_at).toLocaleString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{log.title}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {log.details || 'Geen details beschikbaar'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Belangrijk:</strong> Alle gegevens in dit platform worden permanent opgeslagen en
          zijn exporteerbaar voor dossierbeheer. Niets kan definitief worden verwijderd.
        </p>
      </div>
    </div>
  );
}
