import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, apikey',
};

interface ExportRequest {
  familyId: string;
  exportType: 'full' | 'child' | 'date_range';
  childId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  includeEvents?: boolean; // default true
  forPdf?: boolean;   // true = PDF-renderer-safe HTML (no fixed positioning, no @media print, no JS)
}

type DateRange = {
  startIso: string; // inclusive
  endIso: string;   // inclusive
  startYmd: string;
  endYmd: string;
};

function parseDateRange(startDate?: string, endDate?: string): DateRange | null {
  if (!startDate || !endDate) return null;

  // Interpret input dates as full-day inclusive range.
  // NOTE: We use UTC to avoid device timezone drifting.
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start.getTime() > end.getTime()) return null;

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startYmd: startDate,
    endYmd: endDate,
  };
}

function jsonError(status: number, error: string, details?: string) {
  return new Response(JSON.stringify({ error, ...(details ? { details } : {}) }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('========== EXPORT FUNCTION DEBUG ==========');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);

    const authHeader = req.headers.get('Authorization');
    const apikeyHeader = req.headers.get('apikey');
    const contentType = req.headers.get('Content-Type');

    console.log('Headers received:');
    console.log('- Authorization:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'MISSING');
    console.log('- apikey:', apikeyHeader ? `${apikeyHeader.substring(0, 20)}...` : 'MISSING');
    console.log('- Content-Type:', contentType);

    if (!authHeader) {
      console.error('❌ No authorization header');
      return jsonError(401, 'Geen authenticatie header gevonden');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Calling getUser with service role client...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error('❌ User authentication error:', {
        message: userError.message,
        status: userError.status,
        name: userError.name,
      });
      return jsonError(
        401,
        'Authenticatie mislukt',
        userError?.message || 'Geen gebruiker gevonden'
      );
    }

    if (!user) {
      console.error('❌ No user returned from getUser');
      return jsonError(401, 'Geen gebruiker gevonden');
    }

    console.log('✅ User authenticated successfully:', user.id);

    const body: ExportRequest = await req.json();
    const { familyId, exportType, childId, startDate, endDate, includeEvents = true, forPdf = false } = body;

    console.log('Export request:', { familyId, exportType, childId, startDate, endDate, userId: user.id });

    if (!familyId) return jsonError(400, 'familyId is verplicht');
    if (!exportType) return jsonError(400, 'exportType is verplicht');

    if (exportType === 'child' && !childId) {
      return jsonError(400, 'childId is verplicht bij exportType=child');
    }

    const range: DateRange | null = exportType === 'date_range'
      ? parseDateRange(startDate, endDate)
      : null;

    if (exportType === 'date_range' && !range) {
      return jsonError(400, 'Ongeldig datumbereik (startDate/endDate)');
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: familyMember, error: familyError } = await serviceSupabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (familyError) {
      console.error('Family member check error:', familyError);
      return jsonError(500, 'Fout bij controleren van familielid', familyError.message);
    }

    if (!familyMember) {
      console.error('User is not a member of family:', { userId: user.id, familyId });
      return jsonError(403, 'Je hebt geen toegang tot deze familie');
    }

    console.log('User has access to family');

    const { data: family, error: famError } = await serviceSupabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .maybeSingle();

    if (famError) {
      console.error('Family fetch error:', famError);
    }

    console.log('Fetching data with filters:', { exportType, childId, range: range ? `${range.startYmd} to ${range.endYmd}` : null });

    // CHILDREN - Only children user has/had access to via visibility history
    const { data: accessibleChildren, error: childAccessError } = await serviceSupabase
      .rpc('get_accessible_children_for_export', {
        check_user_id: user.id,
        check_family_id: familyId
      });

    if (childAccessError) {
      console.error('Error fetching accessible children:', childAccessError);
      return jsonError(500, 'Fout bij ophalen van kinderen', childAccessError.message);
    }

    let childrenToExport = accessibleChildren || [];

    // Apply child filter if specified
    if (exportType === 'child' && childId) {
      console.log('Applying child filter to accessible children:', childId);
      childrenToExport = childrenToExport.filter((c: any) => c.child_id === childId);
    }

    console.log(`Fetched ${childrenToExport.length} accessible children (including historical)`);

    // Get child IDs and their visibility periods for filtering
    const childIdsWithPeriods = new Map();
    for (const child of childrenToExport) {
      const { data: periods } = await serviceSupabase
        .rpc('get_visibility_periods', {
          check_child_id: child.child_id,
          check_user_id: user.id
        });
      childIdsWithPeriods.set(child.child_id, periods || []);
    }

    const childIds = Array.from(childIdsWithPeriods.keys());
    console.log(`Child IDs with access:`, childIds);

    // EVENTS - Filter by visibility periods
    let eventsQ = serviceSupabase
      .from('events')
      .select('id, family_id, child_id, type, title, description, start_at, end_at, location, status, created_at')
      .eq('family_id', familyId)
      .in('child_id', childIds);

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to events:', range.startIso, 'to', range.endIso);
      eventsQ = eventsQ.gte('start_at', range.startIso).lte('start_at', range.endIso);
    }

    eventsQ = eventsQ.order('start_at', { ascending: false });
    const { data: allEvents } = await eventsQ;

    // Filter events by visibility periods
    const events = (allEvents || []).filter((event: any) => {
      if (!event.child_id) return false;

      const periods = childIdsWithPeriods.get(event.child_id) || [];
      // If no periods exist, this is an own child (no visibility restrictions) — always include
      if (periods.length === 0) return true;
      return periods.some((period: any) => {
        const eventTime = new Date(event.created_at).getTime();
        const grantedTime = new Date(period.granted_at).getTime();
        const revokedTime = period.revoked_at ? new Date(period.revoked_at).getTime() : Infinity;

        return eventTime >= grantedTime && eventTime <= revokedTime;
      });
    });

    // Add child info back
    const eventsWithChildren = await Promise.all(
      events.map(async (event: any) => {
        const child = childrenToExport.find((c: any) => c.child_id === event.child_id);
        const displayName = child?.deleted_at ? `Verwijderd kind (${child.first_name})` : child?.first_name;
        return {
          ...event,
          children: child ? { first_name: displayName, color: child.color } : null
        };
      })
    );

    console.log(`Fetched ${eventsWithChildren.length} events (filtered by visibility periods)`);

    // LOG ENTRIES - Filter by visibility periods (CRITICAL BUG FIX)
    let logsQ = serviceSupabase
      .from('log_entries')
      .select('id, title, category, details, occurred_at, created_by, created_at, updated_at, deleted_at, child_id')
      .eq('family_id', familyId)
      .in('child_id', childIds);

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to log entries:', range.startIso, 'to', range.endIso);
      logsQ = logsQ.gte('occurred_at', range.startIso).lte('occurred_at', range.endIso);
    }

    logsQ = logsQ.order('occurred_at', { ascending: false });
    const { data: allLogEntries } = await logsQ;

    // CRITICAL: Filter log entries by visibility periods
    // Only show logs created DURING the period when user had access to the child
    const logEntries = (allLogEntries || []).filter((log: any) => {
      if (!log.child_id) return false;

      const periods = childIdsWithPeriods.get(log.child_id) || [];
      // If no periods exist, this is an own child (no visibility restrictions) — always include
      if (periods.length === 0) return true;
      return periods.some((period: any) => {
        const logTime = new Date(log.created_at).getTime();
        const grantedTime = new Date(period.granted_at).getTime();
        const revokedTime = period.revoked_at ? new Date(period.revoked_at).getTime() : Infinity;

        // Log must be created within the visibility period
        return logTime >= grantedTime && logTime <= revokedTime;
      });
    });

    console.log(`Fetched ${logEntries?.length || 0} log entries (filtered by visibility periods, removed ${(allLogEntries?.length || 0) - logEntries.length} entries outside access period)`);

    const logEntriesWithUsers = await Promise.all(
      (logEntries || []).map(async (log) => {
        const child = childrenToExport.find((c: any) => c.child_id === log.child_id);

        const { data: u } = await serviceSupabase
          .from('users')
          .select('name')
          .eq('id', log.created_by)
          .maybeSingle();

        const { data: revisions } = await serviceSupabase
          .from('log_entry_revisions')
          .select('id, previous_data, edited_by, edited_at')
          .eq('log_entry_id', log.id)
          .order('edited_at', { ascending: false });

        const revisionsWithUsers = await Promise.all(
          (revisions || []).map(async (rev) => {
            const { data: editor } = await serviceSupabase
              .from('users')
              .select('name')
              .eq('id', rev.edited_by)
              .maybeSingle();
            return { ...rev, editor_name: editor?.name || 'Onbekend' };
          })
        );

        const logChildName = child?.deleted_at ? `Verwijderd kind (${child.first_name})` : child?.first_name;
        return {
          ...log,
          user_name: u?.name || 'Onbekend',
          revisions: revisionsWithUsers,
          children: child ? { first_name: logChildName, color: child.color } : null
        };
      })
    );

    // REQUESTS - Fetch ALL requests for this family (requests are co-parent communications
    // and should always appear in the dossier regardless of child visibility periods)
    let requestsQ = serviceSupabase
      .from('requests')
      .select('id, title, type, description, status, counter_proposal, decline_reason, last_action_by, created_at, updated_at, created_by, child_id')
      .eq('family_id', familyId);

    if (exportType === 'child' && childId) {
      requestsQ = requestsQ.eq('child_id', childId);
    }

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to requests:', range.startIso, 'to', range.endIso);
      requestsQ = requestsQ.gte('created_at', range.startIso).lte('created_at', range.endIso);
    }

    requestsQ = requestsQ.order('created_at', { ascending: false });
    const { data: allRequests, error: requestsError } = await requestsQ;

    if (requestsError) {
      console.error('Requests fetch error:', requestsError);
    }

    const requests = allRequests || [];
    console.log(`Fetched ${requests.length} requests (all statuses, no visibility period filter)`);

    const requestsWithUsers = await Promise.all(
      (requests || []).map(async (r) => {
        const child = childrenToExport.find((c: any) => c.child_id === r.child_id);

        const [{ data: creator }, { data: lastActor }, { data: proposals }] = await Promise.all([
          serviceSupabase.from('users').select('name').eq('id', r.created_by).maybeSingle(),
          r.last_action_by
            ? serviceSupabase.from('users').select('name').eq('id', r.last_action_by).maybeSingle()
            : Promise.resolve({ data: null }),
          serviceSupabase
            .from('request_proposals')
            .select('id, proposal_text, proposed_by, created_at')
            .eq('request_id', r.id)
            .order('created_at', { ascending: true }),
        ]);

        const proposalsWithUsers = await Promise.all(
          (proposals || []).map(async (p: any) => {
            const { data: proposer } = await serviceSupabase
              .from('users').select('name').eq('id', p.proposed_by).maybeSingle();
            return { ...p, proposer_name: proposer?.name || 'Onbekend' };
          })
        );

        const reqChildName = child?.deleted_at ? `Verwijderd kind (${child.first_name})` : child?.first_name;
        return {
          ...r,
          user_name: creator?.name || 'Onbekend',
          last_action_by_name: lastActor?.name || null,
          proposals: proposalsWithUsers,
          children: child ? { first_name: reqChildName, color: child.color } : null
        };
      })
    );

    // QUESTIONS - Filter by visibility periods if child_id exists
    let questions: any[] = [];
    let questionsErr: any = null;

    {
      let q1 = serviceSupabase
        .from('questions')
        .select('id, title, question_text, status, created_at, helper_id, child_id')
        .eq('family_id', familyId);

      if (childIds.length > 0) {
        q1 = q1.in('child_id', childIds);
      }

      if (exportType === 'date_range' && range) {
        console.log('Applying date range to questions:', range.startIso, 'to', range.endIso);
        q1 = q1.gte('created_at', range.startIso).lte('created_at', range.endIso);
      }

      q1 = q1.order('created_at', { ascending: false });
      const res1 = await q1;
      const allQuestions = res1.data || [];
      questionsErr = res1.error;

      if (questionsErr) {
        const msg = String(questionsErr.message || '').toLowerCase();
        if (msg.includes('child_id')) {
          console.log('Questions table does not have child_id, fetching all family questions');
          let q2 = serviceSupabase
            .from('questions')
            .select('id, title, question_text, status, created_at, helper_id')
            .eq('family_id', familyId);

          if (exportType === 'date_range' && range) {
            q2 = q2.gte('created_at', range.startIso).lte('created_at', range.endIso);
          }

          q2 = q2.order('created_at', { ascending: false });
          const res2 = await q2;
          questions = res2.data || [];
          questionsErr = res2.error;
        } else {
          // Filter questions by visibility periods if child_id exists
          questions = allQuestions.filter((question: any) => {
            if (!question.child_id) return true; // Include questions without child_id

            const periods = childIdsWithPeriods.get(question.child_id) || [];
            return periods.some((period: any) => {
              const questionTime = new Date(question.created_at).getTime();
              const grantedTime = new Date(period.granted_at).getTime();
              const revokedTime = period.revoked_at ? new Date(period.revoked_at).getTime() : Infinity;

              return questionTime >= grantedTime && questionTime <= revokedTime;
            });
          });
        }
      } else {
        // Filter questions by visibility periods if child_id exists
        questions = allQuestions.filter((question: any) => {
          if (!question.child_id) return true; // Include questions without child_id

          const periods = childIdsWithPeriods.get(question.child_id) || [];
          return periods.some((period: any) => {
            const questionTime = new Date(question.created_at).getTime();
            const grantedTime = new Date(period.granted_at).getTime();
            const revokedTime = period.revoked_at ? new Date(period.revoked_at).getTime() : Infinity;

            return questionTime >= grantedTime && questionTime <= revokedTime;
          });
        });
      }

      if (questionsErr) {
        console.error('Questions fetch error:', questionsErr);
      }
      console.log(`Fetched ${questions.length} questions (filtered by visibility periods)`);
    }

    const questionsWithDetails = await Promise.all(
      (questions || []).map(async (question: any) => {
        const { data: helper } = await serviceSupabase
          .from('users')
          .select('name')
          .eq('id', question.helper_id)
          .maybeSingle();

        let answersQ = serviceSupabase
          .from('answers')
          .select('id, answer_text, created_at, parent_id')
          .eq('question_id', question.id);

        if (exportType === 'date_range' && range) {
          answersQ = answersQ.gte('created_at', range.startIso).lte('created_at', range.endIso);
        }

        answersQ = answersQ.order('created_at');
        const { data: answers } = await answersQ;

        const answersWithUsers = await Promise.all(
          (answers || []).map(async (answer) => {
            const { data: parent } = await serviceSupabase
              .from('users')
              .select('name')
              .eq('id', answer.parent_id)
              .maybeSingle();
            return { ...answer, parent_name: parent?.name || 'Onbekend' };
          })
        );

        return {
          ...question,
          helper_name: helper?.name || 'Onbekend',
          answers: answersWithUsers,
        };
      })
    );

    // AUDIT LOGS
    let auditQ = serviceSupabase
      .from('audit_logs')
      .select('*')
      .eq('family_id', familyId);

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to audit logs:', range.startIso, 'to', range.endIso);
      auditQ = auditQ.gte('created_at', range.startIso).lte('created_at', range.endIso);
    }

    auditQ = auditQ.order('created_at', { ascending: false }).limit(100);
    const { data: auditLogs } = await auditQ;
    console.log(`Fetched ${auditLogs?.length || 0} audit logs`);

    console.log('Generating HTML...');

    const htmlData = {
      family,
      children: childrenToExport,
      childVisibilityPeriods: Object.fromEntries(childIdsWithPeriods),
      events: eventsWithChildren || [],
      logEntries: logEntriesWithUsers || [],
      requests: requestsWithUsers || [],
      questions: questionsWithDetails || [],
      auditLogs: auditLogs || [],
      exportType,
      includeEvents,
      exportDate: new Date().toLocaleDateString('nl-NL'),
      userEmail: user.email || 'Onbekend',
    };

    const html = forPdf ? generatePdfHTML(htmlData) : generateHTML(htmlData);

    console.log('Export successful, HTML length:', html.length);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Onbekende fout bij exporteren',
        stack: error?.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateHTML(data: any): string {
  const { family, children, childVisibilityPeriods, events, logEntries, requests, questions, auditLogs, exportType, includeEvents, exportDate, userEmail } = data;

  const categoryLabels: Record<string, string> = {
    health: 'Gezondheid',
    behavior: 'Gedrag',
    development: 'Ontwikkeling',
    incident: 'Incident',
    achievement: 'Prestatie',
    communication: 'Communicatie',
    other: 'Overig',
  };

  const eventTypeLabels: Record<string, string> = {
    medical: 'Medisch',
    school: 'School',
    sport: 'Sport',
    handover: 'Overdracht',
    other: 'Overig',
  };

  const requestTypeLabels: Record<string, string> = {
    schedule_change: 'Roosterwijziging',
    financial: 'Financiël',
    medical_decision: 'Medische beslissing',
    education: 'Onderwijs',
    vacation: 'Vakantie',
    other: 'Overig',
  };

  const statusLabels: Record<string, string> = {
    OPEN: 'Open',
    ACCEPTED: 'Geaccepteerd',
    DECLINED: 'Afgewezen',
    COUNTERED: 'Tegenbod',
    CLOSED: 'Gesloten',
    ANSWERED: 'Beantwoord',
  };

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Co-Parenting Export - ${family?.name || 'Familie'}</title>
    <style>
        @media print {
            @page {
                margin: 2cm;
                size: A4;
            }
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .page-break {
                page-break-before: always;
            }
            .no-print {
                display: none;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        .header {
            border-bottom: 3px solid #1e293b;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 32px;
            color: #1e293b;
            margin-bottom: 10px;
        }

        .header .meta {
            color: #64748b;
            font-size: 14px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 24px;
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }

        .card-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
        }

        .card-meta {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 12px;
        }

        .card-content {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-right: 8px;
        }

        .badge-blue {
            background: #dbeafe;
            color: #1e40af;
        }

        .badge-green {
            background: #d1fae5;
            color: #065f46;
        }

        .badge-yellow {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-red {
            background: #fee2e2;
            color: #991b1b;
        }

        .badge-gray {
            background: #f1f5f9;
            color: #475569;
        }

        .child-tag {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            margin-right: 6px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }

        th, td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
        }

        th {
            background: #f1f5f9;
            font-weight: 600;
            color: #1e293b;
        }

        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
        }

        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #1e293b;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .print-button:hover {
            background: #334155;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Afdrukken naar PDF</button>

    <div class="container">
        <div class="header">
            <h1>Co-Parenting Dossier Export</h1>
            <div class="meta">
                <strong>Familie:</strong> ${family?.name || 'Onbekend'} |
                <strong>Export voor:</strong> ${userEmail} |
                <strong>Export datum:</strong> ${exportDate} |
                <strong>Type:</strong> ${exportType === 'full' ? 'Volledig dossier' : exportType === 'child' ? 'Per kind' : 'Datumbereik'}
            </div>
            <div class="meta" style="margin-top: 8px; padding: 8px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                ℹ️ Deze export bevat alleen gegevens uit de periode waarin u toegang had tot de betreffende kinderen.
                Gegevens die na het ontkoppelen zijn toegevoegd, worden niet getoond.
            </div>
        </div>

        ${children && children.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Kinderen (${children.length})</h2>
            ${children.map((child: any) => {
              const periods: any[] = (childVisibilityPeriods || {})[child.child_id] || [];
              const periodsHtml = periods.length > 0
                ? periods.map((p: any, i: number) => `
                    <div style="margin-top:4px; padding:6px 10px; background:#f0f9ff; border-left:3px solid ${p.revoked_at ? '#f59e0b' : '#16a34a'}; border-radius:3px; font-size:13px;">
                      <strong>Periode ${i + 1}:</strong>
                      Toegang verleend ${new Date(p.granted_at).toLocaleDateString('nl-NL')}
                      ${p.revoked_at
                        ? ` → ingetrokken ${new Date(p.revoked_at).toLocaleDateString('nl-NL')}${p.revoke_reason ? ` (${p.revoke_reason})` : ''}`
                        : ' → <span style="color:#16a34a;font-weight:600;">Actief</span>'}
                    </div>`).join('')
                : `<div style="margin-top:4px;font-size:13px;color:#16a34a;">Eigen kind (altijd toegang)</div>`;
              return `
                <div class="card">
                    <div class="card-title">
                        <span class="child-tag" style="background: ${child.color}22; color: ${child.color};">
                            ${child.first_name}
                        </span>
                    </div>
                    <div class="card-content">
                        ${child.birth_year ? `<strong>Geboortejaar:</strong> ${child.birth_year}<br>` : ''}
                        <strong>Toegangsperioden:</strong>
                        ${periodsHtml}
                        ${child.deleted_at ? `<br><span style="color:#dc2626;">Kind verwijderd op: ${new Date(child.deleted_at).toLocaleDateString('nl-NL')}</span>` : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>
        ` : ''}

        ${includeEvents !== false && events && events.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Agenda (${events.length} afspraken)</h2>
            ${events.map((event: any) => `
                <div class="card">
                    <div class="card-title">${event.title}</div>
                    <div class="card-meta">
                        <span class="badge badge-blue">${eventTypeLabels[event.type] || event.type}</span>
                        ${event.children ? `<span class="child-tag" style="background: ${event.children.color}22; color: ${event.children.color};">${event.children.first_name}</span>` : ''}
                        <br>
                        <strong>Start:</strong> ${new Date(event.start_at).toLocaleString('nl-NL')} |
                        <strong>Status:</strong> ${event.status}
                    </div>
                    ${event.description ? `<div class="card-content">${event.description}</div>` : ''}
                    ${event.location ? `<div class="card-content"><strong>Locatie:</strong> ${event.location}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${logEntries && logEntries.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Logboek (${logEntries.length} items)</h2>
            ${logEntries.map((log: any) => `
                <div class="card">
                    <div class="card-title">${log.title}</div>
                    <div class="card-meta">
                        <span class="badge badge-green">${categoryLabels[log.category] || log.category}</span>
                        ${log.children ? `<span class="child-tag" style="background: ${log.children.color}22; color: ${log.children.color};">${log.children.first_name}</span>` : ''}
                        <br>
                        <strong>Aangemaakt:</strong> ${new Date(log.created_at).toLocaleString('nl-NL')} door ${log.user_name || 'Onbekend'}<br>
                        <strong>Gebeurtenis datum:</strong> ${new Date(log.occurred_at).toLocaleString('nl-NL')}
                        ${log.updated_at !== log.created_at ? ` | <strong>Laatst bewerkt:</strong> ${new Date(log.updated_at).toLocaleString('nl-NL')}` : ''}
                        ${log.deleted_at ? ' | <span style="color: #dc2626;">VERWIJDERD</span>' : ''}
                    </div>
                    ${log.details ? `<div class="card-content">${log.details}</div>` : ''}

                    ${log.revisions && log.revisions.length > 0 ? `
                        <div class="card-content" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
                            <strong style="color: #1e293b;">Bewerkingsgeschiedenis (${log.revisions.length} versie(s))</strong>
                            <div style="margin-top: 8px;">
                                ${log.revisions.map((rev: any) => {
                                  const prevData = rev.previous_data || {};
                                  return `
                                    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 8px; border-radius: 4px;">
                                        <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                                            <strong>Versie opgeslagen op:</strong> ${new Date(rev.edited_at).toLocaleString('nl-NL')} door ${rev.editor_name}
                                        </div>
                                        <div style="padding: 8px; background: white; border-radius: 4px; font-size: 12px;">
                                            <p><strong>Titel (voor bewerking):</strong> ${prevData.title || 'N/A'}</p>
                                            ${prevData.details ? `<p style="margin-top:4px;"><strong>Details (voor bewerking):</strong> ${prevData.details}</p>` : ''}
                                            <p style="margin-top:4px;"><strong>Categorie:</strong> ${categoryLabels[prevData.category] || prevData.category || 'N/A'}</p>
                                            ${prevData.occurred_at ? `<p style="margin-top:4px;"><strong>Datum gebeurtenis:</strong> ${new Date(prevData.occurred_at).toLocaleString('nl-NL')}</p>` : ''}
                                        </div>
                                    </div>
                                  `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${requests && requests.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Verzoeken (${requests.length})</h2>
            ${requests.map((request: any) => `
                <div class="card">
                    <div class="card-title">${request.title}</div>
                    <div class="card-meta">
                        <span class="badge ${request.status === 'ACCEPTED' ? 'badge-green' : request.status === 'DECLINED' ? 'badge-red' : request.status === 'COUNTERED' ? 'badge-yellow' : request.status === 'OPEN' ? 'badge-yellow' : 'badge-gray'}">
                            ${statusLabels[request.status] || request.status}
                        </span>
                        <span class="badge badge-blue">${requestTypeLabels[request.type] || request.type}</span>
                        ${request.children ? `<span class="child-tag" style="background: ${request.children.color}22; color: ${request.children.color};">${request.children.first_name}</span>` : ''}
                        <br>
                        <strong>Aangemaakt:</strong> ${new Date(request.created_at).toLocaleString('nl-NL')} door ${request.user_name || 'Onbekend'}
                        ${request.updated_at && request.updated_at !== request.created_at ? ` | <strong>Bijgewerkt:</strong> ${new Date(request.updated_at).toLocaleString('nl-NL')}` : ''}
                        ${request.last_action_by_name ? ` | <strong>Laatste actie door:</strong> ${request.last_action_by_name}` : ''}
                    </div>
                    ${request.description ? `<div class="card-content"><strong>Omschrijving:</strong><br>${request.description}</div>` : ''}
                    ${request.decline_reason ? `
                        <div class="card-content" style="margin-top:10px; padding:10px; background:#fee2e2; border-left:4px solid #dc2626; border-radius:4px;">
                            <strong style="color:#991b1b;">Reden afwijzing:</strong><br>${request.decline_reason}
                        </div>` : ''}
                    ${request.counter_proposal ? `
                        <div class="card-content" style="margin-top:10px; padding:10px; background:#fef3c7; border-left:4px solid #f59e0b; border-radius:4px;">
                            <strong style="color:#92400e;">Tegenbod:</strong><br>${request.counter_proposal}
                        </div>` : ''}
                    ${request.proposals && request.proposals.length > 0 ? `
                        <div class="card-content" style="margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0;">
                            <strong>Voorstelgeschiedenis (${request.proposals.length}):</strong>
                            ${request.proposals.map((p: any) => `
                                <div style="margin-top:8px; padding:10px; background:#f0f9ff; border-left:4px solid #3b82f6; border-radius:4px;">
                                    <div style="font-size:12px; color:#64748b; margin-bottom:4px;">
                                        ${p.proposer_name} — ${new Date(p.created_at).toLocaleString('nl-NL')}
                                    </div>
                                    <div style="font-size:14px;">${p.proposal_text}</div>
                                </div>`).join('')}
                        </div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${questions && questions.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Vragen aan hulpverleners (${questions.length})</h2>
            ${questions.map((question: any) => `
                <div class="card">
                    <div class="card-title">${question.title}</div>
                    <div class="card-meta">
                        <span class="badge ${question.status === 'ANSWERED' ? 'badge-green' : question.status === 'OPEN' ? 'badge-yellow' : 'badge-gray'}">
                            ${statusLabels[question.status] || question.status}
                        </span>
                        <br>
                        <strong>Hulpverlener:</strong> ${question.helper_name || 'Onbekend'} |
                        <strong>Datum:</strong> ${new Date(question.created_at).toLocaleString('nl-NL')}
                    </div>
                    <div class="card-content">
                        <strong>Vraag:</strong><br>${question.question_text}
                    </div>
                    ${question.answers && question.answers.length > 0 ? `
                        <div class="card-content" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                            <strong>Antwoorden:</strong>
                            ${question.answers.map((answer: any) => `
                                <div style="margin-top: 8px; padding: 8px; background: white; border-radius: 4px;">
                                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                                        ${answer.parent_name || 'Onbekend'} - ${new Date(answer.created_at).toLocaleString('nl-NL')}
                                    </div>
                                    ${answer.answer_text}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${auditLogs && auditLogs.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Audit Trail (laatste 100 wijzigingen)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Actie</th>
                        <th>Type</th>
                        <th>Entity ID</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditLogs.map((log: any) => `
                        <tr>
                            <td>${new Date(log.created_at).toLocaleString('nl-NL')}</td>
                            <td><span class="badge badge-gray">${log.action}</span></td>
                            <td>${log.entity_type}</td>
                            <td style="font-family: monospace; font-size: 11px;">${log.entity_id.substring(0, 8)}...</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>Co-Parenting App</strong> | Geëxporteerd op ${exportDate}</p>
            <p style="margin-top: 8px;">Dit document bevat vertrouwelijke informatie en is bedoeld voor juridisch gebruik.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// PDF-renderer-safe HTML: zelfde data als generateHTML maar zonder position:fixed,
// zonder @media print CSS en zonder JavaScript — compatibel met @capgo/capacitor-pdf-generator WebView.
function generatePdfHTML(data: any): string {
  const { family, children, childVisibilityPeriods, events, logEntries, requests, questions, auditLogs, exportType, includeEvents, exportDate, userEmail } = data;

  const categoryLabels: Record<string, string> = {
    health: 'Gezondheid', behavior: 'Gedrag', development: 'Ontwikkeling',
    incident: 'Incident', achievement: 'Prestatie', communication: 'Communicatie', other: 'Overig',
  };
  const eventTypeLabels: Record<string, string> = {
    medical: 'Medisch', school: 'School', sport: 'Sport', handover: 'Overdracht', other: 'Overig',
  };
  const requestTypeLabels: Record<string, string> = {
    schedule_change: 'Roosterwijziging', financial: 'Financieel', medical_decision: 'Medische beslissing',
    education: 'Onderwijs', vacation: 'Vakantie', other: 'Overig',
  };
  const statusLabels: Record<string, string> = {
    OPEN: 'Open', ACCEPTED: 'Geaccepteerd', DECLINED: 'Afgewezen',
    COUNTERED: 'Tegenbod', CLOSED: 'Gesloten', ANSWERED: 'Beantwoord',
  };

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Co-Parenting Export - ${family?.name || 'Familie'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1f2937; background: #fff; padding: 16px; }
    h1 { font-size: 22px; color: #1e293b; margin-bottom: 6px; }
    h2 { font-size: 17px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 24px 0 12px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .info-bar { margin-top: 8px; padding: 8px; background: #f0f9ff; border-left: 4px solid #3b82f6; font-size: 12px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .card-title { font-size: 15px; font-weight: bold; color: #1e293b; margin-bottom: 6px; }
    .card-meta { font-size: 12px; color: #64748b; margin-bottom: 8px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; margin-right: 6px; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-gray { background: #f1f5f9; color: #475569; }
    .period { margin-top: 4px; padding: 5px 8px; border-radius: 3px; font-size: 12px; }
    .period-active { background: #f0fdf4; border-left: 3px solid #16a34a; }
    .period-revoked { background: #fffbeb; border-left: 3px solid #f59e0b; }
    .decline-box { margin-top: 8px; padding: 8px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 3px; font-size: 13px; }
    .counter-box { margin-top: 8px; padding: 8px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 3px; font-size: 13px; }
    .proposal-item { margin-top: 6px; padding: 8px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 3px; }
    .revision-item { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 10px; margin-bottom: 6px; border-radius: 3px; }
    .sub-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    th { background: #f1f5f9; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Co-Parenting Dossier Export</h1>
  <div class="meta"><strong>Familie:</strong> ${family?.name || 'Onbekend'} | <strong>Export voor:</strong> ${userEmail} | <strong>Datum:</strong> ${exportDate} | <strong>Type:</strong> ${exportType === 'full' ? 'Volledig dossier' : exportType === 'child' ? 'Per kind' : 'Datumbereik'}</div>
  <div class="info-bar">Deze export bevat alleen gegevens uit de periode(n) waarin u toegang had tot de betreffende kinderen.</div>

  ${children && children.length > 0 ? `
  <h2>Kinderen (${children.length})</h2>
  ${children.map((child: any) => {
    const periods: any[] = (childVisibilityPeriods || {})[child.child_id] || [];
    const periodsHtml = periods.length > 0
      ? periods.map((p: any, i: number) => `
          <div class="period ${p.revoked_at ? 'period-revoked' : 'period-active'}">
            <strong>Periode ${i + 1}:</strong> Toegang verleend ${new Date(p.granted_at).toLocaleDateString('nl-NL')}
            ${p.revoked_at ? ` → ingetrokken ${new Date(p.revoked_at).toLocaleDateString('nl-NL')}${p.revoke_reason ? ` (${p.revoke_reason})` : ''}` : ' → <strong style="color:#16a34a;">Actief</strong>'}
          </div>`).join('')
      : `<div class="period period-active">Eigen kind (altijd toegang)</div>`;
    return `
    <div class="card">
      <div class="card-title">${child.first_name}</div>
      <div>
        ${child.birth_year ? `<strong>Geboortejaar:</strong> ${child.birth_year}<br>` : ''}
        <strong>Toegangsperioden:</strong>
        ${periodsHtml}
        ${child.deleted_at ? `<br><span style="color:#dc2626;">Kind verwijderd op: ${new Date(child.deleted_at).toLocaleDateString('nl-NL')}</span>` : ''}
      </div>
    </div>`;
  }).join('')}` : ''}

  ${includeEvents !== false && events && events.length > 0 ? `
  <h2>Agenda (${events.length} afspraken)</h2>
  ${events.map((event: any) => `
  <div class="card">
    <div class="card-title">${event.title}</div>
    <div class="card-meta">
      <span class="badge badge-blue">${eventTypeLabels[event.type] || event.type}</span>
      ${event.children ? `<strong>${event.children.first_name}</strong>` : ''}
      &nbsp;|&nbsp;<strong>Start:</strong> ${new Date(event.start_at).toLocaleString('nl-NL')}
      &nbsp;|&nbsp;<strong>Status:</strong> ${event.status}
    </div>
    ${event.description ? `<div>${event.description}</div>` : ''}
    ${event.location ? `<div><strong>Locatie:</strong> ${event.location}</div>` : ''}
  </div>`).join('')}` : ''}

  ${logEntries && logEntries.length > 0 ? `
  <h2>Logboek (${logEntries.length} items)</h2>
  ${logEntries.map((log: any) => `
  <div class="card">
    <div class="card-title">${log.title}</div>
    <div class="card-meta">
      <span class="badge badge-green">${categoryLabels[log.category] || log.category}</span>
      ${log.children ? `<strong>${log.children.first_name}</strong>` : ''}
      <br><strong>Aangemaakt:</strong> ${new Date(log.created_at).toLocaleString('nl-NL')} door ${log.user_name || 'Onbekend'}
      <br><strong>Gebeurtenis datum:</strong> ${new Date(log.occurred_at).toLocaleString('nl-NL')}
      ${log.deleted_at ? ' | <span style="color:#dc2626;">VERWIJDERD</span>' : ''}
    </div>
    ${log.details ? `<div>${log.details}</div>` : ''}
    ${log.revisions && log.revisions.length > 0 ? `
    <div class="sub-section">
      <strong>Bewerkingsgeschiedenis (${log.revisions.length} versie(s)):</strong>
      ${log.revisions.map((rev: any) => {
        const p = rev.previous_data || {};
        return `<div class="revision-item" style="margin-top:8px;">
          <div style="font-size:11px;color:#64748b;margin-bottom:4px;"><strong>Versie:</strong> ${new Date(rev.edited_at).toLocaleString('nl-NL')} door ${rev.editor_name}</div>
          <div><strong>Titel (voor bewerking):</strong> ${p.title || 'N/A'}</div>
          ${p.details ? `<div><strong>Details:</strong> ${p.details}</div>` : ''}
          <div><strong>Categorie:</strong> ${categoryLabels[p.category] || p.category || 'N/A'}</div>
          ${p.occurred_at ? `<div><strong>Datum:</strong> ${new Date(p.occurred_at).toLocaleString('nl-NL')}</div>` : ''}
        </div>`;
      }).join('')}
    </div>` : ''}
  </div>`).join('')}` : ''}

  ${requests && requests.length > 0 ? `
  <h2>Verzoeken (${requests.length})</h2>
  ${requests.map((r: any) => `
  <div class="card">
    <div class="card-title">${r.title}</div>
    <div class="card-meta">
      <span class="badge ${r.status === 'ACCEPTED' ? 'badge-green' : r.status === 'DECLINED' ? 'badge-red' : r.status === 'OPEN' ? 'badge-yellow' : 'badge-gray'}">${statusLabels[r.status] || r.status}</span>
      <span class="badge badge-blue">${requestTypeLabels[r.type] || r.type}</span>
      ${r.children ? `<strong>${r.children.first_name}</strong>` : ''}
      <br><strong>Aangemaakt:</strong> ${new Date(r.created_at).toLocaleString('nl-NL')} door ${r.user_name || 'Onbekend'}
      ${r.last_action_by_name ? `<br><strong>Laatste actie door:</strong> ${r.last_action_by_name}` : ''}
    </div>
    ${r.description ? `<div><strong>Omschrijving:</strong><br>${r.description}</div>` : ''}
    ${r.decline_reason ? `<div class="decline-box"><strong>Reden afwijzing:</strong><br>${r.decline_reason}</div>` : ''}
    ${r.counter_proposal ? `<div class="counter-box"><strong>Tegenbod:</strong><br>${r.counter_proposal}</div>` : ''}
    ${r.proposals && r.proposals.length > 0 ? `
    <div class="sub-section">
      <strong>Voorstelgeschiedenis (${r.proposals.length}):</strong>
      ${r.proposals.map((p: any) => `
      <div class="proposal-item">
        <div style="font-size:11px;color:#64748b;">${p.proposer_name} — ${new Date(p.created_at).toLocaleString('nl-NL')}</div>
        <div>${p.proposal_text}</div>
      </div>`).join('')}
    </div>` : ''}
  </div>`).join('')}` : ''}

  ${questions && questions.length > 0 ? `
  <h2>Vragen aan hulpverleners (${questions.length})</h2>
  ${questions.map((q: any) => `
  <div class="card">
    <div class="card-title">${q.title}</div>
    <div class="card-meta">
      <span class="badge ${q.status === 'ANSWERED' ? 'badge-green' : 'badge-yellow'}">${statusLabels[q.status] || q.status}</span>
      <strong>Hulpverlener:</strong> ${q.helper_name || 'Onbekend'} | <strong>Datum:</strong> ${new Date(q.created_at).toLocaleString('nl-NL')}
    </div>
    <div><strong>Vraag:</strong><br>${q.question_text}</div>
    ${q.answers && q.answers.length > 0 ? `
    <div class="sub-section">
      <strong>Antwoorden:</strong>
      ${q.answers.map((a: any) => `
      <div style="margin-top:6px;padding:6px;background:#fff;border-radius:4px;">
        <div style="font-size:11px;color:#64748b;">${a.parent_name || 'Onbekend'} - ${new Date(a.created_at).toLocaleString('nl-NL')}</div>
        <div>${a.answer_text}</div>
      </div>`).join('')}
    </div>` : ''}
  </div>`).join('')}` : ''}

  ${auditLogs && auditLogs.length > 0 ? `
  <h2>Audit Trail (laatste 100 wijzigingen)</h2>
  <table>
    <thead><tr><th>Datum</th><th>Actie</th><th>Type</th><th>Entity ID</th></tr></thead>
    <tbody>
      ${auditLogs.map((log: any) => `
      <tr>
        <td>${new Date(log.created_at).toLocaleString('nl-NL')}</td>
        <td>${log.action}</td>
        <td>${log.entity_type}</td>
        <td style="font-family:monospace;font-size:10px;">${log.entity_id.substring(0, 8)}...</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''}

  <div class="footer">
    <p><strong>Co-Parenting App</strong> | Geëxporteerd op ${exportDate}</p>
    <p style="margin-top:4px;">Dit document bevat vertrouwelijke informatie en is bedoeld voor juridisch gebruik.</p>
  </div>
</body>
</html>`.trim();
}
