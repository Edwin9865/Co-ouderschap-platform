import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Cookieverklaring() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-4 sm:p-8">
        {user && (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar dashboard
          </Link>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cookieverklaring</h1>
        <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: maart 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Wat zijn cookies?</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Cookies zijn kleine tekstbestanden die op uw apparaat (computer, tablet of smartphone) worden
              opgeslagen wanneer u onze website of app bezoekt. Ze helpen ons de website goed te laten
              functioneren en uw ervaring te verbeteren.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Deze cookieverklaring legt uit welke cookies wij gebruiken, waarvoor en hoe u uw voorkeuren
              kunt beheren. Voor meer informatie over hoe wij omgaan met uw persoonsgegevens, verwijzen
              wij naar ons <Link to="/privacybeleid" className="text-blue-600 hover:underline">Privacybeleid</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Welke cookies gebruiken wij?</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wij maken gebruik van de volgende categorieën cookies:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">2.1. Strikt noodzakelijke cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Deze cookies zijn essentieel voor de werking van het platform. Zonder deze cookies
              kunnen bepaalde onderdelen niet functioneren. Voor deze cookies is geen toestemming vereist.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Cookie</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Aanbieder</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Doel</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">sb-access-token</td>
                    <td className="p-3 border border-gray-200">Supabase</td>
                    <td className="p-3 border border-gray-200">Authenticatie en sessiebeheer</td>
                    <td className="p-3 border border-gray-200">Sessie / 1 uur</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">sb-refresh-token</td>
                    <td className="p-3 border border-gray-200">Supabase</td>
                    <td className="p-3 border border-gray-200">Vernieuwen van authenticatiesessie</td>
                    <td className="p-3 border border-gray-200">1 jaar</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">cookie_consent</td>
                    <td className="p-3 border border-gray-200">Co-Ouderschap</td>
                    <td className="p-3 border border-gray-200">Onthouden van uw cookie-voorkeuren</td>
                    <td className="p-3 border border-gray-200">1 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2. Analytische cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij gebruiken analytische cookies om te begrijpen hoe bezoekers onze website gebruiken.
              De informatie wordt geanonimiseerd verzameld en gebruikt om de website te verbeteren.
              Voor deze cookies vragen wij uw toestemming.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Cookie</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Aanbieder</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Doel</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">_ga</td>
                    <td className="p-3 border border-gray-200">Google Analytics</td>
                    <td className="p-3 border border-gray-200">Onderscheiden van gebruikers voor statistieken</td>
                    <td className="p-3 border border-gray-200">2 jaar</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">_gid</td>
                    <td className="p-3 border border-gray-200">Google Analytics</td>
                    <td className="p-3 border border-gray-200">Onderscheiden van gebruikers (korte termijn)</td>
                    <td className="p-3 border border-gray-200">24 uur</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">_ga_[ID]</td>
                    <td className="p-3 border border-gray-200">Google Analytics</td>
                    <td className="p-3 border border-gray-200">Bijhouden van sessiestatistieken</td>
                    <td className="p-3 border border-gray-200">2 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm mb-4">
              Google Analytics is geconfigureerd met IP-anonimisering. Gegevens worden niet gebruikt voor
              advertentiedoeleinden. Meer informatie: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Privacybeleid</a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3. Functionele cookies van derden</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij maken gebruik van externe diensten die cookies kunnen plaatsen voor het uitvoeren
              van hun functie. Voor deze cookies vragen wij uw toestemming waar vereist.
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Cookie</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Aanbieder</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Doel</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">__stripe_mid</td>
                    <td className="p-3 border border-gray-200">Stripe</td>
                    <td className="p-3 border border-gray-200">Fraudepreventie bij betalingen</td>
                    <td className="p-3 border border-gray-200">1 jaar</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">__stripe_sid</td>
                    <td className="p-3 border border-gray-200">Stripe</td>
                    <td className="p-3 border border-gray-200">Sessie-identificatie tijdens betaling</td>
                    <td className="p-3 border border-gray-200">30 minuten</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Firebase tokens</td>
                    <td className="p-3 border border-gray-200">Google Firebase</td>
                    <td className="p-3 border border-gray-200">Push notificaties (apparaatregistratie)</td>
                    <td className="p-3 border border-gray-200">Tot intrekking</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">
              Meer informatie over het cookiebeleid van Stripe: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com/privacy</a>.
              Voor Firebase: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">firebase.google.com/support/privacy</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. E-maildiensten</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij gebruiken de volgende e-maildiensten voor het versturen van berichten:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Zoho Mail</strong> — voor zakelijke e-mailcommunicatie en klantenservice</li>
              <li><strong>Zepto Mail</strong> — voor transactionele e-mails zoals bevestigingen, wachtwoord-resets en notificaties</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3 text-sm">
              Deze diensten plaatsen geen cookies op onze website. Zij verwerken alleen e-mailadressen
              voor het versturen van berichten die u heeft aangevraagd of waarvoor u toestemming heeft gegeven.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Google Search Console</h2>
            <p className="text-gray-700 leading-relaxed">
              Wij gebruiken Google Search Console voor het monitoren van de zoekmachineprestaties van
              onze website. Google Search Console plaatst zelf geen cookies bij bezoekers. Het verwerkt
              alleen geaggregeerde zoekdata die Google al heeft verzameld via de zoekmachine.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Uw toestemming beheren</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Bij uw eerste bezoek aan onze website wordt u gevraagd uw cookie-voorkeuren in te stellen
              via een cookiebanner. U kunt kiezen voor:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Alleen noodzakelijk:</strong> Alleen essentiële cookies worden geplaatst</li>
              <li><strong>Alle cookies accepteren:</strong> Inclusief analytische en functionele cookies</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-3">
              U kunt uw toestemming op elk moment intrekken of wijzigen door cookies te verwijderen
              via uw browserinstellingen en onze website opnieuw te bezoeken.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Let op: het uitschakelen van cookies kan de functionaliteit van het platform beperken.
              De strikt noodzakelijke cookies (inloggen, sessie) kunnen niet worden uitgeschakeld
              zolang u gebruikmaakt van het platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies verwijderen via uw browser</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              U kunt cookies beheren en verwijderen via de instellingen van uw browser:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Chrome:</strong> Instellingen → Privacy en beveiliging → Cookies en andere sitegegevens</li>
              <li><strong>Firefox:</strong> Instellingen → Privacy & Beveiliging → Cookies en sitegegevens</li>
              <li><strong>Safari:</strong> Voorkeuren → Privacy → Beheer websitegegevens</li>
              <li><strong>Edge:</strong> Instellingen → Cookies en sitemachtigingen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Wijzigingen in deze cookieverklaring</h2>
            <p className="text-gray-700 leading-relaxed">
              Wij kunnen deze cookieverklaring aanpassen bij wijzigingen in onze diensten of wetgeving.
              De meest recente versie is altijd beschikbaar op deze pagina. Bij ingrijpende wijzigingen
              informeren wij u via een melding op de website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Heeft u vragen over ons gebruik van cookies? Neem dan contact met ons op:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p className="mb-1"><strong>Co-Ouderschap</strong></p>
              <p className="mb-1 text-sm text-gray-500">Een dochteronderneming van JoyVentures</p>
              <p className="mb-1">Provincialeweg 163, 9865AG Opende</p>
              <p>E-mail: info@coparenting.nl</p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Deze cookieverklaring is opgesteld conform de vereisten van de Telecommunicatiewet en de
            Algemene Verordening Gegevensbescherming (AVG).
          </p>
        </div>
      </div>
    </div>
  );
}
