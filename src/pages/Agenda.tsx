import { useState, useEffect, useMemo, useRef } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Edit2, X, Lock, RefreshCw } from 'lucide-react';
import type { Event } from '../lib/types';

// A VirtualEvent is either a real DB event or a single expanded occurrence of a recurring series
type VirtualEvent = Event & {
  _occurrenceDate?: string; // ISO datetime of this specific occurrence (set for expanded recurring events)
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 139, g: 92, b: 246 };
};

const getColorStyles = (hexColor: string) => {
  const { r, g, b } = hexToRgb(hexColor);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    borderColor: hexColor,
    color: hexColor,
  };
};

const DEFAULT_EVENT_COLOR = '#64748b';

const recurrenceLabel = (rule: string) => {
  if (rule.includes('DAILY')) return 'dagelijks';
  if (rule.includes('INTERVAL=2') && rule.includes('WEEKLY')) return 'elke 2 weken';
  if (rule.includes('WEEKLY')) return 'wekelijks';
  if (rule.includes('MONTHLY')) return 'maandelijks';
  if (rule.includes('YEARLY')) return 'jaarlijks';
  return 'herhalend';
};

const formatDateTimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const addOneHour = (datetimeLocal: string): string => {
  const d = new Date(datetimeLocal);
  d.setHours(d.getHours() + 1);
  return formatDateTimeLocal(d.toISOString());
};

