import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { isNative } from '../lib/capacitor';

// Vul hier uw Google Analytics Measurement ID in (bijv. "G-XXXXXXXXXX")
const GA_MEASUREMENT_ID = 'G-K2VC32VM81';

type ConsentChoice = 'all' | 'necessary' | null;

function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return;
  if (document.getElementById('ga-script')) return;

  const script1 = document.createElement('script');
  script1.id = 'ga-script';
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
  `;
  document.head.appendChild(script2);
}

function removeGoogleAnalytics() {
  const s1 = document.getElementById('ga-script');
  if (s1) s1.remove();
  // Verwijder GA cookies
  const cookies = ['_ga', '_gid'];
  cookies.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
  });
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Niet tonen in native app
    if (isNative()) return;

    const saved = localStorage.getItem('cookie_consent') as ConsentChoice;
    if (!saved) {
      // Kleine vertraging zodat de pagina eerst laadt
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    // Herstel vorige keuze
    if (saved === 'all') loadGoogleAnalytics();
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', 'all');
    loadGoogleAnalytics();
    setVisible(false);
  };

  const handleNecessaryOnly = () => {
    localStorage.setItem('cookie_consent', 'necessary');
    removeGoogleAnalytics();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍪</span>
            <h2 className="text-base font-semibold text-gray-900">Cookievoorkeuren</h2>
          </div>
          <button
            onClick={handleNecessaryOnly}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Sluit en accepteer alleen noodzakelijke cookies"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Wij gebruiken cookies om het platform goed te laten werken en, met uw toestemming,
            om bezoekersstatistieken bij te houden via Google Analytics.{' '}
            <Link to="/cookieverklaring" className="text-blue-600 hover:underline">
              Meer informatie
            </Link>
          </p>

          {showDetails && (
            <div className="mb-4 space-y-3 text-sm bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Strikt noodzakelijk</p>
                  <p className="text-gray-500 text-xs">Authenticatie (Supabase), sessie, cookie-voorkeur. Altijd actief.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-4 h-4 rounded border-2 border-gray-300 bg-white flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Analytisch — Google Analytics</p>
                  <p className="text-gray-500 text-xs">Geanonimiseerde statistieken over bezoekersgedrag. Alleen met uw toestemming.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Functioneel — Stripe &amp; Firebase</p>
                  <p className="text-gray-500 text-xs">Noodzakelijk voor betalingen en pushmeldingen. Actief bij gebruik van deze functies.</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 underline mb-4 block"
          >
            {showDetails ? 'Minder details' : 'Meer details tonen'}
          </button>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={handleNecessaryOnly}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Alleen noodzakelijk
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Alles accepteren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exporteer helper zodat andere onderdelen kunnen checken of analytics toegestaan is
export function hasAnalyticsConsent(): boolean {
  return localStorage.getItem('cookie_consent') === 'all';
}
