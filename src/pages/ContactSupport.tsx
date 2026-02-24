import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  FileText,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SUPPORT_EMAIL = 'info@coparenting.nl';

const buildMailto = (subjectPrefix: string, body?: string) => {
  const params = new URLSearchParams();
  if (subjectPrefix) params.set('subject', subjectPrefix);
  if (body) params.set('body', body);
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
};

export function ContactSupport() {
  const { user } = useAuth();

  const quickBody =
    'Beschrijf je vraag zo concreet mogelijk.\n\n' +
    '• Platform: (Web / Android / iPhone)\n' +
    '• Apparaat + browser: (bijv. Chrome op Windows 11)\n' +
    '• Wat verwachtte je?\n' +
    '• Wat gebeurde er?\n' +
    '• Eventuele screenshots of foutmelding:\n';

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {user && (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar dashboard
          </Link>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact & Support</h1>
          <p className="text-gray-600 mb-6">
            Heeft u vragen of hulp nodig? Mail ons op{' '}
            <a
              className="text-blue-600 hover:underline font-medium"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
            . We reageren meestal binnen 24 uur op werkdagen.
          </p>

          {/* Quick actions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-8">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-700 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Snel een e-mail starten</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Kies een onderwerp — alles komt binnen op hetzelfde e-mailadres.
                </p>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={buildMailto('[ALGEMEEN] ', quickBody)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    Algemene vraag
                  </a>

                  <a
                    href={buildMailto('[TECH] ', quickBody)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Technisch probleem
                  </a>

                  <a
                    href={buildMailto('[PRIVACY] ')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Privacy / Juridisch
                  </a>

                  <a
                    href={buildMailto('[FEEDBACK] ')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm font-medium"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Feedback / Idee
                  </a>

                  <a
                    href={buildMailto('[URGENT] [TECH] ', quickBody)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Urgent (tech)
                  </a>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Tip: voeg bij technische issues je apparaat + browser toe en (indien mogelijk) een screenshot.
                </p>
              </div>
            </div>
          </div>

          {/* Cards (all same email, different subject helpers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">E-mail Support</h3>
              <p className="text-gray-600 mb-4">
                Stuur ons een e-mail met uw vraag of probleem. We streven ernaar binnen 24 uur te reageren.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <a
                  href={buildMailto('[ALGEMEEN] ', quickBody)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Technische Support</h3>
              <p className="text-gray-600 mb-4">
                Ondervindt u technische problemen? Vermeld uw apparaat, browser en (indien mogelijk) een screenshot.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <a
                  href={buildMailto('[TECH] ', quickBody)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy & Juridisch</h3>
              <p className="text-gray-600 mb-4">
                Vragen over privacy, gegevensbescherming of juridische zaken? Neem gerust contact op.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <a
                  href={buildMailto('[PRIVACY] ')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Feedback & Suggesties</h3>
              <p className="text-gray-600 mb-4">
                We waarderen uw feedback! Help ons het platform te verbeteren met uw ideeën.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <a
                  href={buildMailto('[FEEDBACK] ')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Veelgestelde Vragen</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Hoe kan ik mijn co-ouder uitnodigen?</h3>
                <p className="text-gray-600">
                  Ga naar het Dashboard en zoek naar het vak "Co-ouder uitnodigen". Deel de koppelcode
                  met uw co-ouder. Deze kan de code gebruiken bij het registreren om toegang te krijgen
                  tot het gezin.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Kan ik mijn gegevens verwijderen?</h3>
                <p className="text-gray-600">
                  Alle gegevens worden permanent opgeslagen voor dossierbeheer. U kunt wel uw account
                  deactiveren, waarna de gegevens niet meer toegankelijk zijn. Voor meer informatie, zie
                  ons{' '}
                  <Link to="/privacybeleid" className="text-blue-600 hover:underline">
                    Privacybeleid
                  </Link>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Hoe exporteer ik mijn gegevens?</h3>
                <p className="text-gray-600">
                  Ga naar Export in het menu. Daar kunt u een volledig overzicht downloaden van alle
                  gegevens in uw gezin.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Wat zijn de verschillen tussen de abonnementen?</h3>
                <p className="text-gray-600">
                  Ga naar Instellingen → Abonnement om een volledig overzicht te zien van de beschikbare
                  abonnementen en hun functies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Hoe voeg ik een hulpverlener toe?</h3>
                <p className="text-gray-600">
                  Ga naar Hulpverleners in het menu en klik op "Uitnodigen". U heeft de koppelcode nodig
                  die de hulpverlener bij registratie heeft ontvangen.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is mijn data veilig?</h3>
                <p className="text-gray-600">
                  Ja, we nemen beveiliging zeer serieus. Alle gegevens worden versleuteld opgeslagen en
                  verzonden. We gebruiken Row Level Security om ervoor te zorgen dat gebruikers alleen
                  toegang hebben tot hun eigen gegevens. Lees meer in ons{' '}
                  <Link to="/privacybeleid" className="text-blue-600 hover:underline">
                    Privacybeleid
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Krijg geen antwoord op uw e-mail?</h2>
          <p className="text-blue-800 text-sm mb-3">
            Controleer of uw e-mail correct is verzonden en kijk in uw spam-map. Wij streven ernaar
            binnen 24 uur te reageren op werkdagen.
          </p>
          <p className="text-blue-800 text-sm">
            Bij dringende technische problemen, vermeld dan in uw onderwerp [URGENT] zodat we uw
            bericht met prioriteit kunnen behandelen.
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Meer informatie:{' '}
            <Link to="/algemene-voorwaarden" className="text-blue-600 hover:underline">
              Algemene Voorwaarden
            </Link>{' '}
            |{' '}
            <Link to="/privacybeleid" className="text-blue-600 hover:underline">
              Privacybeleid
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}