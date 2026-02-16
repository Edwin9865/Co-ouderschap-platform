// src/pages/Export.tsx
// DEBUG: Export.tsx - Full rewrite (invoke Edge Function, JSON {html}) - 2026-02-16

import { useState, useRef, useCallback } from "react";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { Download, Lock, FileText, AlertCircle, X, Printer } from "lucide-react";
import { isNative } from "../lib/capacitor";
import { supabase } from "../lib/supabase";

type ExportType = "full" | "child" | "date_range";

export function Export() {
  const { currentFamily, children, canAccessFeature, subscription } = useFamily();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exportType, setExportType] = useState<ExportType>("full");
  const [selectedChild, setSelectedChild] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD

  const [exportHtml, setExportHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const canExport = canAccessFeature("export");

  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) iframe.contentWindow.print();
  }, []);

  const handleClosePreview = useCallback(() => {
    setExportHtml(null);
  }, []);

  const handleExport = useCallback(async () => {
    if (!canExport) {
      alert("Upgrade naar PLUS of PRO om exports te maken");
      return;
    }

    if (!currentFamily) {
      setError("Geen familie geselecteerd");
      return;
    }

    if (exportType === "child" && !selectedChild) {
      setError("Selecteer een kind voor deze export");
      return;
    }

    if (exportType === "date_range" && (!startDate || !endDate)) {
      setError("Selecteer een start- en einddatum");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sessiestatus check (invoke werkt meestal ook zonder, maar dit geeft betere fouten)
      const { data: sessData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      if (!sessData.session) {
        throw new Error("Geen geldige sessie. Log opnieuw in.");
      }

      const payload = {
        familyId: currentFamily.id,
        exportType,
        childId: exportType === "child" ? selectedChild : undefined,
        startDate: exportType === "date_range" ? startDate : undefined,
        endDate: exportType === "date_range" ? endDate : undefined,
      };

      // ✅ Belangrijk: gebruik supabase.functions.invoke -> zet Authorization + apikey correct
      const { data, error: fnError } = await supabase.functions.invoke("generate-export", {
        body: payload,
      });

      if (fnError) {
        // Supabase geeft hier vaak al een duidelijke message, incl. 401/403/500
        throw new Error(fnError.message || "Export mislukt (Edge Function)");
      }

      const html = (data as any)?.html;
      if (!html || typeof html !== "string") {
        throw new Error("Export response is leeg of ongeldig.");
      }

      if (isNative()) {
        // Mobiel: overlay preview met print-knop
        setExportHtml(html);
      } else {
        // Web: nieuwe tab met HTML (print/save as PDF)
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error("Pop-up geblokkeerd. Sta pop-ups toe om de export te bekijken.");
        }
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (err: any) {
      setError(err?.message || "Er is een fout opgetreden bij het exporteren");
    } finally {
      setLoading(false);
    }
  }, [canExport, currentFamily, exportType, selectedChild, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Export</h1>
        <p className="mt-2 text-gray-600">Exporteer je dossier naar PDF voor archivering of delen met derden</p>
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
                Export functionaliteit is beschikbaar vanaf het PLUS plan. Upgrade om volledige PDF exports te maken van je dossier.
              </p>
              <div className="text-sm text-amber-900">
                <strong>Huidig plan:</strong> {subscription?.plan || "FREE"}
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
                  checked={exportType === "full"}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-900">Volledig dossier</div>
                  <div className="text-sm text-gray-600">Alle gegevens van dit gezin, inclusief alle kinderen</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="child"
                  checked={exportType === "child"}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-900">Per kind</div>
                  <div className="text-sm text-gray-600">Alleen gegevens van een specifiek kind</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="date_range"
                  checked={exportType === "date_range"}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-gray-900">Datumbereik</div>
                  <div className="text-sm text-gray-600">Alle gegevens binnen een bepaalde periode</div>
                </div>
              </label>
            </div>
          </div>

          {exportType === "child" && (
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

          {exportType === "date_range" && (
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
            <span>{loading ? "Bezig met exporteren..." : isNative() ? "Export bekijken" : "PDF genereren"}</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Over exports</h3>
            <p className="text-sm text-blue-800">
              Exports bevatten alle opgeslagen gegevens, inclusief verwijderde items, bewerkingsgeschiedenis en volledige communicatie.
              Deze PDF's zijn geschikt voor juridisch gebruik en archivering.
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

      {exportHtml && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
            <button onClick={handleClosePreview} className="flex items-center space-x-2 text-white hover:text-gray-300">
              <X className="w-5 h-5" />
              <span>Sluiten</span>
            </button>
            <h2 className="text-lg font-semibold">Export voorbeeld</h2>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-white text-slate-800 px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <Printer className="w-4 h-4" />
              <span>PDF opslaan</span>
            </button>
          </div>

          <iframe ref={iframeRef} srcDoc={exportHtml} className="flex-1 w-full border-0" title="Export preview" />
        </div>
      )}
    </div>
  );
}
