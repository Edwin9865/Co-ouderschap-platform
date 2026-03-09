import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Plus, Edit2, Trash2, Lock, Eye, EyeOff,
  ArrowLeft, Info, Check, X, ChevronRight,
} from 'lucide-react';
import type { Child, User } from '../lib/types';

interface ChildVisibility {
  child_id: string;
  user_id: string;
  user?: User;
}

type InfoFieldKey =
  | 'clothing_size' | 'shoe_size'
  | 'insurance' | 'meds_allergy' | 'vaccinations'
  | 'social_security_num' | 'passport_num' | 'passport_location' | 'other_info';

interface InfoField {
  key: InfoFieldKey;
  label: string;
  info?: string;
}

const INFO_GROUPS: InfoField[][] = [
  [
    { key: 'clothing_size', label: 'Kledingmaat' },
    { key: 'shoe_size', label: 'Schoenmaat' },
  ],
  [
    { key: 'insurance', label: 'Verzekering' },
    { key: 'meds_allergy', label: 'Medicijnen / allergie' },
    { key: 'vaccinations', label: 'Vaccinaties', info: 'Noteer vaccinatiedata en herinneringen' },
  ],
  [
    { key: 'social_security_num', label: 'BSN' },
    { key: 'passport_num', label: 'Paspoortnummer' },
    { key: 'passport_location', label: 'Waar is het paspoort?', info: 'Bijv. lade bureau ouder 1' },
    { key: 'other_info', label: 'Overige' },
  ],
];

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function Children() {
  const { currentFamily, children, refreshFamily, isParent, isHelper, canAccessFeature, members } = useFamily();
  const { user } = useAuth();

  // List / create / edit state
  const [showCreate, setShowCreate] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [shareWithCoParents, setShareWithCoParents] = useState(true);
  const [childVisibilities, setChildVisibilities] = useState<Record<string, ChildVisibility[]>>({});
  const [showVisibilityModal, setShowVisibilityModal] = useState<string | null>(null);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  // Detail view state
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'info' | 'accounts'>('info');
  const [editingField, setEditingField] = useState<InfoFieldKey | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [fieldSaving, setFieldSaving] = useState(false);
  const [accountsValue, setAccountsValue] = useState('');
  const [accountsSaving, setAccountsSaving] = useState(false);

  const coParents = members.filter((m) => m.user_id !== user?.id && m.role === 'PARENT');
  const helpers = members.filter((m) => m.role === 'HELPER');
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  useEffect(() => {
    fetchChildVisibilities();
    fetchCreatorNames();
  }, [children]);

  useEffect(() => {
    if (!currentFamily) return;
    const channel = supabase
      .channel(`children_${currentFamily.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children', filter: `family_id=eq.${currentFamily.id}` }, () => refreshFamily())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentFamily]);

  // Sync accounts textarea when switching child or tab
  useEffect(() => {
    if (selectedChild) {
      setAccountsValue(selectedChild.accounts_notes ?? '');
      setEditingField(null);
    }
  }, [selectedChildId]);

  const fetchCreatorNames = async () => {
    if (children.length === 0) return;
    const ids = [...new Set(children.map((c) => c.created_by).filter(Boolean))];
    if (ids.length === 0) return;
    const { data } = await supabase.from('users').select('id, name').in('id', ids);
    if (data) setCreatorNames(data.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as Record<string, string>));
  };

  const fetchChildVisibilities = async () => {
    if (children.length === 0) { setChildVisibilities({}); return; }
    const { data, error } = await supabase
      .from('child_visibility')
      .select('child_id, user_id')
      .in('child_id', children.map((c) => c.id));
    if (error || !data?.length) { setChildVisibilities({}); return; }
    const userIds = [...new Set(data.map((v) => v.user_id))];
    const { data: userData } = await supabase.from('users').select('*').in('id', userIds);
    const userMap = new Map(userData?.map((u) => [u.id, u]) ?? []);
    const enriched = data.map((v) => ({ ...v, user: userMap.get(v.user_id) }));
    setChildVisibilities(
      enriched.reduce((acc, cv) => {
        if (!acc[cv.child_id]) acc[cv.child_id] = [];
        acc[cv.child_id].push(cv as ChildVisibility);
        return acc;
      }, {} as Record<string, ChildVisibility[]>)
    );
  };

  const isChildCreator = (child: Child) => child.created_by === user?.id;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;
    if (children.length >= 1 && !canAccessFeature('multiple_children')) { setShowPaywall(true); return; }
    setLoading(true);
    try {
      const { data: newChild, error } = await supabase
        .from('children')
        .insert({ family_id: currentFamily.id, first_name: firstName, birth_year: birthYear ? parseInt(birthYear) : null, color, created_by: user.id })
        .select().single();
      if (error) throw error;
      if (shareWithCoParents && newChild && coParents.length > 0) {
        await supabase.from('child_visibility').insert(coParents.map((p) => ({ child_id: newChild.id, user_id: p.user_id, granted_by: user.id })));
      }
      await refreshFamily();
      setFirstName(''); setBirthYear(''); setColor(COLORS[0]); setShareWithCoParents(true); setShowCreate(false);
      await fetchChildVisibilities();
    } finally { setLoading(false); }
  };

  const handleUpdate = async (childId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('children')
        .update({ first_name: firstName, birth_year: birthYear ? parseInt(birthYear) : null, color })
        .eq('id', childId);
      if (error) { alert('Fout bij opslaan: Alleen de aanmaker kan dit kind bewerken.'); return; }
      await refreshFamily();
      setEditingChild(null); setFirstName(''); setBirthYear(''); setColor(COLORS[0]);
    } finally { setLoading(false); }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Weet je zeker dat je dit kind wilt verwijderen?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('children').delete().eq('id', childId);
      if (error) { alert('Fout bij verwijderen: Alleen de aanmaker kan dit kind verwijderen.'); return; }
      if (selectedChildId === childId) setSelectedChildId(null);
      await refreshFamily();
    } finally { setLoading(false); }
  };

  const toggleVisibility = async (childId: string, userId: string) => {
    if (!user) return;
    const child = children.find((c) => c.id === childId);
    if (child && !isChildCreator(child)) { alert('Alleen de aanmaker kan de zichtbaarheid beheren.'); return; }
    const has = (childVisibilities[childId] ?? []).some((cv) => cv.user_id === userId);
    if (has) {
      await supabase.from('child_visibility').delete().eq('child_id', childId).eq('user_id', userId);
    } else {
      await supabase.from('child_visibility').insert({ child_id: childId, user_id: userId, granted_by: user.id });
    }
    await fetchChildVisibilities();
  };

  const startEdit = (child: Child) => {
    if (!isChildCreator(child)) { alert('Alleen de aanmaker kan dit kind bewerken.'); return; }
    setEditingChild(child.id);
    setFirstName(child.first_name);
    setBirthYear(child.birth_year?.toString() ?? '');
    setColor(child.color ?? COLORS[0]);
  };

  const handleSaveField = async (key: InfoFieldKey) => {
    if (!selectedChildId) return;
    setFieldSaving(true);
    try {
      const { error } = await supabase.from('children')
        .update({ [key]: fieldValue.trim() || null })
        .eq('id', selectedChildId);
      if (error) throw error;
      await refreshFamily();
    } catch (e) { console.error('Error saving field:', e); }
    finally { setFieldSaving(false); setEditingField(null); }
  };

  const handleSaveAccounts = async () => {
    if (!selectedChildId) return;
    setAccountsSaving(true);
    try {
      const { error } = await supabase.from('children')
        .update({ accounts_notes: accountsValue.trim() || null })
        .eq('id', selectedChildId);
      if (error) throw error;
      await refreshFamily();
    } catch (e) { console.error('Error saving accounts:', e); }
    finally { setAccountsSaving(false); }
  };

  const getVisibleNames = (childId: string) => {
    if (coParents.length === 0 && helpers.length === 0) return 'Alleen jij';
    const child = children.find((c) => c.id === childId);
    if (!child) return 'Alleen jij';
    const ids = new Set<string>();
    if (child.created_by && child.created_by !== user?.id) ids.add(child.created_by);
    (childVisibilities[childId] ?? []).forEach((cv) => { if (cv.user_id !== user?.id) ids.add(cv.user_id); });
    if (ids.size === 0) return 'Alleen jij';
    const names = [
      ...coParents.filter((cp) => ids.has(cp.user_id)).map((cp) => cp.user.name),
      ...helpers.filter((h) => ids.has(h.user_id)).map((h) => h.user.name),
    ];
    return `Jij, ${names.join(', ')}`;
  };

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (selectedChild) {
    const canEdit = isChildCreator(selectedChild) && isParent && !isHelper;

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button
          onClick={() => { setSelectedChildId(null); setEditingChild(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar overzicht
        </button>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200">
            {([
              { id: 'images', label: 'Afbeeldingen' },
              { id: 'info', label: 'Kind info' },
              { id: 'accounts', label: 'Accounts' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setEditingField(null); }}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-500 border-b-2 border-red-500 -mb-px'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── KIND INFO TAB ───────────────────────────────────── */}
          {activeTab === 'info' && (
            <div className="p-5">
              {/* Child header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  style={{ backgroundColor: selectedChild.color ?? COLORS[0] }}
                >
                  {selectedChild.first_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedChild.first_name}</h2>
                  {selectedChild.birth_year && (
                    <p className="text-sm text-gray-400">Geboortejaar {selectedChild.birth_year}</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => startEdit(selectedChild)}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    title="Naam / geboortejaar bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="h-px bg-gray-100 mb-1" />

              {/* Field groups */}
              {INFO_GROUPS.map((group, gi) => (
                <div key={gi}>
                  {gi > 0 && <div className="h-px bg-gray-100 my-1" />}
                  {group.map((field) => {
                    const value = selectedChild[field.key];
                    const isEditing = editingField === field.key;

                    return (
                      <div key={field.key} className="flex items-center py-3 min-h-[48px]">
                        <span className="text-gray-500 flex-1 text-sm">{field.label}</span>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={fieldValue}
                              onChange={(e) => setFieldValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveField(field.key);
                                if (e.key === 'Escape') setEditingField(null);
                              }}
                              autoFocus
                              className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <button
                              onClick={() => handleSaveField(field.key)}
                              disabled={fieldSaving}
                              className="text-green-600 hover:text-green-700 p-1"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => canEdit ? (setEditingField(field.key), setFieldValue(value ?? '')) : undefined}
                              disabled={!canEdit}
                              className={`text-sm font-medium ${
                                value ? 'text-gray-800' : 'text-gray-400'
                              } ${canEdit ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'}`}
                            >
                              {value || 'Toevoegen'}
                            </button>
                            {field.info && (
                              <button title={field.info} className="text-gray-400 hover:text-gray-500 ml-0.5">
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── AFBEELDINGEN TAB ────────────────────────────────── */}
          {activeTab === 'images' && (
            <div className="p-10 text-center">
              <p className="text-gray-400 text-sm">Afbeeldingen uploaden komt binnenkort beschikbaar.</p>
            </div>
          )}

          {/* ── ACCOUNTS TAB ────────────────────────────────────── */}
          {activeTab === 'accounts' && (
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-400">
                Noteer accounts zoals schoolportaal, kinderopvang-app, zorgverzekering, etc.
              </p>
              <textarea
                value={accountsValue}
                onChange={(e) => setAccountsValue(e.target.value)}
                disabled={!canEdit}
                rows={8}
                placeholder={'Bijv.\nSchoolportaal: gebruiker@school.nl\nZorgverzekering: polisnummer 12345678\nKinderopvang app: 06-12345678'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {canEdit && (
                <button
                  onClick={handleSaveAccounts}
                  disabled={accountsSaving}
                  className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  {accountsSaving ? 'Opslaan...' : 'Opslaan'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Edit form for name / birth year / color */}
        {editingChild === selectedChild.id && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Basisgegevens bewerken</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(selectedChild.id); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam</label>
                <input
                  type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  required maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geboortejaar (optioneel)</label>
                <input
                  type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                  min="1990" max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kleur</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50">
                  {loading ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button type="button" onClick={() => setEditingChild(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Visibility + delete */}
        {isParent && !isHelper && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            {(coParents.length > 0 || helpers.length > 0) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Zichtbaarheid</h4>
                <button
                  onClick={() => setShowVisibilityModal(selectedChild.id)}
                  disabled={!isChildCreator(selectedChild)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  {getVisibleNames(selectedChild.id)}
                </button>
                {!isChildCreator(selectedChild) && (
                  <p className="text-xs text-gray-400 mt-1">Alleen de aanmaker kan delen beheren</p>
                )}
              </div>
            )}
            {isChildCreator(selectedChild) && (
              <div className={coParents.length > 0 || helpers.length > 0 ? 'border-t pt-4' : ''}>
                <button
                  onClick={() => handleDelete(selectedChild.id)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Kind verwijderen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Visibility modal */}
        {showVisibilityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wie kan dit kind zien?</h3>
              {(() => {
                const modalChild = children.find((c) => c.id === showVisibilityModal);
                const canManage = !!modalChild && isChildCreator(modalChild);
                return (
                  <>
                    {!canManage && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                        Alleen de aanmaker kan de zichtbaarheid beheren.
                      </div>
                    )}
                    <div className="space-y-3 mb-6">
                      <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium">Jij ({user?.name})</span>
                      </div>
                      {coParents.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Co-ouders</h4>
                          {coParents.map((parent) => {
                            const has = (childVisibilities[showVisibilityModal] ?? []).some((cv) => cv.user_id === parent.user_id);
                            return (
                              <button key={parent.user_id}
                                onClick={() => toggleVisibility(showVisibilityModal, parent.user_id)}
                                disabled={!canManage}
                                className={`w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between mb-1 ${canManage ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                              >
                                <div className="flex items-center gap-2">
                                  {has ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                  <span className="text-sm">{parent.user.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{has ? 'Kan zien' : 'Kan niet zien'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {helpers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Hulpverleners</h4>
                          {helpers.map((helper) => {
                            const has = (childVisibilities[showVisibilityModal] ?? []).some((cv) => cv.user_id === helper.user_id);
                            return (
                              <button key={helper.user_id}
                                onClick={() => toggleVisibility(showVisibilityModal, helper.user_id)}
                                disabled={!canManage}
                                className={`w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between mb-1 ${canManage ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                              >
                                <div className="flex items-center gap-2">
                                  {has ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                                  <span className="text-sm">{helper.user.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{has ? 'Kan zien' : 'Kan niet zien'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
              <button onClick={() => setShowVisibilityModal(null)}
                className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                Sluiten
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {isHelper && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">Je bekijkt dit gezin als hulpverlener (read-only).</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kinderen</h1>
          <p className="mt-1 text-sm text-gray-600">{isHelper ? 'Bekijk de kinderen in dit gezin' : 'Beheer de kinderen in dit gezin'}</p>
        </div>
        {!showCreate && isParent && !isHelper && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Kind toevoegen
          </button>
        )}
      </div>

      {showPaywall && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Upgrade vereist</h3>
              <p className="text-sm text-amber-800 mb-2">
                Met het gratis plan kun je maximaal 1 kind toevoegen. Upgrade naar PLUS of PRO voor onbeperkt kinderen.
              </p>
              <button onClick={() => setShowPaywall(false)} className="text-sm text-amber-900 hover:underline font-medium">Sluiten</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Kind toevoegen</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                required maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Geboortejaar (optioneel)</label>
              <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                min="1990" max={new Date().getFullYear()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kleur</label>
              <div className="flex gap-3">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            {coParents.length > 0 && (
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={shareWithCoParents} onChange={(e) => setShareWithCoParents(e.target.checked)}
                    className="w-5 h-5 text-slate-800 rounded" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Deel met co-ouder(s)</span>
                    <p className="text-xs text-gray-500">Zichtbaar voor: {coParents.map((p) => p.user.name).join(', ')}</p>
                  </div>
                </label>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
                {loading ? 'Bezig...' : 'Toevoegen'}
              </button>
              <button type="button"
                onClick={() => { setShowCreate(false); setFirstName(''); setBirthYear(''); setColor(COLORS[0]); setShareWithCoParents(true); }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => { setSelectedChildId(child.id); setActiveTab('info'); }}
            className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all w-full"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: child.color ?? COLORS[0] }}
              >
                {child.first_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{child.first_name}</h3>
                {child.birth_year && <p className="text-sm text-gray-500">Geboren in {child.birth_year}</p>}
                {child.created_by && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Aangemaakt door: {child.created_by === user?.id ? 'jij' : (creatorNames[child.created_by] ?? 'onbekend')}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            {(coParents.length > 0 || helpers.length > 0) && isParent && (
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span>{getVisibleNames(child.id)}</span>
              </div>
            )}
          </button>
        ))}

        {children.length === 0 && !showCreate && (
          <div className="text-center py-12 text-gray-400 text-sm">Nog geen kinderen toegevoegd</div>
        )}
      </div>
    </div>
  );
}
