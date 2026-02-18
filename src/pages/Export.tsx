// DEBUG: Export.tsx - Rewritten from scratch - 2026-02-13
// Mobile: generates PDF (base64) -> saves to Documents -> opens share sheet
// Web: opens in new window

import { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { Download, Lock, FileText, AlertCircle } from 'lucide-react';
import { isNative } from '../lib/capacitor';
import { supabase } from '../lib/supabase';

import { PdfGenerator } from '@capgo/capacitor-pdf-generator';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function safeFileName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-_ ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function stripDataUrlPrefix(base64: string) {
  const idx = base64.indexOf('base64,');
  return idx >= 0 ? base64.slice(idx + 'base64,'.length) : base64;
}

export function Export() {
  const { currentFamily, children, canAccessFeature, subscription } = useFamily();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exportType, setExportType] = useState<'full' | 'child' | 'date_range'>('full');
  const [selectedChild, setSelectedChild] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const canExport = canAccessFeature('export');

  const handleExport = async () => {
    if (!canExport) {
      alert('Upgrade naar PLUS of PRO om exports te maken');
      return;
    }

    if (!currentFamily) {
      setError('Geen familie geselecteerd');
      return;
    }

    if (exportType === 'child' && !selectedChild) {
      setError('Selecteer een kind voor deze export');
      return;
    }

    if (exportType === 'date_range' && (!startDate || !endDate)) {
      setError('Selecteer een start- en einddatum');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Refresh session to ensure we have a valid token
      console.log('Refreshing session before export...');
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        throw new Error('Sessie verlopen. Ververs de pagina en probeer opnieuw.');
      }

      if (!refreshedSession?.access_token) {
        throw new Error('Geen geldige sessie. Log opnieuw in.');
      }

      console.log('Export request:', {
        familyId: currentFamily.id,
        exportType,
        childId: selectedChild,
        startDate,
        endDate,
        hasAccessToken: !!refreshedSession.access_token,
        tokenExpiry: refreshedSession.expires_at
          ? new Date(refreshedSession.expires_at * 1000).toISOString()
          : 'unknown',
      });

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-export`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshedSession.access_token}`,
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          familyId: currentFamily.id,
          exportType,
          childId: selectedChild || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Export mislukt';

        if (response.status === 401) {
          console.error('401 Unauthorized error - Token details:', {
            hasToken: !!refreshedSession?.access_token,
            tokenLength: refreshedSession?.access_token?.length || 0,
            expiresAt: refreshedSession?.expires_at,
            familyId: currentFamily.id,
          });
          errorMessage = 'Authenticatie mislukt. Ververs de pagina en probeer opnieuw.';
        } else if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) errorMessage += ` (${errorData.details})`;
          } catch {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const html = await response.text();

      // ✅ MOBILE / NATIVE: HTML -> PDF (base64) -> save -> share
      if (isNative()) {
        console.log('Generating PDF for mobile (Android/iOS) via PdfGenerator.fromData...');

        const famName = safeFileName(currentFamily.name || 'familie');
        const fileName = `export-${famName}-${todayYmd()}.pdf`;

        // 1) HTML -> PDF base64 (ANDROID SAFE)
        const pdfResult = await PdfGenerator.fromData({
          data: html, // ✅ HTML string
          documentSize: 'A4',
          orientation: 'portrait',
          type: 'base64',
          fileName,
        });

        if (!pdfResult || pdfResult.type !== 'base64' || !pdfResult.base64) {
          throw new Error('PDF generatie mislukt (geen base64 ontvangen).');
        }

        const base64 = stripDataUrlPrefix(pdfResult.base64);

        // 2) Save locally
        let writeRes;
try {
  writeRes = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });
} catch {
  writeRes = await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
}

        // 3) Share sheet (mail/whatsapp/drive/print etc.)
        await Share.share({
          title: 'CoParenting Export',
          text: `Export opgeslagen als ${fileName}`,
          url: writeRes.uri,
          dialogTitle: 'Deel je export',
        });

        return;
      }

      // ✅ DESKTOP / WEB: oude gedrag (preview in nieuw venster)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        throw new Error('Pop-up geblokkeerd. Sta pop-ups toe om de export te bekijken.');
      }
    } catch (err: any) {
      setError(err?.message || 'Er is een fout opgetreden bij het exporteren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Export</h1>
        <p className="mt-2 text-gray-600">
          Exporteer je dossier naar PDF voor archivering of delen met derden
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Fout bij exporteren</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!canExport && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Upgrade vereist</h3>
              <p className="text-sm text-amber-800 mb-3">
                Export functionaliteit is beschikbaar vanaf het PLUS plan. Upgrade om volledige PDF
                exports te maken van je dossier.
              </p>
              <div className="text-sm text-amber-900">
                <strong>Huidig plan:</strong> {subscription?.plan || 'FREE'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export configureren</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export type</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="full"
                  checked={exportType === 'full'}
                  onChange={(e) => setExportType(e.target.value as 'full')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-900">Volledig dossier</div>
                  <div className="text-sm text-gray-600">
                    Alle gegevens van dit gezin, inclusief alle kinderen
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="child"
                  checked={exportType === 'child'}
                  onChange={(e) => setExportType(e.target.value as 'child')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-900">Per kind</div>
                  <div className="text-sm text-gray-600">
                    Alleen gegevens van een specifiek kind
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="date_range"
                  checked={exportType === 'date_range'}
                  onChange={(e) => setExportType(e.target.value as 'date_range')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-900">Datumbereik</div>
                  <div className="text-sm text-gray-600">
                    Alle gegevens binnen een bepaalde periode
                  </div>
                </div>
              </label>
            </div>
          </div>

          {exportType === 'child' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecteer kind</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">Kies een kind</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportType === 'date_range' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Van datum</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tot datum</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={loading || !canExport}
            className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>
              {loading
                ? 'Bezig met exporteren...'
                : isNative()
                  ? 'PDF opslaan (mobiel)'
                  : 'PDF genereren (desktop)'}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Over exports</h3>
            <p className="text-sm text-blue-800 mb-2">
              Exports bevatten alle opgeslagen gegevens, inclusief verwijderde items,
              bewerkingsgeschiedenis en volledige communicatie. Deze PDF&apos;s zijn geschikt voor
              juridisch gebruik en archivering.
            </p>
            <p className="text-sm text-blue-800 font-medium">
              ⏱️ Tijdsperiode filtering: U ziet alleen gegevens uit de periode waarin u toegang had
              tot het betreffende kind. Gegevens die na ontkoppeling zijn toegevoegd, worden niet
              getoond.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Export overzicht</h3>
        <p className="text-sm text-gray-600 mb-4">Exports bevatten de volgende gegevens:</p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-slate-600 rounded-full mt-1.5 mr-3"></span>
            <span>Alle kinderen en hun basisgegevens</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-slate-600 rounded-full mt-1.5 mr-3"></span>
            <span>Complete agenda met alle afspraken</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-slate-600 rounded-full mt-1.5 mr-3"></span>
            <span>Volledig logboek inclusief bewerkingsgeschiedenis</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-slate-600 rounded-full mt-1.5 mr-3"></span>
            <span>Alle verzoeken met complete berichtgeschiedenis</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-slate-600 rounded-full mt-1.5 mr-3"></span>
            <span>Vragen en antwoorden van hulpverleners</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-slate-600 rounded-full mt-1.5 mr-3"></span>
            <span>Audit trail van alle wijzigingen</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