/** Expand a single recurring event into individual VirtualEvent occurrences. */
function expandRecurringEvent(event: VirtualEvent, until: Date): VirtualEvent[] {
  if (!event.recurrence_rule) return [event];

  const excluded: string[] = event.excluded_dates ?? [];
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : new Date(start.getTime() + 3_600_000);
  const duration = end.getTime() - start.getTime();

  let cap = until;
  if (event.recurrence_end_date) {
    const datePart = event.recurrence_end_date.split('T')[0];
    const recEnd = new Date(datePart);
    recEnd.setHours(23, 59, 59, 999);
    if (!isNaN(recEnd.getTime()) && recEnd < until) cap = recEnd;
  }

  const freq = event.recurrence_rule.match(/FREQ=(\w+)/)?.[1];
  if (!freq) return [event];
  const interval = parseInt(event.recurrence_rule.match(/INTERVAL=(\d+)/)?.[1] ?? '1', 10);

  const occurrences: VirtualEvent[] = [];
  let current = new Date(start);
  let safety = 0;

  while (current <= cap && safety++ < 500) {
    const dateKey = current.toISOString().split('T')[0];
    if (!excluded.includes(dateKey)) {
      occurrences.push({
        ...event,
        start_at: current.toISOString(),
        end_at: new Date(current.getTime() + duration).toISOString(),
        _occurrenceDate: current.toISOString(),
      });
    }
    const next = new Date(current);
    switch (freq) {
      case 'DAILY':   next.setDate(next.getDate() + interval); break;
      case 'WEEKLY':  next.setDate(next.getDate() + 7 * interval); break;
      case 'MONTHLY': next.setMonth(next.getMonth() + interval); break;
      case 'YEARLY':  next.setFullYear(next.getFullYear() + interval); break;
      default: return occurrences.length > 0 ? occurrences : [event];
    }
    current = next;
  }
  return occurrences.length > 0 ? occurrences : [event];
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = {
  type: 'other' as any,
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  location: '',
  child_id: '',
  recurrence_rule: '',
  recurrence_end_date: '',
  reminder_enabled: false,
  reminder_minutes: 15,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Agenda() {
  const { currentFamily, children, isParent, canAccessFeature } = useFamily();
  const { user } = useAuth();
  const canAccessHistory = canAccessFeature('history');

  const [events, setEvents] = useState<VirtualEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [listFilter, setListFilter] = useState<'upcoming' | 'month'>('upcoming');
  const [formData, setFormData] = useState(emptyForm);

  // Editing state
  const [editingEvent, setEditingEvent] = useState<VirtualEvent | null>(null);

  // Calendar hover card (desktop)
  const [hoveredEvent, setHoveredEvent] = useState<VirtualEvent | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Recurrence edit scope
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [recurrenceEditScope, setRecurrenceEditScope] = useState<'this' | 'all' | 'future' | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | null>(null);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<VirtualEvent | null>(null);

  const fetchEventsRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!currentFamily) return;
    fetchEvents();
  }, [currentFamily]);

  // Real-time subscription
  useEffect(() => {
    if (!currentFamily) return;
    const channel = supabase
      .channel(`agenda_events_${currentFamily.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `family_id=eq.${currentFamily.id}` }, () => fetchEventsRef.current())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentFamily]);

  // Fallback: refetch when tab/app becomes visible
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchEventsRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const fetchEvents = async () => {
    if (!currentFamily) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('family_id', currentFamily.id)
        .order('start_at', { ascending: true });
      if (error) throw error;
      setEvents((data ?? []) as VirtualEvent[]);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchEventsRef.current = fetchEvents;

  // Expand all recurring events into individual occurrences (2 years ahead)
  const expandedEvents = useMemo(() => {
    const until = new Date();
    until.setFullYear(until.getFullYear() + 2);
    const result: VirtualEvent[] = [];
    for (const ev of events) {
      if (ev.recurrence_rule) {
        result.push(...expandRecurringEvent(ev, until));
      } else {
        result.push(ev);
      }
    }
    return result;
  }, [events]);

  // ── Edit helpers ─────────────────────────────────────────────────────────

  const openEditForm = (event: VirtualEvent) => {
    setEditingEvent(event);
    setFormData({
      type: event.type as any,
      title: event.title,
      description: event.description ?? '',
      start_at: formatDateTimeLocal(event.start_at),
      end_at: event.end_at ? formatDateTimeLocal(event.end_at) : '',
      location: event.location ?? '',
      child_id: event.child_id ?? '',
      recurrence_rule: event.recurrence_rule ?? '',
      recurrence_end_date: event.recurrence_end_date ?? '',
      reminder_enabled: event.reminder_enabled,
      reminder_minutes: event.reminder_minutes ?? 15,
    });
    setShowCreate(true);
  };

  const handleEditEvent = (event: VirtualEvent) => {
    if (event.recurrence_rule) {
      // Ask which occurrences to modify before opening the form
      setEditingEvent(event);
      setEditingOccurrenceDate(event._occurrenceDate ?? event.start_at);
      setShowRecurrenceDialog(true);
    } else {
      openEditForm(event);
    }
  };

  const handleRecurrenceScopeSelect = (scope: 'this' | 'all' | 'future') => {
    setRecurrenceEditScope(scope);
    setShowRecurrenceDialog(false);
    if (editingEvent) openEditForm(editingEvent);
  };

  const handleCancelEdit = () => {
    setShowCreate(false);
    setEditingEvent(null);
    setRecurrenceEditScope(null);
    setEditingOccurrenceDate(null);
    setFormData(emptyForm);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;

    const eventData = {
      family_id: currentFamily.id,
      type: formData.type,
      title: formData.title,
      description: formData.description || null,
      start_at: new Date(formData.start_at).toISOString(),
      end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
      location: formData.location || null,
      child_id: formData.child_id || null,
      recurrence_rule: formData.recurrence_rule || null,
      recurrence_end_date: formData.recurrence_end_date || null,
      reminder_enabled: formData.reminder_enabled,
      reminder_minutes: formData.reminder_minutes,
      created_by: user.id,
    };

    const db = supabase as any;
    try {
      if (editingEvent) {
        if (editingEvent.recurrence_rule && editingOccurrenceDate && recurrenceEditScope) {
          await handleUpdateRecurring(db, eventData);
        } else {
          await db.from('events').update(eventData).eq('id', editingEvent.id);
        }
      } else {
        await db.from('events').insert([eventData]);
      }

      setShowCreate(false);
      setEditingEvent(null);
      setRecurrenceEditScope(null);
      setEditingOccurrenceDate(null);
      setFormData(emptyForm);
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleUpdateRecurring = async (db: any, eventData: any) => {
    if (!editingEvent || !editingOccurrenceDate) return;

    switch (recurrenceEditScope) {
      case 'all':
        await db.from('events').update(eventData).eq('id', editingEvent.id);
        break;

      case 'this': {
        const dateKey = editingOccurrenceDate.split('T')[0];
        const existing: string[] = editingEvent.excluded_dates ?? [];
        await db.from('events')
          .update({ excluded_dates: [...existing, dateKey] })
          .eq('id', editingEvent.id);
        await db.from('events').insert([{
          ...eventData,
          recurrence_rule: null,
          recurrence_end_date: null,
          parent_event_id: editingEvent.id,
        }]);
        break;
      }

      case 'future': {
        const dayBefore = new Date(editingOccurrenceDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        await db.from('events')
          .update({ recurrence_end_date: dayBefore.toISOString().split('T')[0] })
          .eq('id', editingEvent.id);
        await db.from('events').insert([{
          ...eventData,
          parent_event_id: editingEvent.id,
        }]);
        break;
      }
    }
  };

  const handleDeleteClick = (event: VirtualEvent) => {
    setDeletingEvent(event);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = async (scope: 'single' | 'this' | 'future' | 'all') => {
    if (!deletingEvent) return;
    setShowDeleteDialog(false);
    const db = supabase as any;
    try {
      switch (scope) {
        case 'single':
        case 'all':
          await db.from('events').delete().eq('id', deletingEvent.id);
          break;
        case 'this': {
          const dateKey = (deletingEvent._occurrenceDate ?? deletingEvent.start_at).split('T')[0];
          const existing: string[] = deletingEvent.excluded_dates ?? [];
          await db.from('events')
            .update({ excluded_dates: [...existing, dateKey] })
            .eq('id', deletingEvent.id);
          break;
        }
        case 'future': {
          const dayBefore = new Date(deletingEvent._occurrenceDate ?? deletingEvent.start_at);
          dayBefore.setDate(dayBefore.getDate() - 1);
          await db.from('events')
            .update({ recurrence_end_date: dayBefore.toISOString().split('T')[0] })
            .eq('id', deletingEvent.id);
          break;
        }
      }
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingEvent(null);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const getFilteredEvents = (): VirtualEvent[] => {
    let filtered = expandedEvents;

    if (selectedChild !== 'all') {
      filtered = filtered.filter(e => e.child_id === selectedChild);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (viewMode === 'list' && listFilter === 'upcoming') {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const d = new Date(e.start_at);
        return d >= now && d >= monthStart && d <= monthEnd;
      });
    } else if (viewMode === 'calendar' || (viewMode === 'list' && listFilter === 'month')) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const d = new Date(e.start_at);
        return d >= monthStart && d <= monthEnd;
      });
    }

    return filtered.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  };

  const getDaysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const getEventsForDay = (day: number) =>
    getFilteredEvents().filter(e => {
      const d = new Date(e.start_at);
      return (
        d.getDate() === day &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    });

  const isEventOwner = (event: VirtualEvent) => user?.id === event.created_by;

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!isParent && !canAccessHistory) {
    return (
      <div className="flex items-center justify-center h-96">
        <Lock className="w-8 h-8 text-gray-400 mr-2" />
        <p className="text-gray-500">Geen toegang tot de agenda</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agenda</h1>
        {isParent && (
          <button
            onClick={() => { setEditingEvent(null); setRecurrenceEditScope(null); setFormData(emptyForm); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            Nieuwe afspraak
          </button>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex gap-2">
        {[
          { mode: 'list' as const, label: 'Lijst', Icon: List },
          { mode: 'calendar' as const, label: 'Kalender', Icon: CalendarIcon },
        ].map(({ mode, label, Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${viewMode === mode ? 'bg-blue-500 text-white' : 'bg-white/40 text-gray-700 hover:bg-white/60'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Child filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedChild('all')}
          className={`px-3 py-1.5 rounded-lg text-sm ${selectedChild === 'all' ? 'bg-blue-500 text-white' : 'bg-white/40 text-gray-700 hover:bg-white/60'}`}
        >
          Alle kinderen
        </button>
        {children.map(child => {
          const active = selectedChild === child.id;
          const hex = child.color ?? DEFAULT_EVENT_COLOR;
          return (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity"
              style={active
                ? { backgroundColor: hex, color: '#fff', borderColor: hex }
                : { backgroundColor: `${hex}22`, color: hex, border: `1px solid ${hex}66` }
              }
            >
              {child.first_name}
            </button>
          );
        })}
      </div>

      {/* ── Recurrence scope dialog ── */}
      {showRecurrenceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-1">Herhalende afspraak wijzigen</h3>
            <p className="text-sm text-gray-500 mb-4">Welke afspraken wilt u aanpassen?</p>
            <div className="space-y-2">
              {([
                { scope: 'this' as const,   title: 'Alleen deze afspraak',              sub: 'Alleen de geselecteerde datum wordt gewijzigd' },
                { scope: 'all' as const,    title: 'Alle afspraken in deze reeks',      sub: 'Alle herhalingen worden gewijzigd' },
                { scope: 'future' as const, title: 'Deze en toekomstige afspraken',     sub: 'Vanaf deze datum wordt de reeks gesplitst' },
              ] as const).map(({ scope, title, sub }) => (
                <button
                  key={scope}
                  onClick={() => handleRecurrenceScopeSelect(scope)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-800">{title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowRecurrenceDialog(false); setEditingEvent(null); }}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      {showDeleteDialog && deletingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            {deletingEvent.recurrence_rule ? (
              <>
                <h3 className="text-lg font-bold mb-1">Herhalende afspraak verwijderen</h3>
                <p className="text-sm text-gray-500 mb-4">Welke afspraken wil je verwijderen?</p>
                <div className="space-y-2">
                  {([
                    { scope: 'this'   as const, title: 'Alleen deze afspraak',           sub: 'Alleen de geselecteerde datum wordt verwijderd' },
                    { scope: 'future' as const, title: 'Deze en toekomstige afspraken',   sub: 'Vanaf deze datum worden alle herhalingen verwijderd' },
                    { scope: 'all'    as const, title: 'Alle afspraken in deze reeks',    sub: 'De volledige reeks wordt verwijderd' },
                  ]).map(({ scope, title, sub }) => (
                    <button
                      key={scope}
                      onClick={() => handleDeleteConfirmed(scope)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold mb-1">Afspraak verwijderen</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Weet je zeker dat je <span className="font-medium text-gray-800">"{deletingEvent.title}"</span> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                </p>
                <button
                  onClick={() => handleDeleteConfirmed('single')}
                  className="w-full px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium mb-2"
                >
                  Verwijderen
                </button>
              </>
            )}
            <button
              onClick={handleDeleteCancel}
              className="mt-2 w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {editingEvent ? 'Afspraak bewerken' : 'Nieuwe afspraak'}
                </h2>
                {recurrenceEditScope && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {recurrenceEditScope === 'this' && 'Alleen deze datum'}
                    {recurrenceEditScope === 'all' && 'Alle herhalingen'}
                    {recurrenceEditScope === 'future' && 'Vanaf deze datum'}
                  </p>
                )}
              </div>
              <button onClick={handleCancelEdit} className="p-1 hover:bg-gray-200 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soort afspraak</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="school">School</option>
                  <option value="medical">Medisch</option>
                  <option value="birthday">Verjaardag</option>
                  <option value="sport">Sport</option>
                  <option value="handover">Overdracht</option>
                  <option value="other">Anders</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Omschrijving</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              {/* Start time — auto-fills end time on change */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Begintijd</label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={e => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      start_at: newStart,
                      end_at: newStart ? addOneHour(newStart) : prev.end_at,
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {/* End time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eindtijd</label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={e => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Child */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kind</label>
                <select
                  value={formData.child_id}
                  onChange={e => setFormData({ ...formData, child_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Geen specifiek kind</option>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.first_name}</option>
                  ))}
                </select>
              </div>

              {/* Recurrence — hidden for 'this only' edits */}
              {recurrenceEditScope !== 'this' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Herhaling</label>
                    <select
                      value={formData.recurrence_rule}
                      onChange={e => setFormData({ ...formData, recurrence_rule: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Geen herhaling</option>
                      <option value="FREQ=DAILY">Dagelijks</option>
                      <option value="FREQ=WEEKLY">Elke week</option>
                      <option value="FREQ=WEEKLY;INTERVAL=2">Elke 2 weken</option>
                      <option value="FREQ=MONTHLY">Elke maand</option>
                      <option value="FREQ=YEARLY">Jaarlijks</option>
                    </select>
                  </div>

                  {formData.recurrence_rule && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Einddatum herhaling</label>
                      <input
                        type="date"
                        value={formData.recurrence_end_date}
                        onChange={e => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Reminder */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminder_enabled}
                    onChange={e => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Herinnering inschakelen</span>
                </label>
              </div>

              {formData.reminder_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minuten van tevoren</label>
                  <input
                    type="number"
                    value={formData.reminder_minutes}
                    onChange={e => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min={1}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                {editingEvent ? 'Opslaan' : 'Aanmaken'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {[
              { f: 'upcoming' as const, label: 'Aankomend' },
              { f: 'month' as const,    label: 'Per maand' },
            ].map(({ f, label }) => (
              <button
                key={f}
                onClick={() => setListFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm ${listFilter === f ? 'bg-blue-500 text-white' : 'bg-white/40 text-gray-700 hover:bg-white/60'}`}
              >
                {label}
              </button>
            ))}
            {(listFilter === 'upcoming' || listFilter === 'month') && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-1.5 hover:bg-black/10 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium capitalize min-w-[120px] text-center">
                  {currentDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-1.5 hover:bg-black/10 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Laden…</p>
          ) : getFilteredEvents().length === 0 ? (
            <p className="text-gray-500 text-center py-8">Geen afspraken gevonden</p>
          ) : (
            getFilteredEvents().map((event, idx) => {
              const child = children.find(c => c.id === event.child_id);
              const color = child?.color ?? DEFAULT_EVENT_COLOR;
              return (
              <div
                key={`${event.id}-${idx}`}
                className="border-l-4 p-4 rounded-lg bg-white/40 backdrop-blur-sm"
                style={getColorStyles(color)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{event.type === 'birthday' ? '🎂 ' : ''}{event.title}</h3>
                      {event.recurrence_rule && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <RefreshCw className="w-3 h-3" />
                          {recurrenceLabel(event.recurrence_rule)}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                      <span>
                        {new Date(event.start_at).toLocaleString('nl-NL', {
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      {event.end_at && (
                        <span>
                          – {new Date(event.end_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {event.location && <span>📍 {event.location}</span>}
                      {event.child_id && (
                        <span>👤 {children.find(c => c.id === event.child_id)?.first_name}</span>
                      )}
                    </div>
                  </div>

                  {isParent && isEventOwner(event) && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-2 hover:bg-black/10 rounded text-gray-600"
                        title="Bewerken"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event)}
                        className="p-2 hover:bg-red-100 rounded text-red-500"
                        title="Verwijderen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Calendar view ── */}
      {viewMode === 'calendar' && (
        <div className="bg-white/40 backdrop-blur-sm sm:rounded-xl -mx-4 sm:mx-0 px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold capitalize">
              {currentDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-black/10 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm hover:bg-black/10 rounded"
              >
                Vandaag
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-black/10 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(d => (
              <div key={d} className="text-center text-[11px] sm:text-xs font-bold text-gray-500 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-md sm:rounded-lg p-0.5 sm:p-1 overflow-hidden flex flex-col ${
                    isToday ? 'bg-blue-100 border-blue-400' : 'bg-white/50 border-gray-200'
                  }`}
                >
                  <div className={`text-[10px] sm:text-xs font-bold mb-0.5 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-y-auto">
                    {dayEvents.map((event, idx) => {
                      const child = children.find(c => c.id === event.child_id);
                      const color = child?.color ?? DEFAULT_EVENT_COLOR;
                      return (
                        <div
                          key={`${event.id}-${idx}`}
                          className="text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded cursor-pointer truncate leading-tight"
                          style={getColorStyles(color)}
                          onClick={() => handleEditEvent(event)}
                          onMouseEnter={e => { setHoveredEvent(event); setHoverPos({ x: e.clientX, y: e.clientY }); }}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          {event.type === 'birthday' ? '🎂 ' : ''}{event.title}{child && <span className="opacity-70"> · {child.first_name}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Calendar hover card (desktop) ── */}
      {hoveredEvent && (() => {
        const hChild = children.find(c => c.id === hoveredEvent.child_id);
        const hColor = hChild?.color ?? DEFAULT_EVENT_COLOR;
        const typeLabels: Record<string, string> = {
          school: 'School', medical: 'Medisch', birthday: 'Verjaardag',
          sport: 'Sport', handover: 'Overdracht', other: 'Anders',
        };
        const left = Math.min(hoverPos.x + 14, window.innerWidth - 240);
        const top  = Math.min(hoverPos.y + 14, window.innerHeight - 180);
        return (
          <div
            className="fixed z-[200] w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 pointer-events-none text-sm"
            style={{ left, top, borderLeftWidth: 3, borderLeftColor: hColor }}
          >
            <p className="font-bold text-gray-900 leading-tight mb-1">{hoveredEvent.title}</p>
            <p className="text-xs text-gray-400 mb-2">{typeLabels[hoveredEvent.type] ?? hoveredEvent.type}{hChild ? ` · ${hChild.first_name}` : ''}</p>
            {hoveredEvent.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-3">{hoveredEvent.description}</p>
            )}
            <div className="text-xs text-gray-500 space-y-0.5">
              <div>
                <span className="font-medium">Van: </span>
                {new Date(hoveredEvent.start_at).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              {hoveredEvent.end_at && (
                <div>
                  <span className="font-medium">Tot: </span>
                  {new Date(hoveredEvent.end_at).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {hoveredEvent.location && (
                <div><span className="font-medium">📍 </span>{hoveredEvent.location}</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
