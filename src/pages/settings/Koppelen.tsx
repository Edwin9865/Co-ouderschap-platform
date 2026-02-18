import { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Child } from '../../lib/types';
import { Link as LinkIcon, Copy, CheckCircle2, RefreshCw, Users, X, Check, Unlink } from 'lucide-react';

interface CouplingRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_family_id: string;
  to_family_id: string;
  status: string;
  message: string | null;
  created_at: string;
  from_user: User;
}

interface FamilyMemberWithUser {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user: User;
}

export function Koppelen() {
  const { currentFamily, children, refreshFamily } = useFamily();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberWithUser[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkingCode, setLinkingCode] = useState('');
  const [linkingError, setLinkingError] = useState('');
  const [linkingSuccess, setLinkingSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState<CouplingRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<CouplingRequest[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [showChildSelection, setShowChildSelection] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const fetchFamilyData = async () => {
    if (!currentFamily || !user) return;

    const [membersResult, inviteCodeResult, sentRequestsResult, receivedRequestsResult] = await Promise.all([
      supabase
        .from('family_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          user:users!family_members_user_id_fkey (*)
        `)
        .eq('family_id', currentFamily.id)
        .eq('status', 'ACTIVE')
        .eq('role', 'PARENT'),
      supabase
        .from('family_invite_codes')
        .select('code')
        .eq('family_id', currentFamily.id)
        .is('used_at', null)
        .maybeSingle(),
      supabase
        .from('coupling_requests')
        .select('*, from_user:users!coupling_requests_from_user_id_fkey(*)')
        .eq('from_user_id', user.id)
        .eq('status', 'PENDING'),
      supabase
        .from('coupling_requests')
        .select('*, from_user:users!coupling_requests_from_user_id_fkey(*)')
        .eq('to_user_id', user.id)
        .eq('status', 'PENDING'),
    ]);

    if (membersResult.data) {
      setFamilyMembers(membersResult.data as FamilyMemberWithUser[]);
    }

    if (inviteCodeResult.data) {
      setInviteCode(inviteCodeResult.data.code);
    }

    if (sentRequestsResult.data) {
      setPendingRequests(sentRequestsResult.data as CouplingRequest[]);
    }

    if (receivedRequestsResult.data) {
      setReceivedRequests(receivedRequestsResult.data as CouplingRequest[]);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [currentFamily, user]);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      if (refreshUser) {
        await refreshUser();
      }
      if (refreshFamily) {
        await refreshFamily();
      }
      await fetchFamilyData();
    } finally {
      setLoading(false);
    }
  };

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

  const handleSendCouplingRequest = async () => {
    if (!linkingCode.trim()) return;

    setLinkingError('');
    setLinkingSuccess('');
    setLoading(true);

    try {
      const codeToUse = linkingCode.trim().toUpperCase();

      const { data, error } = await supabase.rpc('send_coupling_request', {
        invite_code_param: codeToUse,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error);
      }

      setLinkingCode('');
      setLinkingSuccess(`Koppelverzoek verzonden naar ${data.target_user_name}! Wacht op goedkeuring.`);

      setTimeout(() => setLinkingSuccess(''), 5000);
      await fetchFamilyData();
    } catch (err) {
      setLinkingError(err instanceof Error ? err.message : 'Verzoek verzenden mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;

    setActiveRequestId(requestId);
    setSelectedChildren([]);

    if (children.length > 0) {
      setShowChildSelection(true);
    } else {
      await completeAcceptRequest(requestId, []);
    }
  };

  const completeAcceptRequest = async (requestId: string, childIds: string[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_coupling_request', {
        request_id: requestId,
        selected_child_ids: childIds,
      });

      if (error) throw error;

      setShowChildSelection(false);
      setActiveRequestId(null);
      setSelectedChildren([]);

      if (refreshUser) {
        await refreshUser();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (refreshFamily) {
        await refreshFamily();
      }

      await fetchFamilyData();
    } catch (err) {
      setLinkingError(err instanceof Error ? err.message : 'Accepteren mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coupling_requests')
        .update({ status: 'DECLINED' })
        .eq('id', requestId);

      if (error) throw error;

      await fetchFamilyData();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coupling_requests')
        .update({ status: 'CANCELLED' })
        .eq('id', requestId);

      if (error) throw error;

      await fetchFamilyData();
    } finally {
      setLoading(false);
    }
  };

  const toggleChildSelection = (childId: string) => {
    setSelectedChildren((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleUncouple = async (otherParentUserId: string, otherParentName: string) => {
    const confirmed = confirm(
      `Weet je zeker dat je wilt ontkoppelen van ${otherParentName}?\n\n` +
      `Na ontkoppeling:\n` +
      `- Jullie kinderen worden gesplitst op basis van wie ze heeft aangemaakt\n` +
      `- Jullie zien elkaars kinderen niet meer\n` +
      `- Jullie krijgen elk een eigen gezin\n\n` +
      `Deze actie kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('uncouple_parents', {
        other_parent_user_id: otherParentUserId,
      });

      if (error) throw error;

      if (refreshUser) {
        await refreshUser();
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (refreshFamily) {
        await refreshFamily();
      }

      await fetchFamilyData();

      alert(`Ontkoppeling voltooid. ${data.moved_children_count} kind(eren) verplaatst naar jouw gezin.`);
    } catch (err) {
      setLinkingError(err instanceof Error ? err.message : 'Ontkoppelen mislukt');
    } finally {
      setLoading(false);
    }
  };

  const partneredMembers = familyMembers.filter((m) => m.user_id !== user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Koppelen met co-ouder</h1>
        <p className="text-sm sm:text-base text-gray-600">Beheer je koppeling met je co-ouder</p>
      </div>

      {showChildSelection && activeRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Welke kinderen wil je delen?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecteer de kinderen die zichtbaar moeten zijn voor je co-ouder:
            </p>

            <div className="space-y-2 mb-6">
              {children.map((child) => (
                <label
                  key={child.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(child.id)}
                    onChange={() => toggleChildSelection(child.id)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-gray-900">{child.first_name}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowChildSelection(false);
                  setActiveRequestId(null);
                  setSelectedChildren([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Annuleren
              </button>
              <button
                onClick={() => completeAcceptRequest(activeRequestId, selectedChildren)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Bezig...' : 'Accepteren'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-xl">Jouw koppelcode</span>
          </h2>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            title="Ververs gegevens"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div>
          <p className="text-xs sm:text-sm text-gray-600 mb-3">
            Deel deze code met je co-ouder zodat zij/hij een koppelverzoek kan sturen
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inviteCode}
              readOnly
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-base sm:text-lg tracking-wider"
            />
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {codeCopied ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Gekopieerd</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Kopieer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {receivedRequests.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Ontvangen verzoeken</h3>
            <div className="space-y-3">
              {receivedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base text-gray-900 break-words">
                      {request.from_user.name} wil met je koppelen
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 break-all">{request.from_user.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      disabled={loading}
                      className="flex-1 sm:flex-none p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Afwijzen"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={loading}
                      className="flex-1 sm:flex-none p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Accepteren"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            Stuur koppelverzoek
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={linkingCode}
              onChange={(e) => setLinkingCode(e.target.value.toUpperCase())}
              placeholder="Voer koppelcode in"
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-base sm:text-lg tracking-wider"
              disabled={loading}
            />
            <button
              onClick={handleSendCouplingRequest}
              disabled={loading || !linkingCode.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Bezig...' : 'Verzenden'}
            </button>
          </div>

          {linkingError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{linkingError}</p>
            </div>
          )}

          {linkingSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{linkingSuccess}</p>
            </div>
          )}
        </div>

        {pendingRequests.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Verzonden verzoeken</h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900">Wacht op goedkeuring...</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Verzonden op {new Date(request.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Annuleren
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Gekoppelde ouders</span>
          </h2>

          {partneredMembers.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600">
              Je bent nog niet gekoppeld met een co-ouder. Gebruik de koppelcode hierboven om te
              koppelen.
            </p>
          ) : (
            <div className="space-y-3">
              {partneredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{member.user.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 break-all">{member.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gekoppeld op {new Date(member.joined_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUncouple(member.user_id, member.user.name)}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <Unlink className="w-4 h-4" />
                    <span className="text-sm font-medium">Ontkoppelen</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
