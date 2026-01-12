import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ContactSupport() {
  const { user } = useAuth();

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
          <p className="text-gray-600 mb-8">
            Heeft u vragen of hulp nodig? We helpen u graag verder!
          </p>

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
                <p className="text-sm text-gray-500 mb-1">Algemene vragen</p>
                <a
                  href="mailto:info@co-ouderschap.nl"
                  className="text-blue-600 hover:underline font-medium"
                >
                  info@co-ouderschap.nl
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Technische Support</h3>
              <p className="text-gray-600 mb-4">
                Ondervindt u technische problemen? Neem contact op met ons technisch support team.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Technische vragen</p>
                <a
                  href="mailto:support@co-ouderschap.nl"
                  className="text-blue-600 hover:underline font-medium"
                >
                  support@co-ouderschap.nl
                </a>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy & Juridisch</h3>
              <p className="text-gray-600 mb-4">
                Vragen over privacy, gegevensbescherming of juridische zaken? We staan voor u klaar.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Privacy vragen</p>
                <a
                  href="mailto:privacy@co-ouderschap.nl"
                  className="text-blue-600 hover:underline font-medium"
                >
                  privacy@co-ouderschap.nl
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
                <p className="text-sm text-gray-500 mb-1">Feedback & ideeën</p>
                <a
                  href="mailto:feedback@co-ouderschap.nl"
                  className="text-blue-600 hover:underline font-medium"
                >
                  feedback@co-ouderschap.nl
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
                  ons <Link to="/privacybeleid" className="text-blue-600 hover:underline">Privacybeleid</Link>.
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
                  <Link to="/privacybeleid" className="text-blue-600 hover:underline">Privacybeleid</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Krijg geen antwoord op uw e-mail?
          </h2>
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
            Meer informatie: <Link to="/algemene-voorwaarden" className="text-blue-600 hover:underline">Algemene Voorwaarden</Link> | <Link to="/privacybeleid" className="text-blue-600 hover:underline">Privacybeleid</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
