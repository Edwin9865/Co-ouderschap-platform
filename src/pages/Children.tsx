import { useState, useEffect, useCallback, useRef } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Plus, Edit2, Trash2, Lock, Eye, EyeOff,
  ArrowLeft, Info, Check, X, ChevronRight,
  Shield, Pill, Syringe, Hash, MapPin, FileText, Tag, Ruler, CreditCard, RefreshCw, Smile,
  Upload, Camera, Trash, Phone,
} from 'lucide-react';
import type { Child, User } from '../lib/types';

interface ChildVisibility {
  child_id: string;
  user_id: string;
  user?: User;
}

interface PhoneEntry {
  id: string;
  name: string;
  phones: string[];
}

type InfoFieldKey =
  | 'clothing_size' | 'shoe_size'
  | 'insurance' | 'meds_allergy' | 'vaccinations'
  | 'social_security_num' | 'passport_num' | 'passport_location' | 'other_info';

interface InfoField {
  key: InfoFieldKey;
  label: string;
  info?: string;
  Icon: React.ElementType;
}

const INFO_GROUPS: InfoField[][] = [
  [
    { key: 'clothing_size', label: 'Kledingmaat', Icon: Tag },
    { key: 'shoe_size', label: 'Schoenmaat', Icon: Ruler },
  ],
  [
    { key: 'insurance', label: 'Verzekering', Icon: Shield },
    { key: 'meds_allergy', label: 'Medicijnen / allergie', Icon: Pill },
    { key: 'vaccinations', label: 'Vaccinaties', info: 'Noteer vaccinatiedata en herinneringen', Icon: Syringe },
  ],
  [
    { key: 'social_security_num', label: 'BSN', Icon: Hash },
    { key: 'passport_num', label: 'Paspoortnummer', Icon: CreditCard },
    { key: 'passport_location', label: 'Waar is het paspoort?', info: 'Bijv. lade bureau ouder 1', Icon: MapPin },
    { key: 'other_info', label: 'Overige', Icon: FileText },
  ],
];

const AVATAR_STYLES = [
  { id: 'adventurer', label: '🧒 Avonturier' },
  { id: 'bottts', label: '🤖 Robot' },
  { id: 'croodles', label: '🎨 Doodle' },
  { id: 'fun-emoji', label: '😄 Emoji' },
  { id: 'big-smile', label: '😊 Smiley' },
  { id: 'micah', label: '👦 Portret' },
  { id: 'pixel-art', label: '🕹️ Pixel' },
  { id: 'lorelei', label: '🧸 Schattig' },
];

function randomSeed() {
  return Math.random().toString(36).substring(2, 10);
}

function getAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

async function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('blob')),
        'image/webp',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('load')); };
    img.src = objectUrl;
  });
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isBirthdayToday(birthDate: string): boolean {
  const today = new Date();
  const birth = new Date(birthDate);
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
}

