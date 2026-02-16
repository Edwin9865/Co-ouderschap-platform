import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ChevronDown, ChevronUp, User, Calendar, FileText } from 'lucide-react';
import type { LogEntry, LogEntryRevision } from '../lib/types';

interface LogHistoryViewerProps {
  entry: LogEntry;
  onClose: () => void;
}

interface RevisionWithUser extends LogEntryRevision {
  editor_name: string;
  creator_name?: string;
}

interface ParsedPreviousData {
  category?: string;
  title?: string;
  details?: string | null;
  occurred_at?: string;
  child_id?: string | null;
  created_by?: string;
  created_at?: string;
}

export function LogHistoryViewer({ entry, onClose }: LogHistoryViewerProps) {
  const [revisions, setRevisions] = useState<RevisionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>('Onbekend');

  const categoryLabels: Record<string, string> = {
    health: 'Gezondheid',
    behavior: 'Gedrag',
    development: 'Ontwikkeling',
    incident: 'Incident',
    achievement: 'Prestatie',
    communication: 'Communicatie',
    other: 'Anders',
  };

  useEffect(() => {
    loadHistory();
  }, [entry.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: revisionsData } = await supabase
        .from('log_entry_revisions')
        .select('*')
        .eq('log_entry_id', entry.id)
        .order('edited_at', { ascending: false });

      if (!revisionsData) {
        setRevisions([]);
        setLoading(false);
        return;
      }

      const revisionsWithUsers = await Promise.all(
        revisionsData.map(async (revision) => {
          const { data: editor } = await supabase
            .from('users')
            .select('name')
            .eq('id', revision.edited_by)
            .maybeSingle();

          return {
            ...revision,
            editor_name: editor?.name || 'Onbekend',
          };
        })
      );

      const { data: creator } = await supabase
        .from('users')
        .select('name')
        .eq('id', entry.created_by)
        .maybeSingle();

      setCreatorName(creator?.name || 'Onbekend');
      setRevisions(revisionsWithUsers);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChanges = (previousData: ParsedPreviousData, currentData: LogEntry) => {
    const changes: Array<{
      field: string;
      label: string;
      before: string;
      after: string;
    }> = [];

    if (previousData.title !== currentData.title) {
      changes.push({
        field: 'title',
        label: 'Titel',
        before: previousData.title || '',
        after: currentData.title,
      });
    }

    if (previousData.details !== currentData.details) {
      changes.push({
        field: 'details',
        label: 'Details',
        before: previousData.details || '(geen)',
        after: currentData.details || '(geen)',
      });
    }

    if (previousData.category !== currentData.category) {
      changes.push({
        field: 'category',
        label: 'Categorie',
        before: categoryLabels[previousData.category || ''] || previousData.category || '',
        after: categoryLabels[currentData.category] || currentData.category,
      });
    }

    if (previousData.occurred_at !== currentData.occurred_at) {
      changes.push({
        field: 'occurred_at',
        label: 'Datum/tijd',
        before: formatDate(previousData.occurred_at || ''),
        after: formatDate(currentData.occurred_at),
      });
    }

    if (previousData.child_id !== currentData.child_id) {
      changes.push({
        field: 'child_id',
        label: 'Kind',
        before: previousData.child_id || '(geen)',
        after: currentData.child_id || '(geen)',
      });
    }

    return changes;
  };

  const toggleExpand = (revisionId: string) => {
    setExpandedRevision(expandedRevision === revisionId ? null : revisionId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bewerkingsgeschiedenis</h2>
            <p className="text-sm text-gray-600 mt-1">{entry.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
              <p className="mt-2 text-gray-600">Geschiedenis laden...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Huidige versie</span>
                      <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
                        Actief
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Aangemaakt:</span>
                        <p className="text-gray-900">{formatDate(entry.created_at)}</p>
                        <p className="text-gray-600">door {creatorName}</p>
                      </div>
                      {entry.updated_at !== entry.created_at && (
                        <div>
                          <span className="font-medium text-gray-700">Laatst bewerkt:</span>
                          <p className="text-gray-900">{formatDate(entry.updated_at)}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-3 bg-white rounded border border-green-100">
                      <p className="text-sm">
                        <span className="font-medium">Categorie:</span>{' '}
                        {categoryLabels[entry.category]}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Titel:</span> {entry.title}
                      </p>
                      {entry.details && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Details:</span>
                          <br />
                          {entry.details}
                        </p>
                      )}
                      <p className="text-sm mt-2">
                        <span className="font-medium">Gebeurtenis datum:</span>{' '}
                        {formatDate(entry.occurred_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {revisions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Geen bewerkingsgeschiedenis beschikbaar</p>
                  <p className="text-sm mt-1">Dit item is nog nooit bewerkt</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Eerdere versies ({revisions.length})
                  </h3>

                  {revisions.map((revision, index) => {
                    const previousData = revision.previous_data as ParsedPreviousData;
                    const currentVersion = index === 0 ? entry : (revisions[index - 1].previous_data as ParsedPreviousData);
                    const changes = getChanges(previousData, index === 0 ? entry : currentVersion as any);
                    const isExpanded = expandedRevision === revision.id;

                    return (
                      <div
                        key={revision.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpand(revision.id)}
                          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-gray-600" />
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-900">
                                Bewerkt door {revision.editor_name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatDate(revision.edited_at)} • {changes.length} wijziging
                                {changes.length !== 1 ? 'en' : ''}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 bg-white">
                            {changes.length === 0 ? (
                              <p className="text-sm text-gray-500 italic">
                                Geen significante wijzigingen gedetecteerd
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {changes.map((change, changeIndex) => (
                                  <div key={changeIndex} className="border-l-4 border-blue-500 pl-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                      {change.label}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-red-50 border border-red-200 rounded p-3">
                                        <p className="text-xs font-medium text-red-800 mb-1">
                                          Vorige versie
                                        </p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                          {change.before}
                                        </p>
                                      </div>
                                      <div className="bg-green-50 border border-green-200 rounded p-3">
                                        <p className="text-xs font-medium text-green-800 mb-1">
                                          Nieuwe versie
                                        </p>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                          {change.after}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <details className="mt-4">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                Toon volledige vorige versie
                              </summary>
                              <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                                <p>
                                  <span className="font-medium">Categorie:</span>{' '}
                                  {categoryLabels[previousData.category || ''] || previousData.category}
                                </p>
                                <p>
                                  <span className="font-medium">Titel:</span> {previousData.title}
                                </p>
                                {previousData.details && (
                                  <p className="mt-1">
                                    <span className="font-medium">Details:</span>
                                    <br />
                                    {previousData.details}
                                  </p>
                                )}
                                <p className="mt-1">
                                  <span className="font-medium">Gebeurtenis datum:</span>{' '}
                                  {previousData.occurred_at ? formatDate(previousData.occurred_at) : 'Onbekend'}
                                </p>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
