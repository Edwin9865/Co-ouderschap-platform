import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import type { User } from '../lib/types';

interface ChildVisibility {
  child_id: string;
  user_id: string;
  user?: User;
}

export function Children() {
  const { currentFamily, children, refreshFamily, isParent, isHelper, canAccessFeature, members } = useFamily();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [shareWithCoParents, setShareWithCoParents] = useState(true);
  const [childVisibilities, setChildVisibilities] = useState<Record<string, ChildVisibility[]>>({});
  const [showVisibilityModal, setShowVisibilityModal] = useState<string | null>(null);

  const coParents = members.filter((m) => m.user_id !== user?.id && m.role === 'PARENT');
  const helpers = members.filter((m) => m.role === 'HELPER');

  useEffect(() => {
    fetchChildVisibilities();
  }, [children]);

  const fetchChildVisibilities = async () => {
    if (children.length === 0) return;

    const { data: visibilityData, error } = await supabase
      .from('child_visibility')
      .select('child_id, user_id')
      .in('child_id', children.map((c) => c.id));

    if (error) {
      console.error('Error fetching child visibility:', error);
      return;
    }

    if (visibilityData && visibilityData.length > 0) {
      const userIds = [...new Set(visibilityData.map((v) => v.user_id))];

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      const userMap = new Map(userData?.map((u) => [u.id, u]) || []);

      const enrichedData = visibilityData.map((v) => ({
        ...v,
        user: userMap.get(v.user_id),
      }));

      const grouped = enrichedData.reduce((acc, cv) => {
        if (!acc[cv.child_id]) acc[cv.child_id] = [];
        acc[cv.child_id].push(cv as ChildVisibility);
        return acc;
      }, {} as Record<string, ChildVisibility[]>);

      setChildVisibilities(grouped);
    } else {
      setChildVisibilities({});
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;

    if (children.length >= 1 && !canAccessFeature('multiple_children')) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    try {
      const { data: newChild, error } = await supabase
        .from('children')
        .insert({
          family_id: currentFamily.id,
          first_name: firstName,
          birth_year: birthYear ? parseInt(birthYear) : null,
          color: color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      if (shareWithCoParents && newChild && coParents.length > 0) {
        await supabase.from('child_visibility').insert(
          coParents.map((parent) => ({
            child_id: newChild.id,
            user_id: parent.user_id,
            granted_by: user.id,
          }))
        );
      }

      await refreshFamily();
      setFirstName('');
      setBirthYear('');
      setColor('#3b82f6');
      setShareWithCoParents(true);
      setShowCreate(false);
      await fetchChildVisibilities();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (childId: string) => {
    setLoading(true);
    try {
      await supabase
        .from('children')
        .update({
          first_name: firstName,
          birth_year: birthYear ? parseInt(birthYear) : null,
          color: color,
        })
        .eq('id', childId);

      await refreshFamily();
      setEditingChild(null);
      setFirstName('');
      setBirthYear('');
      setColor('#3b82f6');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Weet je zeker dat je dit kind wilt verwijderen?')) return;

    setLoading(true);
    try {
      await supabase.from('children').delete().eq('id', childId);
      await refreshFamily();
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (childId: string, parentId: string) => {
    if (!user) return;

    const currentVisibilities = childVisibilities[childId] || [];
    const hasVisibility = currentVisibilities.some((cv) => cv.user_id === parentId);

    if (hasVisibility) {
      await supabase
        .from('child_visibility')
        .delete()
        .eq('child_id', childId)
        .eq('user_id', parentId);
    } else {
      await supabase.from('child_visibility').insert({
        child_id: childId,
        user_id: parentId,
        granted_by: user.id,
      });
    }

    await fetchChildVisibilities();
  };

  const startEdit = (child: typeof children[0]) => {
    setEditingChild(child.id);
    setFirstName(child.first_name);
    setBirthYear(child.birth_year?.toString() || '');
    setColor(child.color || '#3b82f6');
  };

  const getVisibleParentNames = (childId: string) => {
    if (coParents.length === 0 && helpers.length === 0) return 'Alleen jij';

    const child = children.find((c) => c.id === childId);
    if (!child) return 'Alleen jij';

    const visibilityUserIds = new Set<string>();

    if (child.created_by && child.created_by !== user?.id) {
      visibilityUserIds.add(child.created_by);
    }

    const visibilities = childVisibilities[childId] || [];
    visibilities.forEach((cv) => {
      if (cv.user_id !== user?.id) {
        visibilityUserIds.add(cv.user_id);
      }
    });

    if (visibilityUserIds.size === 0) return 'Alleen jij';

    const visibleCoParents = coParents.filter((cp) => visibilityUserIds.has(cp.user_id));
    const visibleHelpers = helpers.filter((h) => visibilityUserIds.has(h.user_id));

    const allNames = [
      ...visibleCoParents.map((cp) => cp.user.name),
      ...visibleHelpers.map((h) => h.user.name)
    ];

    return `Jij, ${allNames.join(', ')}`;
  };

  return (
    <div className="space-y-6">
      {isHelper && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Je bekijkt dit gezin als hulpverlener (read-only). Je kunt geen wijzigingen aanbrengen.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kinderen</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">{isHelper ? 'Bekijk de kinderen in dit gezin' : 'Beheer de kinderen in dit gezin'}</p>
        </div>
        {!showCreate && isParent && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Kind toevoegen</span>
          </button>
        )}
      </div>

      {showPaywall && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Upgrade vereist</h3>
              <p className="text-sm text-amber-800 mb-3">
                Met het gratis plan kun je maximaal 1 kind toevoegen. Upgrade naar PLUS of PRO voor
                onbeperkt kinderen.
              </p>
              <button
                onClick={() => setShowPaywall(false)}
                className="text-sm text-amber-900 hover:underline font-medium"
              >
                Sluiten
              </button>
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
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geboortejaar (optioneel)
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min="1990"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kleur
              </label>
              <div className="flex gap-3">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {coParents.length > 0 && (
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareWithCoParents}
                    onChange={(e) => setShareWithCoParents(e.target.checked)}
                    className="w-5 h-5 text-slate-800 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Deel met co-ouder(s)
                    </span>
                    <p className="text-xs text-gray-500">
                      Maak dit kind zichtbaar voor: {coParents.map((p) => p.user.name).join(', ')}
                    </p>
                  </div>
                </label>
              </div>
            )}

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
                  setFirstName('');
                  setBirthYear('');
                  setColor('#3b82f6');
                  setShareWithCoParents(true);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {showVisibilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Wie kan dit kind zien?
            </h3>

            <div className="space-y-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Jij ({user?.name})</span>
                </div>
              </div>

              {coParents.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Co-ouders</h4>
                  <div className="space-y-2">
                    {coParents.map((parent) => {
                      const hasVisibility = (childVisibilities[showVisibilityModal] || []).some(
                        (cv) => cv.user_id === parent.user_id
                      );
                      return (
                        <button
                          key={parent.user_id}
                          onClick={() => toggleVisibility(showVisibilityModal, parent.user_id)}
                          className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {hasVisibility ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{parent.user.name}</span>
                          </div>
                          <span className="text-xs text-gray-600">
                            {hasVisibility ? 'Kan zien' : 'Kan niet zien'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {helpers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Hulpverleners</h4>
                  <div className="space-y-2">
                    {helpers.map((helper) => {
                      const hasVisibility = (childVisibilities[showVisibilityModal] || []).some(
                        (cv) => cv.user_id === helper.user_id
                      );
                      return (
                        <button
                          key={helper.user_id}
                          onClick={() => toggleVisibility(showVisibilityModal, helper.user_id)}
                          className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {hasVisibility ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{helper.user.name}</span>
                          </div>
                          <span className="text-xs text-gray-600">
                            {hasVisibility ? 'Kan zien' : 'Kan niet zien'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowVisibilityModal(null)}
              className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {children.map((child) => (
          <div key={child.id} className="bg-white rounded-lg border border-gray-200 p-6">
            {editingChild === child.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(child.id);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geboortejaar
                  </label>
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kleur
                  </label>
                  <div className="flex gap-3">
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {(coParents.length > 0 || helpers.length > 0) && (
                  <div className="border-t pt-4 space-y-4">
                    {coParents.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Zichtbaar voor co-ouders
                        </label>
                        <div className="space-y-2">
                          {coParents.map((parent) => {
                            const hasVisibility = (childVisibilities[child.id] || []).some(
                              (cv) => cv.user_id === parent.user_id
                            );
                            return (
                              <label key={parent.user_id} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasVisibility}
                                  onChange={() => toggleVisibility(child.id, parent.user_id)}
                                  className="w-5 h-5 text-slate-800 rounded"
                                />
                                <span className="text-sm text-gray-700">{parent.user.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {helpers.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Zichtbaar voor hulpverleners
                        </label>
                        <div className="space-y-2">
                          {helpers.map((helper) => {
                            const hasVisibility = (childVisibilities[child.id] || []).some(
                              (cv) => cv.user_id === helper.user_id
                            );
                            return (
                              <label key={helper.user_id} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={hasVisibility}
                                  onChange={() => toggleVisibility(child.id, helper.user_id)}
                                  className="w-5 h-5 text-slate-800 rounded"
                                />
                                <span className="text-sm text-gray-700">{helper.user.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                      setEditingChild(null);
                      setFirstName('');
                      setBirthYear('');
                      setColor('#3b82f6');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: child.color || '#3b82f6' }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{child.first_name}</h3>
                      {child.birth_year && (
                        <p className="text-sm text-gray-600">Geboren in {child.birth_year}</p>
                      )}
                    </div>
                  </div>
                  {isParent && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(child)}
                        className="p-2 text-gray-600 hover:text-slate-700 hover:bg-gray-100 rounded-lg"
                        title="Bewerken"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {(coParents.length > 0 || helpers.length > 0) && isParent && (
                  <div className="border-t pt-3">
                    <button
                      onClick={() => setShowVisibilityModal(child.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Zichtbaar voor: {getVisibleParentNames(child.id)}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {children.length === 0 && !showCreate && (
          <div className="text-center py-12 text-gray-500">
            Nog geen kinderen toegevoegd
          </div>
        )}
      </div>
    </div>
  );
}
