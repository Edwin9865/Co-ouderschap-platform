import { useState } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { useAuth } from '../contexts/AuthContext';
import { Download, Lock, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2pdf from 'html2pdf.js';

export function Export() {
  const { currentFamily, children, canAccessFeature, subscription } = useFamily();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportType, setExportType] = useState<'full' | 'child' | 'date_range'>('full');
  const [selectedChild, setSelectedChild] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const canExport = canAccessFeature('export');

  const generateAndSharePDF = async (html: string) => {
    try {
      console.log('Generating PDF from HTML, length:', html.length);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Kon iframe document niet openen');
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const iframeBody = iframeDoc.body;
      console.log('Iframe body text length:', iframeBody?.textContent?.length || 0);

      if (!iframeBody || !iframeBody.textContent || iframeBody.textContent.length === 0) {
        throw new Error('HTML content is leeg');
      }

      const opt = {
        margin: [10, 10],
        filename: `coparenting-export-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          windowHeight: 1123
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      console.log('Starting PDF generation...');
      const pdfBlob = await html2pdf().set(opt).from(iframeBody).outputPdf('blob');
      console.log('PDF generated, size:', pdfBlob.size);

      document.body.removeChild(iframe);

      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      await new Promise<void>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string;
            const base64String = base64Data.split(',')[1];

            const fileName = `coparenting-export-${new Date().toISOString().split('T')[0]}.pdf`;

            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64String,
              directory: Directory.Cache,
            });

            console.log('PDF opgeslagen:', savedFile);

            await Share.share({
              title: 'Co-Parenting Export',
              text: 'Jouw co-parenting dossier export',
              url: savedFile.uri,
              dialogTitle: 'Deel PDF'
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });

    } catch (error) {
      console.error('PDF generatie fout:', error);
      throw new Error('Kon PDF niet genereren. Probeer het opnieuw.');
    }
  };

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
    setSuccess(null);

    try {
      console.log('Starting export with:', {
        familyId: currentFamily.id,
        exportType,
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
      });

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-export`;

      if (!session?.access_token) {
        throw new Error('Geen geldige sessie. Log opnieuw in.');
      }

      console.log('Calling edge function:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyId: currentFamily.id,
          exportType,
          childId: selectedChild || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Export mislukt';

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            errorMessage = errorData.error || errorMessage;
            if (errorData.details) {
              errorMessage += ` (${errorData.details})`;
            }
          } catch (e) {
            console.error('Failed to parse error JSON:', e);
            const text = await response.text();
            console.error('Error response text:', text);
            errorMessage = text || errorMessage;
          }
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          errorMessage = text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const html = await response.text();
      console.log('Received HTML, length:', html.length);

      if (Capacitor.isNativePlatform()) {
        await generateAndSharePDF(html);
        setSuccess('PDF succesvol gegenereerd en gedeeld!');
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          setSuccess('Export geopend in nieuwe tab. Gebruik de print knop in de PDF om deze op te slaan.');
        } else {
          throw new Error('Pop-up geblokkeerd. Sta pop-ups toe om de export te bekijken.');
        }
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Er is een fout opgetreden bij het exporteren');
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Export succesvol</h3>
              <p className="text-sm text-green-800">{success}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer kind
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tot datum
                </label>
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
            <span>{loading ? 'Bezig met exporteren...' : 'PDF genereren'}</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Over exports</h3>
            <p className="text-sm text-blue-800">
              Exports bevatten alle opgeslagen gegevens, inclusief verwijderde items,
              bewerkingsgeschiedenis en volledige communicatie. Deze PDF's zijn geschikt voor
              juridisch gebruik en archivering.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Export overzicht</h3>
        <p className="text-sm text-gray-600 mb-4">
          Exports bevatten de volgende gegevens:
        </p>
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
