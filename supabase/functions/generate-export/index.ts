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
    const { familyId, exportType, childId, startDate, endDate } = body;

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

    // CHILDREN
    let childrenQ = serviceSupabase
      .from('children')
      .select('*')
      .eq('family_id', familyId);

    if (exportType === 'child' && childId) {
      console.log('Applying child filter to children query:', childId);
      childrenQ = childrenQ.eq('id', childId);
    }

    childrenQ = childrenQ.order('first_name');
    const { data: children } = await childrenQ;
    const childrenToExport = children || [];
    console.log(`Fetched ${childrenToExport.length} children`);

    // EVENTS
    let eventsQ = serviceSupabase
      .from('events')
      .select('id, family_id, child_id, type, title, description, start_at, end_at, location, status, created_at, children(first_name, color)')
      .eq('family_id', familyId);

    if (exportType === 'child' && childId) {
      console.log('Applying child filter to events:', childId);
      eventsQ = eventsQ.eq('child_id', childId);
    }

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to events:', range.startIso, 'to', range.endIso);
      eventsQ = eventsQ.gte('start_at', range.startIso).lte('start_at', range.endIso);
    }

    eventsQ = eventsQ.order('start_at', { ascending: false });
    const { data: events } = await eventsQ;
    console.log(`Fetched ${events?.length || 0} events`);

    // LOG ENTRIES
    let logsQ = serviceSupabase
      .from('log_entries')
      .select('id, title, category, details, occurred_at, created_by, deleted_at, child_id, children(first_name, color)')
      .eq('family_id', familyId);

    if (exportType === 'child' && childId) {
      console.log('Applying child filter to log entries:', childId);
      logsQ = logsQ.eq('child_id', childId);
    }

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to log entries:', range.startIso, 'to', range.endIso);
      logsQ = logsQ.gte('occurred_at', range.startIso).lte('occurred_at', range.endIso);
    }

    logsQ = logsQ.order('occurred_at', { ascending: false });
    const { data: logEntries } = await logsQ;
    console.log(`Fetched ${logEntries?.length || 0} log entries`);

    const logEntriesWithUsers = await Promise.all(
      (logEntries || []).map(async (log) => {
        const { data: u } = await serviceSupabase
          .from('users')
          .select('name')
          .eq('id', log.created_by)
          .maybeSingle();
        return { ...log, user_name: u?.name || 'Onbekend' };
      })
    );

    // REQUESTS
    let requestsQ = serviceSupabase
      .from('requests')
      .select('id, title, type, description, status, created_at, created_by, child_id, children(first_name, color)')
      .eq('family_id', familyId);

    if (exportType === 'child' && childId) {
      console.log('Applying child filter to requests:', childId);
      requestsQ = requestsQ.eq('child_id', childId);
    }

    if (exportType === 'date_range' && range) {
      console.log('Applying date range to requests:', range.startIso, 'to', range.endIso);
      requestsQ = requestsQ.gte('created_at', range.startIso).lte('created_at', range.endIso);
    }

    requestsQ = requestsQ.order('created_at', { ascending: false });
    const { data: requests } = await requestsQ;
    console.log(`Fetched ${requests?.length || 0} requests`);

    const requestsWithUsers = await Promise.all(
      (requests || []).map(async (r) => {
        const { data: u } = await serviceSupabase
          .from('users')
          .select('name')
          .eq('id', r.created_by)
          .maybeSingle();
        return { ...r, user_name: u?.name || 'Onbekend' };
      })
    );

    // QUESTIONS
    let questions: any[] = [];
    let questionsErr: any = null;

    {
      let q1 = serviceSupabase
        .from('questions')
        .select('id, title, question_text, status, created_at, helper_id, child_id')
        .eq('family_id', familyId);

      if (exportType === 'child' && childId) {
        console.log('Applying child filter to questions:', childId);
        q1 = q1.eq('child_id', childId);
      }

      if (exportType === 'date_range' && range) {
        console.log('Applying date range to questions:', range.startIso, 'to', range.endIso);
        q1 = q1.gte('created_at', range.startIso).lte('created_at', range.endIso);
      }

      q1 = q1.order('created_at', { ascending: false });
      const res1 = await q1;
      questions = res1.data || [];
      questionsErr = res1.error;

      if (questionsErr) {
        const msg = String(questionsErr.message || '').toLowerCase();
        if (msg.includes('child_id')) {
          console.log('Questions table does not have child_id, retrying without filter');
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
        }
      }

      if (questionsErr) {
        console.error('Questions fetch error:', questionsErr);
      }
      console.log(`Fetched ${questions.length} questions`);
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

    const html = generateHTML({
      family,
      children: childrenToExport,
      events: events || [],
      logEntries: logEntriesWithUsers || [],
      requests: requestsWithUsers || [],
      questions: questionsWithDetails || [],
      auditLogs: auditLogs || [],
      exportType,
      exportDate: new Date().toLocaleDateString('nl-NL'),
    });

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
  const { family, children, events, logEntries, requests, questions, auditLogs, exportType, exportDate } = data;

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
                <strong>Export datum:</strong> ${exportDate} |
                <strong>Type:</strong> ${exportType === 'full' ? 'Volledig dossier' : exportType === 'child' ? 'Per kind' : 'Datumbereik'}
            </div>
        </div>

        ${children && children.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Kinderen (${children.length})</h2>
            ${children.map((child: any) => `
                <div class="card">
                    <div class="card-title">
                        <span class="child-tag" style="background: ${child.color}22; color: ${child.color};">
                            ${child.first_name}
                        </span>
                    </div>
                    <div class="card-content">
                        ${child.birth_year ? `<strong>Geboortejaar:</strong> ${child.birth_year}` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${events && events.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Agenda (${events.length} afspraken)</h2>
            ${events.slice(0, 50).map((event: any) => `
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
            ${logEntries.slice(0, 50).map((log: any) => `
                <div class="card">
                    <div class="card-title">${log.title}</div>
                    <div class="card-meta">
                        <span class="badge badge-green">${categoryLabels[log.category] || log.category}</span>
                        ${log.children ? `<span class="child-tag" style="background: ${log.children.color}22; color: ${log.children.color};">${log.children.first_name}</span>` : ''}
                        <br>
                        <strong>Datum:</strong> ${new Date(log.occurred_at).toLocaleString('nl-NL')} |
                        <strong>Door:</strong> ${log.user_name || 'Onbekend'}
                        ${log.deleted_at ? ' | <span style="color: #dc2626;">VERWIJDERD</span>' : ''}
                    </div>
                    ${log.details ? `<div class="card-content">${log.details}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${requests && requests.length > 0 ? `
        <div class="section page-break">
            <h2 class="section-title">Verzoeken (${requests.length})</h2>
            ${requests.slice(0, 50).map((request: any) => `
                <div class="card">
                    <div class="card-title">${request.title}</div>
                    <div class="card-meta">
                        <span class="badge ${request.status === 'ACCEPTED' ? 'badge-green' : request.status === 'DECLINED' ? 'badge-red' : request.status === 'OPEN' ? 'badge-yellow' : 'badge-gray'}">
                            ${statusLabels[request.status] || request.status}
                        </span>
                        <span class="badge badge-blue">${requestTypeLabels[request.type] || request.type}</span>
                        ${request.children ? `<span class="child-tag" style="background: ${request.children.color}22; color: ${request.children.color};">${request.children.first_name}</span>` : ''}
                        <br>
                        <strong>Aangemaakt:</strong> ${new Date(request.created_at).toLocaleString('nl-NL')} |
                        <strong>Door:</strong> ${request.user_name || 'Onbekend'}
                    </div>
                    ${request.description ? `<div class="card-content">${request.description}</div>` : ''}
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
