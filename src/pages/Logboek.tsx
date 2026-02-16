import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, History, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LogEntry, LogEntryRevision } from '../lib/types';
import { LogHistoryViewer } from '../components/LogHistoryViewer';

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

export function Logboek() {
  const { currentFamily, children, isParent, canAccessFeature } = useFamily();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewingHistory, setViewingHistory] = useState<LogEntry | null>(null);

  const [formData, setFormData] = useState({
    category: 'other' as LogEntry['category'],
    title: '',
    details: '',
    occurred_at: '',
    child_id: '' as string | null,
  });

  const canAccessHistory = canAccessFeature('history');

  const getChildColor = (childId: string | null) => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child ? getColorStyles(child.color || '#3b82f6') : null;
  };

  useEffect(() => {
    if (!currentFamily) return;
    fetchEntries();
  }, [currentFamily, selectedChild]);

  const fetchEntries = async () => {
    if (!currentFamily) return;

    let query = supabase
      .from('log_entries')
      .select('*')
      .eq('family_id', currentFamily.id)
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false });

    if (selectedChild !== 'all') {
      query = query.eq('child_id', selectedChild);
    }

    const { data } = await query;
    const filteredData = filterByPlan(data || []);
    setEntries(filteredData);
  };

  const filterByPlan = (data: LogEntry[]) => {
    if (canAccessHistory) return data;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return data.filter(entry => new Date(entry.occurred_at) >= thirtyDaysAgo);
  };


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;

    setLoading(true);
    try {
      await supabase.from('log_entries').insert({
        family_id: currentFamily.id,
        child_id: formData.child_id || null,
        category: formData.category,
        title: formData.title,
        details: formData.details || null,
        occurred_at: formData.occurred_at,
        created_by: user.id,
      });

      await fetchEntries();
      setShowCreate(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (entryId: string, originalData: LogEntry) => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase.from('log_entry_revisions').insert({
        log_entry_id: entryId,
        previous_data: originalData,
        edited_by: user.id,
      });

      await supabase
        .from('log_entries')
        .update({
          category: formData.category,
          title: formData.title,
          details: formData.details || null,
          occurred_at: formData.occurred_at,
          child_id: formData.child_id || null,
        })
        .eq('id', entryId);

      await fetchEntries();
      setEditingEntry(null);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (entryId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt archiveren?')) return;
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('log_entries')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', entryId);

      await fetchEntries();
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (entry: LogEntry) => {
    setEditingEntry(entry.id);
    setFormData({
      category: entry.category,
      title: entry.title,
      details: entry.details || '',
      occurred_at: entry.occurred_at.slice(0, 16),
      child_id: entry.child_id,
    });
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const resetForm = () => {
    setFormData({
      category: 'other',
      title: '',
      details: '',
      occurred_at: getCurrentDateTime(),
      child_id: '',
    });
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

  const getEntriesForMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    return entries.filter(entry => {
      const entryDate = new Date(entry.occurred_at);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });
  };

  const monthlyEntries = getEntriesForMonth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Logboek</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Registreer gebeurtenissen en ontwikkelingen</p>
        </div>
        {isParent && !showCreate && (
          <button
            onClick={() => {
              setShowCreate(true);
              resetForm();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Item toevoegen</span>
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

      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedChild('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
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

      {showCreate && isParent && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Logboekitem toevoegen</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as LogEntry['category'] })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
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
                  onChange={(e) => setFormData({ ...formData, child_id: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="">Geen specifiek kind</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                rows={4}
                maxLength={2000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Datum/tijd</label>
              <input
                type="datetime-local"
                value={formData.occurred_at}
                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
              />
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
                  setShowCreate(false);
                  resetForm();
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
        {monthlyEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Geen logboekitems in deze maand</div>
        ) : (
          monthlyEntries.map((entry) => {
            const child = entry.child_id ? children.find(c => c.id === entry.child_id) : null;
            const colors = getChildColor(entry.child_id);
            return (
              <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {editingEntry === entry.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate(entry.id, entry);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categorie
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value as LogEntry['category'],
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      >
                        {Object.entries(categoryLabels).map(([value, label]) => (
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
                        onChange={(e) => setFormData({ ...formData, child_id: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      >
                        <option value="">Geen specifiek kind</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.first_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum/tijd
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.occurred_at}
                      onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    <textarea
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                      Opslaan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                          {categoryLabels[entry.category]}
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
                      {entry.details && <p className="text-gray-600 mb-2">{entry.details}</p>}
                      <div className="text-sm text-gray-500">
                        {new Date(entry.occurred_at).toLocaleString('nl-NL')}
                      </div>
                    </div>
                    {isParent && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingHistory(entry)}
                          className="p-2 text-gray-600 hover:text-slate-700 hover:bg-gray-100 rounded-lg"
                          title="Geschiedenis bekijken"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-2 text-gray-600 hover:text-slate-700 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSoftDelete(entry.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              </div>
            );
          })
        )}
      </div>

      {viewingHistory && (
        <LogHistoryViewer
          entry={viewingHistory}
          onClose={() => setViewingHistory(null)}
        />
      )}
    </div>
  );
}
