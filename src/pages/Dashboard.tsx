import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, BookOpen, AlertCircle, UserPlus, Users, ArrowRight } from 'lucide-react';
import type { Event, LogEntry, Request } from '../lib/types';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 59, g: 130, b: 246 };
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
  const navigate = useNavigate();
  const {
    currentFamily,
    children,
    subscription,
    isHelper,
    isHelperMode,
    members,
    loading: familyLoading,
  } = useFamily();
  const { user } = useAuth();

  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [openRequests, setOpenRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [hasCoupling, setHasCoupling] = useState(false);
  const [unansweredMessages, setUnansweredMessages] = useState<any[]>([]);
  const [messagesWaitingOnParents, setMessagesWaitingOnParents] = useState<any[]>([]);
  const [pendingCouplingRequests, setPendingCouplingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (isHelperMode && !familyLoading && !currentFamily) {
      navigate('/families');
    }
  }, [isHelperMode, currentFamily, familyLoading, navigate]);

  const getChildColor = (childId: string | null) => {
    if (!childId) return null;
    const child = children.find((c) => c.id === childId);
    return child ? getColorStyles(child.color || '#3b82f6') : null;
  };

  const generateRecurringEvents = (baseEvent: Event, maxDate: Date, maxInstances = 10): Event[] => {
    if (!baseEvent.recurrence_rule) return [baseEvent];

    const now = new Date();
    const startDate = new Date(baseEvent.start_at);
    const endDate = baseEvent.recurrence_end_date ? new Date(baseEvent.recurrence_end_date) : maxDate;
    const duration = baseEvent.end_at ? new Date(baseEvent.end_at).getTime() - startDate.getTime() : 0;

    const advance = (date: Date): boolean => {
      switch (baseEvent.recurrence_rule) {
        case 'DAILY': date.setDate(date.getDate() + 1); return true;
        case 'WEEKLY': date.setDate(date.getDate() + 7); return true;
        case 'MONTHLY': date.setMonth(date.getMonth() + 1); return true;
        case 'YEARLY': date.setFullYear(date.getFullYear() + 1); return true;
        default: return false; // onbekend formaat → stop
      }
    };

    // Snel vooruitspoelen naar de eerste instantie die nog niet verstreken is
    const currentDate = new Date(startDate);
    while (currentDate < now && currentDate <= endDate) {
      if (!advance(currentDate)) return []; // onbekend formaat, geef niets terug
    }

    const events: Event[] = [];
    // Voeg de originele afspraak toe als die nog in de toekomst ligt
    if (startDate >= now && startDate <= endDate && startDate <= maxDate) {
      events.push(baseEvent);
    }

    let instanceCount = 0;
    while (currentDate <= endDate && currentDate <= maxDate && instanceCount < maxInstances) {
      if (currentDate.getTime() !== startDate.getTime()) {
        events.push({
          ...baseEvent,
          id: `${baseEvent.id}-recur-${currentDate.getTime()}`,
          start_at: new Date(currentDate).toISOString(),
          end_at: duration > 0 ? new Date(currentDate.getTime() + duration).toISOString() : baseEvent.end_at,
        });
        instanceCount++;
      }
      if (!advance(currentDate)) break; // onbekend formaat → stop loop
    }

    return events;
  };

  const fetchData = useCallback(async () => {
    if (!currentFamily || !user) return;

    setLoading(true);

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isFree = subscription?.plan === 'FREE';

    // ✅ Fix: use occurred_at for FREE plan (same logic as Logboek.tsx)
    const logsQuery = supabase
      .from('log_entries')
      .select('*')
      .eq('family_id', currentFamily.id)
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })
      .limit(20);

    const logsPromise = isFree ? logsQuery.gte('occurred_at', thirtyDaysAgo.toISOString()) : logsQuery;

    const basePromises: Promise<any>[] = [
      supabase
        .from('events')
        .select('*')
        .eq('family_id', currentFamily.id)
        .is('parent_event_id', null)
        .order('start_at', { ascending: true }),

      logsPromise,
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
        supabase.from('family_members').select('id').eq('family_id', currentFamily.id).eq('status', 'ACTIVE')
      );
      basePromises.push(
        supabase
          .from('coupling_requests')
          .select('*, from_user:users!coupling_requests_from_user_id_fkey(name, email)')
          .eq('to_user_id', user.id)
          .eq('status', 'PENDING')
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

      const parentMembers = members.filter(m => m.role === 'PARENT');
      const helperIds = members.filter(m => m.role === 'HELPER').map(m => m.user_id);

      // Berichten die de hulpverlener zelf moet beantwoorden (van ouders aan hulpverlener)
      const needsHelperReply = messagesWithReplies.filter((msg: any) => {
        if (msg.closed) return false;
        return (
          msg.status === 'MOET_BEANTWOORDEN' &&
          (msg.recipient_id === user.id || (msg.recipient_id === null && msg.sender_id !== user.id))
        );
      });

      // Berichten van hulpverlener aan beide ouders, wachtend op ouder-antwoorden (deze ronde)
      const waitingOnParents = messagesWithReplies.filter((msg: any) => {
        if (msg.closed) return false;
        if (msg.sender_id !== user.id) return false;
        if (msg.recipient_id !== null) return false; // alleen groepsberichten

        const helperReplies = (msg.replies || []).filter((r: any) => helperIds.includes(r.sender_id));
        const lastHelperReply = helperReplies[helperReplies.length - 1];
        const roundStartTime = lastHelperReply ? new Date(lastHelperReply.created_at) : new Date(msg.created_at);

        const parentRepliesThisRound = (msg.replies || []).filter((r: any) =>
          parentMembers.some((p: any) => p.user_id === r.sender_id) &&
          new Date(r.created_at) > roundStartTime
        );
        const respondedCount = new Set(parentRepliesThisRound.map((r: any) => r.sender_id)).size;
        return respondedCount < parentMembers.length;
      });

      setUnansweredMessages(needsHelperReply);
      setMessagesWaitingOnParents(waitingOnParents);
    } else {
      const [, , requestsResult, inviteCodeResult, familyMembersResult, couplingRequestsResult] = results;

      const myOpenRequests = (requestsResult.data || []).filter((req: Request) => req.last_action_by !== user.id);
      setOpenRequests(myOpenRequests);

      setInviteCode(inviteCodeResult.data?.code || '');

      // NOTE: members is in context, but this check is fine based on active family_members count
      setHasCoupling((familyMembersResult.data?.length || 0) > 1);

      setPendingCouplingRequests(couplingRequestsResult.data || []);

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
            .select('id, sender_id, recipient_id, status, created_at')
            .eq('parent_message_id', msg.id);

          return {
            ...msg,
            replies: replies || [],
          };
        })
      );

      const helperMemberIds = members.filter(m => m.role === 'HELPER').map(m => m.user_id);

      const parentUnanswered = parentMessagesWithReplies.filter((msg: any) => {
        const isGroupFromHelper = msg.recipient_id === null && helperMemberIds.includes(msg.sender_id);
        const needsMyResponse =
          msg.status === 'MOET_BEANTWOORDEN' &&
          (msg.recipient_id === user.id || isGroupFromHelper);

        if (!needsMyResponse) return false;

        // Groepsbericht van hulpverlener: badge niet tonen als ik al geantwoord heb in deze ronde
        if (isGroupFromHelper) {
          const helperReplies = (msg.replies || []).filter((r: any) => helperMemberIds.includes(r.sender_id));
          const lastHelperReply = helperReplies[helperReplies.length - 1];
          const roundStartTime = lastHelperReply ? new Date(lastHelperReply.created_at) : new Date(msg.created_at);
          const iHaveRepliedThisRound = (msg.replies || []).some(
            (r: any) => r.sender_id === user.id && new Date(r.created_at) > roundStartTime
          );
          if (iHaveRepliedThisRound) return false;
        }

        return true;
      });

      setUnansweredMessages(parentUnanswered);
    }

    // Filter by visible children client-side (avoids Supabase .or() syntax issues with UUIDs)
    const visibleChildIds = new Set(children.map(c => c.id));
    const isVisibleEvent = (e: Event) => e.child_id === null || visibleChildIds.has(e.child_id);
    const isVisibleLog = (l: LogEntry) => l.child_id === null || visibleChildIds.has(l.child_id);

    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    const allEvents = (eventsResult.data || [])
      .filter(isVisibleEvent)
      .flatMap((event: Event) => generateRecurringEvents(event, twoMonthsFromNow, 10))
      .filter((event: Event) => new Date(event.start_at) >= new Date())
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 3);

    setRecentEvents(allEvents);
    setRecentLogs(((logsResult.data || []) as LogEntry[]).filter(isVisibleLog).slice(0, 5));
    setLoading(false);
  }, [currentFamily, user, isHelper, isHelperMode, subscription, children]);

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

    const couplingChannel = supabase
      .channel(`dashboard_coupling_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coupling_requests',
          filter: `to_user_id=eq.${user?.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      requestsChannel.unsubscribe();
      couplingChannel.unsubscribe();
    };
  }, [currentFamily, fetchData, user]);

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

  if (isHelperMode && familyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">Gezin wordt geladen...</div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Overzicht van {currentFamily?.name || 'gezin'}
          </p>
        </div>

        {(unansweredMessages.length > 0 || messagesWaitingOnParents.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-3">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                {unansweredMessages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">
                      {unansweredMessages.length} {unansweredMessages.length === 1 ? 'vraag' : 'vragen'} wacht op uw reactie
                    </h3>
                    <Link to="/vragen" className="text-sm text-amber-800 hover:underline font-medium">
                      Bekijk openstaande vragen
                    </Link>
                  </div>
                )}
                {messagesWaitingOnParents.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">
                      {messagesWaitingOnParents.length} {messagesWaitingOnParents.length === 1 ? 'vraag' : 'vragen'} wacht op ouder-antwoord
                    </h3>
                    <Link to="/vragen" className="text-sm text-amber-800 hover:underline font-medium">
                      Bekijk vragen
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center min-w-0">
                <Calendar className="w-5 h-5 mr-2 text-slate-600 shrink-0" />
                <span className="truncate">Aankomende agenda</span>
              </h2>
              <Link to="/agenda" className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-full shrink-0 transition-colors" aria-label="Alles bekijken">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Geen aankomende afspraken</p>
              ) : (
                recentEvents.map((event) => {
                  const child = event.child_id ? children.find((c) => c.id === event.child_id) : null;
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
                          <div className="text-sm text-gray-600">{eventTypeLabels[event.type]}</div>
                        </div>
                        <div className="text-sm text-gray-500">{new Date(event.start_at).toLocaleDateString('nl-NL')}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center min-w-0">
                <BookOpen className="w-5 h-5 mr-2 text-slate-600 shrink-0" />
                <span className="truncate">Recent logboek</span>
              </h2>
              <Link to="/logboek" className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-full shrink-0 transition-colors" aria-label="Alles bekijken">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500">Geen logboekregistraties</p>
              ) : (
                recentLogs.map((log) => {
                  const child = log.child_id ? children.find((c) => c.id === log.child_id) : null;
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
                        {new Date(log.occurred_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{children.length}</div>
            <div className="text-sm text-gray-600 mt-1">{children.length === 1 ? 'Kind' : 'Kinderen'}</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className={`text-3xl font-bold ${unansweredMessages.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {unansweredMessages.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Wacht op uw reactie</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className={`text-3xl font-bold ${messagesWaitingOnParents.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {messagesWaitingOnParents.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Wacht op ouders</div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{recentEvents.length}</div>
            <div className="text-sm text-gray-600 mt-1">Aankomende afspraken</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 drop-shadow-sm">Dashboard</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-700">Overzicht van recente activiteiten en openstaande items</p>
      </div>

      <div className="space-y-4">
        {pendingCouplingRequests.length > 0 && (
          <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
            <div className="p-5" style={{ background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.50) 0%, rgba(191, 219, 254, 0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
              <div className="flex items-start">
                <Users className="w-5 h-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Koppelverzoek van co-ouder</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    {pendingCouplingRequests[0].from_user?.name} wil met je koppelen. Ga naar instellingen om het verzoek te accepteren of af te wijzen.
                  </p>
                  <Link
                    to="/instellingen/koppelen"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Bekijk koppelverzoek
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {(openRequests.length > 0 || unansweredMessages.length > 0) && (
          <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5" style={{ background: 'linear-gradient(135deg, rgba(253, 230, 138, 0.50) 0%, rgba(252, 211, 77, 0.25) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                {openRequests.length > 0 && (
                  <>
                    <h3 className="font-semibold text-amber-900 mb-1">
                      {openRequests.length} openstaande {openRequests.length === 1 ? 'verzoek' : 'verzoeken'}
                    </h3>
                    <Link to="/verzoeken" className="text-sm text-amber-800 hover:underline font-medium">
                      Bekijk openstaande verzoeken
                    </Link>
                  </>
                )}
                {unansweredMessages.length > 0 && (
                  <>
                    <h3 className={`font-semibold text-amber-900 mb-1 ${openRequests.length > 0 ? 'mt-3' : ''}`}>
                      {unansweredMessages.length} openstaande {unansweredMessages.length === 1 ? 'vraag' : 'vragen'}
                    </h3>
                    <p className="text-sm text-amber-800 mb-2">Deze vragen wachten op jouw antwoord.</p>
                    <Link to="/vragen" className="text-sm text-amber-800 hover:underline font-medium">
                      Bekijk openstaande vragen
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {!hasCoupling && (
          <div className="overflow-hidden rounded-2xl shadow-sm border-2 border-white/70">
          <div className="p-5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0.05) 100%)' }}>
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-semibold text-gray-900">Co-ouder uitnodigen</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Deel deze koppelcode met je co-ouder om toegang te geven tot dit gezin.
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-white px-5 py-2.5 rounded-xl border-2 border-slate-300 font-mono text-xl font-bold text-slate-900 tracking-wider">
                {inviteCode || 'LADEN...'}
              </div>
              <button
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {codeCopied ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
          </div>
          </div>
        )}

        {/* Agenda card */}
        <div className="rounded-2xl shadow-sm border-2 border-white/70">
          <div
            className="p-5"
            style={{ background: 'linear-gradient(135deg, rgba(255, 200, 130, 0.35) 0%, rgba(255, 225, 170, 0.15) 60%, rgba(255,255,255,0.05) 100%)' }}
          >
            <div className="flex items-start gap-4 mb-4">
              <img src="/icons/section-icons/agenda.png" alt="Agenda" className="w-24 h-24 shrink-0 drop-shadow-md" />
              <div className="flex-1 flex items-start justify-between gap-2 pt-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 min-w-0 truncate">Aankomende agenda</h2>
                <Link
                  to="/agenda"
                  className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-full shrink-0 transition-colors"
                  aria-label="Alles bekijken"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Geen aankomende afspraken</p>
              ) : (
                recentEvents.map((event) => {
                  const child = event.child_id ? children.find((c) => c.id === event.child_id) : null;
                  const colors = child ? getChildColor(child.id) : null;
                  return (
                    <div key={event.id} className="relative group">
                      <div className="p-3 bg-white/40 rounded-xl cursor-pointer hover:bg-white/60 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-gray-900 text-sm">{event.title}</span>
                              {child && colors && (
                                <span
                                  className="px-2 py-0.5 text-xs rounded-full font-medium"
                                  style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
                                >
                                  {child.first_name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{eventTypeLabels[event.type]}</div>
                          </div>
                          <div className="text-xs text-gray-500 shrink-0 ml-2">{new Date(event.start_at).toLocaleDateString('nl-NL')}</div>
                        </div>
                      </div>
                      <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                            {eventTypeLabels[event.type]}
                          </span>
                          {child &&
                            (() => {
                              const colors = getChildColor(child.id);
                              return colors ? (
                                <span
                                  className="px-2.5 py-1 text-xs rounded-full font-medium"
                                  style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
                                >
                                  {child.first_name}
                                </span>
                              ) : null;
                            })()}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-3">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">{event.description}</p>
                        )}
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <strong>Start:</strong>{' '}
                            {new Date(event.start_at).toLocaleString('nl-NL', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                          {event.end_at && (
                            <div>
                              <strong>Eind:</strong>{' '}
                              {new Date(event.end_at).toLocaleString('nl-NL', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </div>
                          )}
                          {event.location && <div><strong>Locatie:</strong> {event.location}</div>}
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
        </div>

        {/* Logboek card */}
        <div className="rounded-2xl shadow-sm border-2 border-white/70">
          <div
            className="p-5"
            style={{ background: 'linear-gradient(135deg, rgba(140, 210, 175, 0.35) 0%, rgba(180, 230, 200, 0.15) 60%, rgba(255,255,255,0.05) 100%)' }}
          >
            <div className="flex items-start gap-4 mb-4">
              <img src="/icons/section-icons/logboek.png" alt="Logboek" className="w-24 h-24 shrink-0 drop-shadow-md" />
              <div className="flex-1 flex items-start justify-between gap-2 pt-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 min-w-0 truncate">Recent logboek</h2>
                <Link
                  to="/logboek"
                  className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-full shrink-0 transition-colors"
                  aria-label="Alles bekijken"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-gray-500">Nog geen logboekitems</p>
              ) : (
                recentLogs.map((log) => {
                  const child = log.child_id ? children.find((c) => c.id === log.child_id) : null;
                  const colors = child ? getChildColor(child.id) : null;
                  return (
                    <div key={log.id} className="relative group">
                      <div className="p-3 bg-white/40 rounded-xl cursor-pointer hover:bg-white/60 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-gray-900 text-sm">{log.title}</span>
                              {child && colors && (
                                <span
                                  className="px-2 py-0.5 text-xs rounded-full font-medium"
                                  style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
                                >
                                  {child.first_name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{categoryLabels[log.category]}</div>
                          </div>
                          <div className="text-xs text-gray-500 shrink-0 ml-2">
                            {new Date(log.occurred_at).toLocaleDateString('nl-NL')}
                          </div>
                        </div>
                      </div>
                      <div className="hidden group-hover:block absolute left-0 right-0 top-full mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                            {categoryLabels[log.category]}
                          </span>
                          {child &&
                            (() => {
                              const colors = getChildColor(child.id);
                              return colors ? (
                                <span
                                  className="px-2.5 py-1 text-xs rounded-full font-medium"
                                  style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
                                >
                                  {child.first_name}
                                </span>
                              ) : null;
                            })()}
                          <span className="ml-auto text-xs text-gray-500">
                            {new Date(log.occurred_at).toLocaleString('nl-NL', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
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

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            className="overflow-hidden rounded-2xl shadow-sm relative border-2 border-white/70"
            style={{ background: 'linear-gradient(135deg, rgba(160, 195, 255, 0.35) 0%, rgba(190, 215, 255, 0.10) 100%)' }}
          >
            <div className="p-5 pb-2">
              <div className="text-3xl font-bold text-gray-900">{children.length}</div>
              <div className="text-sm text-gray-600 mt-1">{children.length === 1 ? 'Kind' : 'Kinderen'}</div>
            </div>
            <img src="/icons/section-icons/kinderen.png" alt="" className="absolute bottom-0 right-0 w-20 h-20 opacity-80" />
          </div>

          <div
            className="overflow-hidden rounded-2xl shadow-sm relative border-2 border-white/70"
            style={{ background: 'linear-gradient(135deg, rgba(255, 185, 150, 0.35) 0%, rgba(255, 210, 185, 0.10) 100%)' }}
          >
            <div className="p-5 pb-2">
              <div className="text-3xl font-bold text-gray-900">{openRequests.length}</div>
              <div className="text-sm text-gray-600 mt-1">Open verzoeken</div>
            </div>
            <img src="/icons/section-icons/verzoeken.png" alt="" className="absolute bottom-0 right-0 w-20 h-20 opacity-80" />
          </div>

          <div
            className="overflow-hidden rounded-2xl shadow-sm col-span-2 md:col-span-1 border-2 border-white/70"
            style={{ background: 'linear-gradient(135deg, rgba(210, 195, 255, 0.30) 0%, rgba(225, 215, 255, 0.10) 100%)' }}
          >
            <div className="p-5">
              <div className="text-lg font-bold text-slate-700">{subscription?.plan || 'FREE'}</div>
              <div className="text-sm text-gray-600 mt-1">Huidig abonnement</div>
            </div>
          </div>
        </div>

        <div className="bg-white/25 backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-blue-900">
            <strong>Belangrijk:</strong> Alle gegevens in dit platform worden permanent opgeslagen en zijn exporteerbaar
            voor dossierbeheer. Niets kan definitief worden verwijderd.
          </p>
        </div>
      </div>
    </div>
  );
}