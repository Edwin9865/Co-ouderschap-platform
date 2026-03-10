import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, Edit2, X, Lock } from 'lucide-react';
import type { Event } from '../lib/types';

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

export function Agenda() {
  const { currentFamily, children, isParent, canAccessFeature } = useFamily();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const canAccessHistory = canAccessFeature('history');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [listFilter, setListFilter] = useState<'upcoming' | 'month'>('upcoming');

  const [formData, setFormData] = useState({
    type: 'other' as Event['type'],
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    child_id: '' as string,
    recurrence_rule: '' as string,
    recurrence_end_date: '',
    reminder_enabled: false,
    reminder_minutes: 15,
  });

  useEffect(() => {
    if (!currentFamily) return;
    fetchEvents();
  }, [currentFamily, selectedChild]);

  useEffect(() => {
    if (!currentFamily) return;
    const channel = supabase
      .channel(`agenda_events_${currentFamily.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `family_id=eq.${currentFamily.id}` }, () => fetchEvents())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentFamily]);

  const generateRecurringEvents = (baseEvent: Event, maxDate: Date): Event[] => {
    if (!baseEvent.recurrence_rule) return [baseEvent];

    const events: Event[] = [baseEvent];
    const startDate = new Date(baseEvent.start_at);
    const endDate = baseEvent.recurrence_end_date
      ? new Date(baseEvent.recurrence_end_date)
      : maxDate;

    let currentDate = new Date(startDate);
    let instanceCount = 0;
    const maxInstances = 100;

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

  const fetchEvents = async () => {
    if (!currentFamily) return;

    let query = supabase
      .from('events')
      .select('*')
      .eq('family_id', currentFamily.id)
      .is('parent_event_id', null)
      .order('start_at', { ascending: true });

    if (selectedChild !== 'all') {
      query = query.eq('child_id', selectedChild);
    }

    const { data } = await query;
    // Filter client-side by visible children
    const visibleChildIds = new Set(children.map(c => c.id));
    const rows = (data || []) as Event[];
    const visibleData = selectedChild === 'all'
      ? rows.filter(event => event.child_id === null || visibleChildIds.has(event.child_id))
      : rows;
    const filteredData = filterByPlan(visibleData);

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const allEvents = filteredData
      .flatMap(event => generateRecurringEvents(event, oneYearFromNow))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    setEvents(allEvents);
  };

  const filterByPlan = (data: Event[]) => {
    const canAccessHistory = canAccessFeature('history');
    if (canAccessHistory) return data;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return data.filter(event => new Date(event.start_at) >= thirtyDaysAgo);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;

    setLoading(true);
    try {
      await (supabase.from('events') as any).insert({
        family_id: currentFamily.id,
        child_id: formData.child_id || null,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        start_at: formData.start_at ? new Date(formData.start_at).toISOString() : formData.start_at,
        end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        location: formData.location || null,
        recurrence_rule: formData.recurrence_rule || null,
        recurrence_end_date: formData.recurrence_end_date || null,
        created_by: user.id,
        reminder_enabled: formData.reminder_enabled,
        reminder_minutes: formData.reminder_enabled ? formData.reminder_minutes : null,
      });

      let childName = 'Familie';
      if (formData.child_id) {
        const { data: childData } = await supabase
          .from('children')
          .select('first_name')
          .eq('id', formData.child_id)
          .maybeSingle();
        childName = childData?.first_name || 'Kind';
      }

      const startDate = new Date(formData.start_at).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-fcm-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              familyId: currentFamily.id,
              title: `Nieuwe afspraak: ${formData.title}`,
              body: `${childName} - ${startDate}`,
              url: '/agenda',
              excludeUserId: user.id,
            }),
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      await fetchEvents();
      setShowCreate(false);
      setFormData({
        type: 'other',
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
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !currentFamily) return;

    setLoading(true);
    try {
      await (supabase.from('events') as any)
        .update({
          child_id: formData.child_id || null,
          type: formData.type,
          title: formData.title,
          description: formData.description || null,
          start_at: formData.start_at ? new Date(formData.start_at).toISOString() : formData.start_at,
          end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
          location: formData.location || null,
          recurrence_rule: formData.recurrence_rule || null,
          recurrence_end_date: formData.recurrence_end_date || null,
          reminder_enabled: formData.reminder_enabled,
          reminder_minutes: formData.reminder_enabled ? formData.reminder_minutes : null,
        })
        .eq('id', editingEvent.id);

      await fetchEvents();
      setEditingEvent(null);
      setFormData({
        type: 'other',
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
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) return;

    setLoading(true);
    try {
      await supabase.from('events').delete().eq('id', editingEvent.id);
      await fetchEvents();
      setEditingEvent(null);
      setFormData({
        type: 'other',
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
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateForInput = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEditClick = (event: Event) => {
    if (typeof event.id === 'string' && event.id.includes('-recur-')) {
      alert('Je kunt alleen de originele afspraak bewerken, niet de individuele herhalingen.');
      return;
    }

    setEditingEvent(event);
    setFormData({
      type: event.type,
      title: event.title,
      description: event.description || '',
      start_at: formatDateTimeForInput(event.start_at),
      end_at: formatDateTimeForInput(event.end_at),
      location: event.location || '',
      child_id: event.child_id || '',
      recurrence_rule: event.recurrence_rule || '',
      recurrence_end_date: formatDateForInput(event.recurrence_end_date),
      reminder_enabled: event.reminder_enabled || false,
      reminder_minutes: event.reminder_minutes || 15,
    });
  };

  const getChildColor = (childId: string | null) => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child ? getColorStyles(child.color || '#3b82f6') : null;
  };

  const eventTypeLabels: Record<Event['type'], string> = {
    medical: 'Medisch',
    school: 'School',
    sport: 'Sport',
    handover: 'Overdracht',
    other: 'Anders',
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59);

    return events.filter(event => {
      const eventStart = new Date(event.start_at);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  const getEventsForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return events.filter(event => {
      const eventStart = new Date(event.start_at);
      return eventStart >= monthStart && eventStart <= monthEnd;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  const renderCalendarView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 bg-white/10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div
          key={day}
          className={`min-h-24 p-1.5 overflow-y-auto ${
            isToday ? 'bg-blue-50/60' : 'bg-white/20'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map(event => {
              const child = children.find(c => c.id === event.child_id);
              const colors = getChildColor(event.child_id);
              return (
                <div
                  key={event.id}
                  onClick={isParent ? () => handleEditClick(event) : undefined}
                  className={`text-xs p-1 rounded w-full transition-opacity ${isParent ? 'cursor-pointer hover:opacity-80' : ''}`}
                  style={colors ? {
                    backgroundColor: colors.backgroundColor,
                  } : { backgroundColor: 'rgba(241,245,249,0.8)' }}
                  title={`${event.title} - ${new Date(event.start_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                >
                  <div className="font-medium break-words leading-tight">{event.title}</div>
                  {child && <div className="break-words" style={colors ? { color: colors.color } : undefined}>{child.first_name}</div>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="-mx-4 sm:mx-0 sm:rounded-2xl border-y sm:border border-white/50 bg-white/25 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/40 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/40 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/30 rounded-xl overflow-hidden">
          {dayNames.map(day => (
            <div key={day} className="bg-white/40 p-2 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const now = new Date();
    const baseEvents = getEventsForMonth();
    const monthlyEvents = listFilter === 'upcoming'
      ? baseEvents.filter(e => new Date(e.start_at) >= now)
      : baseEvents;

    return (
      <>
        {viewMode === 'list' && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
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
            <div className="inline-flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setListFilter('upcoming')}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${listFilter === 'upcoming' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Komende
              </button>
              <button
                onClick={() => setListFilter('month')}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${listFilter === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Hele maand
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {monthlyEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Geen afspraken gevonden</div>
          ) : (
            monthlyEvents.map((event) => {
              const child = children.find(c => c.id === event.child_id);
              const colors = getChildColor(event.child_id);
              return (
                <div
                  key={event.id}
                  onClick={isParent ? () => handleEditClick(event) : undefined}
                  className={`bg-white rounded-lg border border-gray-200 p-6 ${isParent ? 'cursor-pointer hover:shadow-md' : ''} transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CalendarIcon className="w-5 h-5 text-slate-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          {eventTypeLabels[event.type]}
                        </span>
                        {child && colors && (
                          <span
                            className="px-3 py-1 text-xs rounded-full font-medium"
                            style={{
                              backgroundColor: colors.backgroundColor,
                              color: colors.color,
                            }}
                          >
                            {child.first_name}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-gray-600 mb-3">{event.description}</p>
                      )}
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>
                          <strong>Start:</strong>{' '}
                          {new Date(event.start_at).toLocaleString('nl-NL')}
                        </div>
                        {event.end_at && (
                          <div>
                            <strong>Eind:</strong>{' '}
                            {new Date(event.end_at).toLocaleString('nl-NL')}
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
                          </div>
                        )}
                      </div>
                    </div>
                    {isParent && <Edit2 className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agenda</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Beheer afspraken en overdrachten</p>
        </div>
        {isParent && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Afspraak toevoegen</span>
          </button>
        )}
      </div>

      {!canAccessHistory && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <p className="text-sm text-amber-900">
                Met het gratis plan zie je alleen de laatste 30 dagen. Upgrade naar PLUS of PRO voor
                volledige historie.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-4">
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Lijst
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Kalender
            </button>
          </div>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedChild('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedChild === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alles
          </button>
          {children.map((child) => {
            const isSelected = selectedChild === child.id;
            const color = child.color || '#3b82f6';
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors border-2 ${
                  isSelected
                    ? 'text-white'
                    : 'bg-white border-gray-300'
                }`}
                style={isSelected ? {
                  backgroundColor: color,
                  borderColor: color,
                } : {
                  color: color,
                }}
              >
                {child.first_name}
              </button>
            );
          })}
        </div>
      </div>

      {showCreate && isParent && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Afspraak toevoegen</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Event['type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kind</label>
                <select
                  value={formData.child_id || ''}
                  onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                >
                  <option value="">Kies een kind</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                rows={3}
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Starttijd</label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eindtijd (optioneel)
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locatie (optioneel)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                maxLength={200}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Herinnering</p>
                <p className="text-sm text-gray-600">Stuur een melding voor deze afspraak</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminder_enabled}
                  onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            {formData.reminder_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Herinnering sturen</label>
                <select
                  value={formData.reminder_minutes}
                  onChange={(e) => setFormData({ ...formData, reminder_minutes: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value={5}>5 minuten van te voren</option>
                  <option value={10}>10 minuten van te voren</option>
                  <option value={15}>15 minuten van te voren</option>
                  <option value={30}>30 minuten van te voren</option>
                  <option value={60}>1 uur van te voren</option>
                  <option value={120}>2 uur van te voren</option>
                  <option value={1440}>1 dag van te voren</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Herhaling (optioneel)
                </label>
                <select
                  value={formData.recurrence_rule}
                  onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Geen herhaling</option>
                  <option value="DAILY">Dagelijks</option>
                  <option value="WEEKLY">Wekelijks</option>
                  <option value="MONTHLY">Maandelijks</option>
                  <option value="YEARLY">Jaarlijks</option>
                </select>
              </div>
              {formData.recurrence_rule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Herhaling eindigt op
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              )}
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
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Afspraak bewerken</h2>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Event['type'] })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      {Object.entries(eventTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kind</label>
                    <select
                      value={formData.child_id || ''}
                      onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      required
                    >
                      <option value="">Kies een kind</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.first_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Starttijd</label>
                    <input
                      type="datetime-local"
                      value={formData.start_at}
                      onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eindtijd (optioneel)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_at}
                      onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locatie (optioneel)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    maxLength={200}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Herinnering</p>
                    <p className="text-sm text-gray-600">Stuur een melding voor deze afspraak</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reminder_enabled}
                      onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                {formData.reminder_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Herinnering sturen</label>
                    <select
                      value={formData.reminder_minutes}
                      onChange={(e) => setFormData({ ...formData, reminder_minutes: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value={5}>5 minuten van te voren</option>
                      <option value={10}>10 minuten van te voren</option>
                      <option value={15}>15 minuten van te voren</option>
                      <option value={30}>30 minuten van te voren</option>
                      <option value={60}>1 uur van te voren</option>
                      <option value={120}>2 uur van te voren</option>
                      <option value={1440}>1 dag van te voren</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Herhaling (optioneel)
                    </label>
                    <select
                      value={formData.recurrence_rule}
                      onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="">Geen herhaling</option>
                      <option value="DAILY">Dagelijks</option>
                      <option value="WEEKLY">Wekelijks</option>
                      <option value="MONTHLY">Maandelijks</option>
                      <option value="YEARLY">Jaarlijks</option>
                    </select>
                  </div>
                  {formData.recurrence_rule && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Herhaling eindigt op
                      </label>
                      <input
                        type="date"
                        value={formData.recurrence_end_date}
                        onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                  >
                    {loading ? 'Bezig...' : 'Opslaan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Verwijderen
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
    </div>
  );
}
