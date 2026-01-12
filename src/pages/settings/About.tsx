import { Info, FileText, Shield, Mail } from 'lucide-react';

const APP_VERSION = '1.0.0';

export function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Over de app</h1>
        <p className="text-gray-600">Informatie over de applicatie en juridische documenten</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-100">
            <Info className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Co-Parenting App</h2>
            <p className="text-sm text-gray-600">Versie {APP_VERSION}</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Deze applicatie helpt co-ouders om samen hun kinderen op te voeden door het delen van
          agenda's, logboeken, verzoeken en communicatie met hulpverleners. Alle gegevens worden
          veilig opgeslagen en kunnen worden geëxporteerd voor dossierbeheer.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
          <button
            onClick={() => window.open('/algemene-voorwaarden', '_blank')}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Algemene Voorwaarden</h3>
                <p className="text-sm text-gray-600">
                  Lees de algemene voorwaarden voor het gebruik van deze applicatie
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-green-300 transition-colors">
          <button
            onClick={() => window.open('/privacybeleid', '_blank')}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Privacybeleid</h3>
                <p className="text-sm text-gray-600">
                  Ontdek hoe we je gegevens beschermen en verwerken
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 transition-colors">
          <button
            onClick={() => window.location.href = 'mailto:support@coparenting-app.nl'}
            className="w-full p-6 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Contact & Support</h3>
                <p className="text-sm text-gray-600">
                  Neem contact met ons op voor vragen of ondersteuning
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Belangrijke informatie</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Alle gegevens worden permanent opgeslagen en kunnen niet definitief worden verwijderd
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Gegevens zijn exporteerbaar voor dossierbeheer en juridische doeleinden
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Push notificaties kunnen worden uitgeschakeld in de instellingen
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Hulpverleners hebben alleen toegang tot gezinnen waarvoor ze zijn uitgenodigd
            </span>
          </li>
        </ul>
      </div>

      <div className="text-center text-sm text-gray-500 pt-4">
        <p>&copy; {new Date().getFullYear()} Co-Parenting App. Alle rechten voorbehouden.</p>
      </div>
    </div>
  );
}
