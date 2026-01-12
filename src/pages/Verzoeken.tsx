import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus } from 'lucide-react';
import type { Request, RequestProposal, User } from '../lib/types';

type RequestWithProposals = Request & {
  proposals: Array<RequestProposal & { proposer: User }>;
  creator?: User;
};

export function Verzoeken() {
  const { currentFamily, isParent, isHelper } = useFamily();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithProposals[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState<string | null>(null);
  const [showDeclineForm, setShowDeclineForm] = useState<string | null>(null);
  const [counterText, setCounterText] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const [formData, setFormData] = useState({
    type: 'other' as Request['type'],
    title: '',
    description: '',
  });

  useEffect(() => {
    if (!currentFamily) return;
    fetchRequests();
  }, [currentFamily]);

  const fetchRequests = async () => {
    if (!currentFamily) return;

    const { data } = await supabase
      .from('requests')
      .select('*, creator:users!requests_created_by_fkey(*)')
      .eq('family_id', currentFamily.id)
      .order('created_at', { ascending: false });

    if (data) {
      const requestsWithProposals = await Promise.all(
        data.map(async (req) => {
          const { data: proposals } = await supabase
            .from('request_proposals')
            .select('*, proposer:users!request_proposals_proposed_by_fkey(*)')
            .eq('request_id', req.id)
            .order('created_at', { ascending: true });

          return {
            ...req,
            proposals: (proposals || []) as Array<RequestProposal & { proposer: User }>,
          };
        })
      );

      setRequests(requestsWithProposals);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !user) return;

    setLoading(true);
    try {
      await supabase.from('requests').insert({
        family_id: currentFamily.id,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        created_by: user.id,
      });

      await fetchRequests();
      setShowCreate(false);
      setFormData({ type: 'other', title: '', description: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: Request['status']) => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('requests')
        .update({
          status: newStatus,
          last_action_by: user.id
        })
        .eq('id', requestId);

      await fetchRequests();
      setShowCounterForm(null);
      setShowDeclineForm(null);
      setCounterText('');
      setDeclineReason('');
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async (requestId: string) => {
    if (!counterText.trim() || !user) return;

    setLoading(true);
    try {
      await supabase.from('request_proposals').insert({
        request_id: requestId,
        proposed_by: user.id,
        proposal_text: counterText.trim(),
      });

      await supabase
        .from('requests')
        .update({
          status: 'COUNTERED',
          last_action_by: user.id
        })
        .eq('id', requestId);

      await fetchRequests();
      setShowCounterForm(null);
      setCounterText('');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (requestId: string) => {
    if (!declineReason.trim() || !user) return;

    setLoading(true);
    try {
      await supabase
        .from('requests')
        .update({
          status: 'DECLINED',
          decline_reason: declineReason.trim(),
          last_action_by: user.id
        })
        .eq('id', requestId);

      await fetchRequests();
      setShowDeclineForm(null);
      setDeclineReason('');
    } finally {
      setLoading(false);
    }
  };

  const typeLabels: Record<Request['type'], string> = {
    schedule_change: 'Wijziging planning',
    financial: 'Financieel',
    medical_decision: 'Medische beslissing',
    education: 'Onderwijs',
    vacation: 'Vakantie',
    other: 'Anders',
  };

  const statusLabels: Record<Request['status'], string> = {
    OPEN: 'Open',
    ACCEPTED: 'Geaccepteerd',
    DECLINED: 'Afgewezen',
    COUNTERED: 'Tegenvoorstel',
    CLOSED: 'Gesloten',
  };

  const statusColors: Record<Request['status'], string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-800',
    COUNTERED: 'bg-amber-100 text-amber-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  if (!isParent && !isHelper) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Geen toegang tot verzoeken</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Verzoeken</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {isHelper
              ? 'Overzicht van verzoeken tussen ouders'
              : 'Gestructureerde communicatie tussen ouders'
            }
          </p>
        </div>
        {!showCreate && isParent && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuw verzoek</span>
          </button>
        )}
      </div>


      {showCreate && isParent && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Nieuw verzoek aanmaken</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type verzoek</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as Request['type'] })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
                placeholder="Korte omschrijving van het verzoek"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Omschrijving</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                rows={4}
                maxLength={2000}
                placeholder="Geef een gedetailleerde uitleg van je verzoek..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? 'Bezig...' : 'Aanmaken'}
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

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nog geen verzoeken aangemaakt</div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                        {typeLabels[request.type]}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${statusColors[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Aangemaakt door {request.creator?.name || 'Onbekend'} op {new Date(request.created_at).toLocaleString('nl-NL')}
                    </div>
                    {request.description && (
                      <div className="mt-2 text-gray-700 whitespace-pre-wrap">
                        {request.description}
                      </div>
                    )}
                  </div>
                </div>

                {request.status === 'DECLINED' && request.decline_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-1">Reden van afwijzing:</p>
                    <p className="text-sm text-red-800 whitespace-pre-wrap">{request.decline_reason}</p>
                  </div>
                )}

                {request.proposals.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-900">Tegenvoorstellen:</p>
                    {request.proposals.map((proposal, index) => (
                      <div key={proposal.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-amber-900">
                            #{index + 1} door {proposal.proposer.name}
                          </span>
                          <span className="text-xs text-amber-700">
                            {new Date(proposal.created_at).toLocaleString('nl-NL')}
                          </span>
                        </div>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{proposal.proposal_text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(request.status === 'OPEN' || request.status === 'COUNTERED') && isParent && (
                  <>
                    {request.last_action_by === user?.id ? (
                      <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          In behandeling bij co-ouder
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {showDeclineForm === request.id ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Reden van afwijzing
                            </label>
                            <textarea
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                              rows={3}
                              placeholder="Leg uit waarom je dit verzoek afwijst..."
                              maxLength={500}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDecline(request.id)}
                                disabled={loading || !declineReason.trim()}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Bevestig afwijzing
                              </button>
                              <button
                                onClick={() => {
                                  setShowDeclineForm(null);
                                  setDeclineReason('');
                                }}
                                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                              >
                                Annuleren
                              </button>
                            </div>
                          </div>
                        ) : showCounterForm === request.id ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Tegenvoorstel
                            </label>
                            <textarea
                              value={counterText}
                              onChange={(e) => setCounterText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                              rows={3}
                              placeholder="Beschrijf je tegenvoorstel..."
                              maxLength={500}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCounter(request.id)}
                                disabled={loading || !counterText.trim()}
                                className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                              >
                                Verstuur tegenvoorstel
                              </button>
                              <button
                                onClick={() => {
                                  setShowCounterForm(null);
                                  setCounterText('');
                                }}
                                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                              >
                                Annuleren
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'ACCEPTED')}
                              disabled={loading}
                              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                            >
                              Accepteren
                            </button>
                            <button
                              onClick={() => {
                                setShowDeclineForm(request.id);
                                setDeclineReason('');
                              }}
                              disabled={loading}
                              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              Afwijzen
                            </button>
                            <button
                              onClick={() => {
                                setShowCounterForm(request.id);
                                setCounterText('');
                              }}
                              disabled={loading}
                              className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-50"
                            >
                              Tegenvoorstel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