export function Children() {
  const { currentFamily, children, refreshFamily, isParent, isHelper, canAccessFeature, members } = useFamily();
  const { user } = useAuth();

  // List / create / edit state
  const [showCreate, setShowCreate] = useState(false);
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [shareWithCoParents, setShareWithCoParents] = useState(true);
  const [childVisibilities, setChildVisibilities] = useState<Record<string, ChildVisibility[]>>({});
  const [showVisibilityModal, setShowVisibilityModal] = useState<string | null>(null);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [deletedChildren, setDeletedChildren] = useState<Child[]>([]);

  // Detail view state
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'info' | 'accounts' | 'phones'>('info');
  const [editingField, setEditingField] = useState<InfoFieldKey | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [fieldSaving, setFieldSaving] = useState(false);
  const [accountsValue, setAccountsValue] = useState('');
  const [accountsSaving, setAccountsSaving] = useState(false);

  // Phone numbers tab state
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneEntry[]>([]);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [newPhoneRows, setNewPhoneRows] = useState<{ name: string; phones: string[] }[]>([{ name: '', phones: [''] }]);

  // Avatar picker state
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'avatar' | 'photo'>('avatar');
  const [avatarStyle, setAvatarStyle] = useState(AVATAR_STYLES[0].id);
  const [previewSeeds, setPreviewSeeds] = useState<string[]>(() => Array.from({ length: 9 }, randomSeed));
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const coParents = members.filter((m) => m.user_id !== user?.id && m.role === 'PARENT');
  const helpers = members.filter((m) => m.role === 'HELPER');
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  useEffect(() => {
    fetchChildVisibilities();
    fetchCreatorNames();
  }, [children]);

  const refreshFamilyRef = useRef<() => void>(() => {});
  refreshFamilyRef.current = refreshFamily;

  useEffect(() => {
    if (!currentFamily) return;
    const channel = supabase
      .channel(`children_${currentFamily.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children', filter: `family_id=eq.${currentFamily.id}` }, () => refreshFamilyRef.current())
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [currentFamily]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refreshFamilyRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Fetch deleted children when on avatar tab (only for creators/parents)
  useEffect(() => {
    if (activeTab === 'images' && isParent && !isHelper) {
      fetchDeletedChildren();
    }
  }, [activeTab, currentFamily, user]);

  // Sync accounts textarea when switching child or tab
  useEffect(() => {
    if (selectedChild) {
      setAccountsValue(selectedChild.accounts_notes ?? '');
      setPhoneNumbers(selectedChild.phone_numbers ?? []);
      setShowAddPhone(false);
      setNewPhoneRows([{ name: '', phones: [''] }]);
      setEditingField(null);
      setIsEditingAvatar(false);
      setFirstName(selectedChild.first_name);
      setBirthDate(selectedChild.birth_date ?? '');
      setColor(selectedChild.color ?? COLORS[0]);
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

  const syncBirthdayEvent = async (childId: string, childName: string, birthDateValue: string) => {
    if (!currentFamily || !user || !birthDateValue) return;

    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('child_id', childId)
      .eq('type', 'birthday')
      .eq('family_id', currentFamily.id)
      .eq('recurrence_rule', 'FREQ=YEARLY')
      .maybeSingle();

    const startAt = `${birthDateValue}T00:00:00`;
    const endAt = `${birthDateValue}T23:59:00`;

    if (existing) {
      await supabase.from('events').update({
        title: `Verjaardag ${childName}`,
        start_at: startAt,
        end_at: endAt,
      }).eq('id', existing.id);
    } else {
      await supabase.from('events').insert({
        family_id: currentFamily.id,
        child_id: childId,
        type: 'birthday',
        title: `Verjaardag ${childName}`,
        start_at: startAt,
        end_at: endAt,
        recurrence_rule: 'FREQ=YEARLY',
        status: 'scheduled',
        created_by: user.id,
        reminder_enabled: false,
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;
    if (children.length >= 1 && !canAccessFeature('multiple_children')) { setShowPaywall(true); return; }
    setLoading(true);
    try {
      const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;
      const { data: newChild, error } = await supabase
        .from('children')
        .insert({ family_id: currentFamily.id, first_name: firstName, birth_date: birthDate || null, birth_year: birthYear, color, created_by: user.id })
        .select().single();
      if (error) throw error;
      if (shareWithCoParents && newChild && coParents.length > 0) {
        await supabase.from('child_visibility').insert(coParents.map((p) => ({ child_id: newChild.id, user_id: p.user_id, granted_by: user.id })));
      }
      if (newChild && birthDate) {
        await syncBirthdayEvent(newChild.id, firstName, birthDate);
      }
      await refreshFamily();
      setFirstName(''); setBirthDate(''); setColor(COLORS[0]); setShareWithCoParents(true); setShowCreate(false);
      await fetchChildVisibilities();
    } finally { setLoading(false); }
  };

  const handleUpdate = async (childId: string) => {
    setLoading(true);
    try {
      const birthYear = birthDate ? new Date(birthDate).getFullYear() : null;
      const { error } = await supabase.from('children')
        .update({ first_name: firstName, birth_date: birthDate || null, birth_year: birthYear, color })
        .eq('id', childId);
      if (error) { alert('Fout bij opslaan: Alleen de aanmaker kan dit kind bewerken.'); return; }
      if (birthDate) {
        await syncBirthdayEvent(childId, firstName, birthDate);
      }
      await refreshFamily();
    } finally { setLoading(false); }
  };

  const fetchDeletedChildren = async () => {
    if (!currentFamily || !user) return;
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', currentFamily.id)
      .eq('created_by', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    setDeletedChildren(data || []);
  };

  const handleDelete = async (childId: string) => {
    if (!confirm('Weet je zeker dat je dit kind wilt verwijderen? De logs en afspraken blijven bewaard en verschijnen in de export als "Verwijderd kind".')) return;
    setLoading(true);
    try {
      // Soft delete — bewaar data, sluit visibility
      const { error } = await supabase.from('children')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user!.id })
        .eq('id', childId);
      if (error) { alert('Fout bij verwijderen: Alleen de aanmaker kan dit kind verwijderen.'); return; }
      // Verwijder uit child_visibility zodat anderen het niet meer zien
      await supabase.from('child_visibility').delete().eq('child_id', childId);
      if (selectedChildId === childId) setSelectedChildId(null);
      await refreshFamily();
      await fetchDeletedChildren();
    } finally { setLoading(false); }
  };

  const handleRestore = async (childId: string) => {
    if (!confirm('Wil je dit kind herstellen? Het kind wordt weer zichtbaar in de app.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('children')
        .update({ deleted_at: null, deleted_by: null })
        .eq('id', childId);
      if (error) { alert('Fout bij herstellen.'); return; }
      await refreshFamily();
      await fetchDeletedChildren();
    } finally { setLoading(false); }
  };

  const toggleVisibility = async (childId: string, userId: string) => {
    if (!user) return;
    const child = children.find((c) => c.id === childId);
    if (child && !isChildCreator(child)) { alert('Alleen de aanmaker kan de zichtbaarheid beheren.'); return; }
    const has = (childVisibilities[childId] ?? []).some((cv) => cv.user_id === userId);
    const memberName = members.find((m) => m.user_id === userId)?.user?.name ?? 'deze persoon';
    const childName = child?.first_name ?? 'dit kind';
    const action = has
      ? `Weet je zeker dat je ${childName} verbergt voor ${memberName}?`
      : `Weet je zeker dat je ${childName} zichtbaar maakt voor ${memberName}?`;
    if (!confirm(action)) return;
    if (has) {
      const { error, count } = await supabase.from('child_visibility').delete({ count: 'exact' }).eq('child_id', childId).eq('user_id', userId);
      console.log('[visibility] delete:', { error, count, childId, userId });
      if (error) { console.error('Fout bij intrekken zichtbaarheid:', error); alert('Fout bij opslaan. Probeer opnieuw.'); return; }
    } else {
      const { error } = await supabase.from('child_visibility').insert({ child_id: childId, user_id: userId, granted_by: user.id });
      console.log('[visibility] insert:', { error, childId, userId });
      if (error) { console.error('Fout bij verlenen zichtbaarheid:', error); alert('Fout bij opslaan. Probeer opnieuw.'); return; }
    }
    await fetchChildVisibilities();
    await refreshFamily();
  };

  const startEdit = (child: Child) => {
    if (!isChildCreator(child)) { alert('Alleen de aanmaker kan dit kind bewerken.'); return; }
    setEditingChild(child.id);
    setFirstName(child.first_name);
    setBirthDate(child.birth_date ?? '');
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

  const handleSavePhoneNumbers = async (updated: PhoneEntry[]) => {
    if (!selectedChildId) return;
    setPhoneSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('children')
        .update({ phone_numbers: updated })
        .eq('id', selectedChildId);
      if (error) throw error;
      setPhoneNumbers(updated);
      await refreshFamily();
    } catch (e) { console.error('Error saving phone numbers:', e); }
    finally { setPhoneSaving(false); }
  };

  const handleAddPhones = async () => {
    const valid = newPhoneRows.filter(r => r.name.trim() || r.phones.some(p => p.trim()));
    if (!valid.length) return;
    const entries: PhoneEntry[] = valid.map(r => ({
      id: crypto.randomUUID(),
      name: r.name.trim(),
      phones: r.phones.map(p => p.trim()).filter(Boolean),
    }));
    const updated = [...phoneNumbers, ...entries];
    await handleSavePhoneNumbers(updated);
    setNewPhoneRows([{ name: '', phones: [''] }]);
    setShowAddPhone(false);
  };

  const handleDeletePhone = async (id: string) => {
    const updated = phoneNumbers.filter(p => p.id !== id);
    await handleSavePhoneNumbers(updated);
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

  const handleSaveAvatar = async (seed: string) => {
    if (!selectedChildId) return;
    setAvatarSaving(true);
    try {
      const { error } = await supabase.from('children')
        .update({ avatar_style: seed ? avatarStyle : null, avatar_seed: seed || null })
        .eq('id', selectedChildId);
      if (error) throw error;
      await refreshFamily();
    } catch (e) { console.error('Error saving avatar:', e); }
    finally { setAvatarSaving(false); }
  };

  const regenerateSeeds = useCallback(() => {
    setPreviewSeeds(Array.from({ length: 9 }, randomSeed));
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChildId || !currentFamily) return;

    setPhotoError(null);
    setPhotoUploading(true);

    try {
      const child = children.find((c) => c.id === selectedChildId);

      // Delete old photo if exists (strip cache-busting query string from URL)
      if (child?.avatar_url) {
        const oldPath = child.avatar_url.split('/child-avatars/')[1]?.split('?')[0];
        if (oldPath) await supabase.storage.from('child-avatars').remove([oldPath]);
      }

      // Compress and convert to WebP before uploading
      const compressed = await compressImage(file);
      const path = `${currentFamily.id}/${selectedChildId}.webp`;

      const { error: upErr } = await supabase.storage
        .from('child-avatars')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('child-avatars').getPublicUrl(path);
      // Append timestamp to bust browser cache when replacing a photo
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // Save URL + clear DiceBear avatar
      const { error: dbErr } = await supabase.from('children')
        .update({ avatar_url: cacheBustedUrl, avatar_style: null, avatar_seed: null })
        .eq('id', selectedChildId);
      if (dbErr) throw dbErr;

      await refreshFamily();
    } catch (err) {
      console.error('Photo upload failed:', err);
      setPhotoError('Uploaden mislukt. Probeer een kleinere afbeelding.');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!selectedChildId) return;
    const child = children.find((c) => c.id === selectedChildId);
    if (!child?.avatar_url) return;

    setPhotoUploading(true);
    try {
      const oldPath = child.avatar_url.split('/child-avatars/')[1]?.split('?')[0];
      if (oldPath) await supabase.storage.from('child-avatars').remove([oldPath]);
      await supabase.from('children').update({ avatar_url: null }).eq('id', selectedChildId);
      await refreshFamily();
    } catch (err) { console.error('Remove photo failed:', err); }
    finally { setPhotoUploading(false); }
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
    // Basisgegevens (naam, geboortejaar, kleur) + verwijderen: alleen aanmaker
    const canEdit = isChildCreator(selectedChild) && isParent && !isHelper;
    // Kind info velden + accounts: alle ouders (niet alleen aanmaker)
    const canEditInfo = isParent && !isHelper;
    // Live color preview: use the color picker state when the edit form is open
    const previewColor = activeTab === 'images' ? color : (selectedChild.color ?? COLORS[0]);

    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button
          onClick={() => setSelectedChildId(null)}
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
              { id: 'images', label: 'Avatar' },
              { id: 'info', label: 'Kind info' },
              { id: 'phones', label: 'Telefoon' },
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
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden transition-all${canEdit ? ' cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-slate-400' : ''}`}
                  onClick={() => { if (canEdit) { setActiveTab('images'); setIsEditingAvatar(true); } }}
                  title={canEdit ? 'Avatar of foto wijzigen' : undefined}
                  style={{ backgroundColor: previewColor }}
                >
                  {selectedChild.avatar_url ? (
                    <img src={selectedChild.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : selectedChild.avatar_style && selectedChild.avatar_seed ? (
                    <img src={getAvatarUrl(selectedChild.avatar_style, selectedChild.avatar_seed)} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedChild.first_name[0].toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedChild.first_name}</h2>
                  {selectedChild.birth_date && (
                    <p className="text-sm text-gray-400">
                      {calculateAge(selectedChild.birth_date)} jaar
                      {isBirthdayToday(selectedChild.birth_date) && ' \uD83C\uDF82'}
                      {' \u00B7 '}
                      {new Date(selectedChild.birth_date + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => { setActiveTab('images'); setIsEditingAvatar(true); }}
                    className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    title="Avatar en basisgegevens bewerken"
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
                        <div className="flex items-center gap-2 flex-1">
                          <field.Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-500 text-sm">{field.label}</span>
                        </div>

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
                              onClick={() => canEditInfo ? (setEditingField(field.key), setFieldValue(value ?? '')) : undefined}
                              disabled={!canEditInfo}
                              className={`text-sm font-medium ${
                                value ? 'text-gray-800' : 'text-gray-400'
                              } ${canEditInfo ? 'hover:text-blue-600 cursor-pointer' : 'cursor-default'}`}
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

          {/* ── AVATAR TAB ──────────────────────────────────────── */}
          {activeTab === 'images' && (
            <div className="p-5 space-y-5">
              {/* ── VIEW MODE ── */}
              {!isEditingAvatar && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div
                    className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-4xl font-bold overflow-hidden shadow-sm"
                    style={{ backgroundColor: selectedChild.color ?? COLORS[0] }}
                  >
                    {selectedChild.avatar_url ? (
                      <img src={selectedChild.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : selectedChild.avatar_style && selectedChild.avatar_seed ? (
                      <img src={getAvatarUrl(selectedChild.avatar_style, selectedChild.avatar_seed)} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Smile className="w-12 h-12 opacity-70" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedChild.avatar_url ? 'Profielfoto' : selectedChild.avatar_seed ? 'Avatar' : 'Nog geen afbeelding'}
                  </p>
                  {canEditInfo && (
                    <button
                      onClick={() => setIsEditingAvatar(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      Wijzigen
                    </button>
                  )}
                </div>
              )}

              {/* ── EDIT MODE ── */}
              {isEditingAvatar && canEditInfo && (
                <>
                  {/* Current preview */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 overflow-hidden shadow-sm"
                      style={{ backgroundColor: previewColor }}
                    >
                      {selectedChild.avatar_url ? (
                        <img src={selectedChild.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : selectedChild.avatar_style && selectedChild.avatar_seed ? (
                        <img src={getAvatarUrl(selectedChild.avatar_style, selectedChild.avatar_seed)} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Smile className="w-10 h-10 opacity-70" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {selectedChild.avatar_url ? 'Profielfoto' : selectedChild.avatar_seed ? 'Avatar' : 'Nog geen afbeelding'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Kies een avatar of upload een foto</p>
                    </div>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <button
                      onClick={() => setAvatarMode('avatar')}
                      className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        avatarMode === 'avatar' ? 'bg-slate-800 text-white' : 'bg-white/60 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Smile className="w-4 h-4" />
                      Avatar kiezen
                    </button>
                    <button
                      onClick={() => setAvatarMode('photo')}
                      className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        avatarMode === 'photo' ? 'bg-slate-800 text-white' : 'bg-white/60 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      Foto uploaden
                    </button>
                  </div>

                  {/* Photo upload mode */}
                  {avatarMode === 'photo' && (
                    <div className="space-y-3">
                      <label className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-8 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50/30 ${photoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={photoUploading}
                        />
                        {photoUploading ? (
                          <>
                            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                            <span className="text-sm text-gray-500">Uploaden...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Tik om een foto te kiezen</span>
                            <span className="text-xs text-gray-400">JPG, PNG, WEBP of HEIC · max 5 MB</span>
                          </>
                        )}
                      </label>
                      {photoError && <p className="text-xs text-red-600">{photoError}</p>}
                      {selectedChild.avatar_url && (
                        <button
                          onClick={handleRemovePhoto}
                          disabled={photoUploading}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          Foto verwijderen
                        </button>
                      )}
                    </div>
                  )}

                  {/* Avatar picker mode */}
                  {avatarMode === 'avatar' && (
                  <>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Stijl</p>
                    <div className="grid grid-cols-4 gap-2">
                      {AVATAR_STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setAvatarStyle(s.id)}
                          className={`px-2 py-2 rounded-xl text-xs font-medium transition-all border text-center ${
                            avatarStyle === s.id
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white/60 text-gray-600 border-gray-200 hover:border-slate-400'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kies een avatar</p>
                      <button
                        onClick={regenerateSeeds}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Nieuwe opties
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {previewSeeds.map((seed) => {
                        const isSelected = selectedChild.avatar_seed === seed && selectedChild.avatar_style === avatarStyle;
                        return (
                          <button
                            key={seed}
                            onClick={() => handleSaveAvatar(seed)}
                            disabled={avatarSaving}
                            className={`relative rounded-2xl overflow-hidden border-2 transition-all aspect-square flex items-center justify-center ${
                              isSelected
                                ? 'border-green-500 ring-2 ring-green-200'
                                : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
                            }`}
                            style={{ backgroundColor: previewColor }}
                          >
                            <img
                              src={getAvatarUrl(avatarStyle, seed)}
                              alt="avatar optie"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {selectedChild.avatar_seed && (
                    <button
                      onClick={() => handleSaveAvatar('')}
                      disabled={avatarSaving}
                      className="text-xs text-gray-400 hover:text-red-500 underline"
                    >
                      Avatar verwijderen
                    </button>
                  )}
                  </>
                  )}

                  {/* Basisgegevens */}
                  {canEdit && (
                    <>
                      <div className="h-px bg-gray-100" />
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">Basisgegevens</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam</label>
                          <input
                            type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            required maxLength={100}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum (optioneel)</label>
                          <input
                            type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Kleur</label>
                          <p className="text-xs text-gray-500 mb-2">Deze kleur wordt voor dit kind gebruikt in de agenda, het logboek en andere onderdelen van de app. Elke kleur kan maar één keer worden gebruikt.</p>
                          <div className="flex gap-2">
                            {COLORS.map((c) => {
                              const isTaken = children.some(ch => ch.id !== selectedChild.id && ch.color === c);
                              return (
                                <button key={c} type="button"
                                  onClick={() => !isTaken && setColor(c)}
                                  disabled={isTaken}
                                  title={isTaken ? 'Deze kleur is al in gebruik door een ander kind' : undefined}
                                  className={`w-9 h-9 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''} ${isTaken ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                  style={{ backgroundColor: c }}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdate(selectedChild.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50"
                        >
                          {loading ? 'Opslaan...' : 'Basisgegevens opslaan'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Klaar knop */}
                  <button
                    onClick={() => setIsEditingAvatar(false)}
                    className="w-full py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Klaar
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── PHONES TAB ──────────────────────────────────────── */}
          {activeTab === 'phones' && (
            <div className="p-5 space-y-4">
              {/* List of existing contacts */}
              {phoneNumbers.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {phoneNumbers.map((entry) => (
                    <div key={entry.id} className="py-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{entry.name || 'Onbekend'}</p>
                        <div className="space-y-1">
                          {(entry.phones ?? []).map((num, ni) => (
                            <div key={ni} className="flex items-center gap-2">
                              <a
                                href={`tel:${num.replace(/\s/g, '')}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex-1"
                              >
                                {num}
                              </a>
                              <a
                                href={`tel:${num.replace(/\s/g, '')}`}
                                className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                                title="Bellen"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                      {canEditInfo && (
                        <button
                          onClick={() => handleDeletePhone(entry.id)}
                          disabled={phoneSaving}
                          className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !showAddPhone && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Nog geen telefoonnummers toegevoegd.
                  </p>
                )
              )}

              {/* Add form — one contact at a time, multiple numbers per contact */}
              {canEditInfo && showAddPhone && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                  <input
                    type="text"
                    value={newPhoneRows[0].name}
                    onChange={(e) => setNewPhoneRows([{ ...newPhoneRows[0], name: e.target.value }])}
                    placeholder="Naam (bijv. Huisarts)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-500 focus:border-transparent"
                  />
                  <div className="space-y-2">
                    {newPhoneRows[0].phones.map((num, ni) => (
                      <div key={ni} className="flex gap-2 items-center">
                        <input
                          type="tel"
                          value={num}
                          onChange={(e) => {
                            const phones = [...newPhoneRows[0].phones];
                            phones[ni] = e.target.value;
                            setNewPhoneRows([{ ...newPhoneRows[0], phones }]);
                          }}
                          placeholder={ni === 0 ? 'Telefoonnummer' : `Nummer ${ni + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-500 focus:border-transparent"
                        />
                        {newPhoneRows[0].phones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const phones = newPhoneRows[0].phones.filter((_, j) => j !== ni);
                              setNewPhoneRows([{ ...newPhoneRows[0], phones }]);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewPhoneRows([{ ...newPhoneRows[0], phones: [...newPhoneRows[0].phones, ''] }])}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nog een nummer toevoegen
                  </button>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddPhones}
                      disabled={phoneSaving || (!newPhoneRows[0].name.trim() && newPhoneRows[0].phones.every(p => !p.trim()))}
                      className="flex-1 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                      {phoneSaving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddPhone(false); setNewPhoneRows([{ name: '', phones: [''] }]); }}
                      className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}

              {/* Add button */}
              {canEditInfo && !showAddPhone && (
                <button
                  type="button"
                  onClick={() => setShowAddPhone(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 text-gray-500 text-sm rounded-lg hover:border-slate-400 hover:text-slate-700 w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Contact toevoegen
                </button>
              )}
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
                disabled={!canEditInfo}
                rows={8}
                placeholder={'Bijv.\nSchoolportaal: gebruiker@school.nl\nZorgverzekering: polisnummer 12345678\nKinderopvang app: 06-12345678'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {canEditInfo && (
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

        {/* Verwijderde kinderen — alleen op avatar tab, alleen voor aanmakers */}
        {activeTab === 'images' && isParent && !isHelper && deletedChildren.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Verwijderde kinderen</h4>
            <p className="text-xs text-gray-400">Logs en afspraken zijn bewaard en verschijnen in de export.</p>
            {deletedChildren.map((child) => (
              <div key={child.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 opacity-50"
                    style={{ backgroundColor: child.color ?? COLORS[0] }}
                  >
                    {child.first_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{child.first_name}</p>
                    {child.deleted_at && (
                      <p className="text-xs text-gray-400">
                        Verwijderd op {new Date(child.deleted_at).toLocaleDateString('nl-NL')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(child.id)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 whitespace-nowrap"
                >
                  Herstellen
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Visibility + delete — only on avatar tab */}
        {activeTab === 'images' && isParent && !isHelper && (
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
          <button onClick={() => {
            const usedColors = children.map(c => c.color).filter(Boolean) as string[];
            const freeColor = COLORS.find(c => !usedColors.includes(c)) ?? COLORS[0];
            setColor(freeColor);
            setShowCreate(true);
          }}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Geboortedatum (optioneel)</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kleur</label>
              <p className="text-xs text-gray-500 mb-2">Deze kleur wordt voor dit kind gebruikt in de agenda, het logboek en andere onderdelen van de app. Elke kleur kan maar één keer worden gebruikt.</p>
              <div className="flex gap-3">
                {COLORS.map((c) => {
                  const isTaken = children.some(ch => ch.color === c);
                  return (
                    <button key={c} type="button"
                      onClick={() => !isTaken && setColor(c)}
                      disabled={isTaken}
                      title={isTaken ? 'Deze kleur is al in gebruik door een ander kind' : undefined}
                      className={`w-10 h-10 rounded-lg transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''} ${isTaken ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ backgroundColor: c }} />
                  );
                })}
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
                onClick={() => { setShowCreate(false); setFirstName(''); setBirthDate(''); setColor(COLORS[0]); setShareWithCoParents(true); }}
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
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: child.color ?? COLORS[0] }}
              >
                {child.avatar_url ? (
                  <img src={child.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : child.avatar_style && child.avatar_seed ? (
                  <img src={getAvatarUrl(child.avatar_style, child.avatar_seed)} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  child.first_name[0].toUpperCase()
                )}
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
