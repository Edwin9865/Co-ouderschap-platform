import { useNavigate } from 'react-router-dom';
import { Info, FileText, Shield, Mail, AlertTriangle, Cookie } from 'lucide-react';

export function About() {
  const navigate = useNavigate();

  const legalLinks = [
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-100',
      border: 'hover:border-blue-300',
      title: 'Algemene Voorwaarden',
      description: 'De gebruiksvoorwaarden die van toepassing zijn op het Co-Ouderschap platform',
      path: '/algemene-voorwaarden',
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      bg: 'bg-green-100',
      border: 'hover:border-green-300',
      title: 'Privacybeleid',
      description: 'Hoe wij uw persoonsgegevens verwerken en beschermen conform de AVG',
      path: '/privacybeleid',
    },
    {
      icon: <Cookie className="w-6 h-6 text-orange-600" />,
      bg: 'bg-orange-100',
      border: 'hover:border-orange-300',
      title: 'Cookieverklaring',
      description: 'Welke cookies wij gebruiken en hoe u uw voorkeuren kunt beheren',
      path: '/cookieverklaring',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      bg: 'bg-yellow-100',
      border: 'hover:border-yellow-300',
      title: 'Disclaimer',
      description: 'Aansprakelijkheidsinformatie en beperkingen van het platform',
      path: '/disclaimer',
    },
    {
      icon: <Mail className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-100',
      border: 'hover:border-purple-300',
      title: 'Contact & Support',
      description: 'Neem contact op met ons team voor vragen of technische ondersteuning',
      path: '/contact',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Over de app</h1>
        <p className="text-gray-600">Informatie over de applicatie en juridische documenten</p>
      </div>

      {/* App info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-100">
            <Info className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Co-Ouderschap Platform</h2>
            <p className="text-sm text-gray-500">
              Versie {__APP_VERSION__} &nbsp;·&nbsp; Een product van{' '}
              <span className="font-medium text-gray-700">JoyVentures</span>
            </p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Het Co-Ouderschap platform helpt gescheiden ouders om gestructureerd samen te werken aan
          de opvoeding van hun kinderen. Via agenda's, logboeken, verzoeken en gedeelde communicatie
          met hulpverleners kunnen alle betrokkenen op één plek samenwerken. Gegevens worden veilig
          opgeslagen in Nederland en zijn exporteerbaar voor dossierbeheer en juridische doeleinden.
        </p>
      </div>

      {/* Legal links */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Juridische documenten</h2>
        {legalLinks.map((item) => (
          <div
            key={item.path}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 ${item.border} transition-colors`}
          >
            <button onClick={() => navigate(item.path)} className="w-full p-5 text-left">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${item.bg} shrink-0`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Important info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Belangrijke informatie</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Gegevens worden veilig opgeslagen op servers in de EU en verwerkt conform de AVG
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
              Het platform vervangt geen juridisch, psychologisch of medisch advies
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Hulpverleners hebben alleen toegang tot gezinnen waarvoor zij expliciet zijn uitgenodigd
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              Push notificaties kunnen worden beheerd via uw apparaatinstellingen
            </span>
          </li>
        </ul>
      </div>
      </div>
  );
}
