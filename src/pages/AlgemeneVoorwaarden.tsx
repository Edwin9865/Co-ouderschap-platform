import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AlgemeneVoorwaarden() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        {user && (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar dashboard
          </Link>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Algemene Voorwaarden</h1>
        <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: januari 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Definities</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In deze algemene voorwaarden wordt verstaan onder:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Platform:</strong> De Co-Ouderschap applicatie, beschikbaar via web en mobiele app</li>
              <li><strong>Gebruiker:</strong> Elke natuurlijke persoon die gebruik maakt van het Platform</li>
              <li><strong>Ouder:</strong> Een gebruiker met de rol 'PARENT' in het Platform</li>
              <li><strong>Hulpverlener:</strong> Een gebruiker met de rol 'HELPER' in het Platform</li>
              <li><strong>Gezin:</strong> Een groep gebruikers die gezamenlijk gebruik maken van het Platform</li>
              <li><strong>Dienst:</strong> Alle functionaliteiten en services die het Platform aanbiedt</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Toepasselijkheid</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              2.1. Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten tussen het Platform
              en de Gebruiker met betrekking tot het gebruik van de Dienst.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              2.2. Door gebruik te maken van het Platform gaat de Gebruiker akkoord met deze algemene voorwaarden.
            </p>
            <p className="text-gray-700 leading-relaxed">
              2.3. Het Platform behoudt zich het recht voor deze voorwaarden te wijzigen. Wijzigingen worden
              van kracht na publicatie op het Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account en Registratie</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              3.1. Voor gebruik van het Platform is registratie vereist. De Gebruiker dient een account aan te maken
              met een geldig e-mailadres en wachtwoord.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              3.2. De Gebruiker is verantwoordelijk voor het geheimhouden van inloggegevens en alle activiteiten
              die plaatsvinden onder het account.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              3.3. Bij vermoeden van ongeautoriseerd gebruik dient de Gebruiker dit onmiddellijk te melden.
            </p>
            <p className="text-gray-700 leading-relaxed">
              3.4. De Gebruiker dient correcte en volledige informatie te verstrekken bij registratie en deze
              actueel te houden.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Gebruik van de Dienst</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              4.1. Het Platform biedt functionaliteiten voor het beheren van co-ouderschap, waaronder maar niet
              beperkt tot: agenda's, logboeken, documenten, verzoeken en communicatie met hulpverleners.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              4.2. De Gebruiker verklaart de Dienst uitsluitend te gebruiken voor de beoogde doeleinden en in
              overeenstemming met de wet en deze voorwaarden.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              4.3. Het is de Gebruiker niet toegestaan:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-3">
              <li>Inhoud te plaatsen die onrechtmatig, bedreigend, lasterlijk of anderszins ongepast is</li>
              <li>Het Platform te gebruiken voor illegale activiteiten</li>
              <li>De veiligheid of werking van het Platform te verstoren</li>
              <li>Toegang te verkrijgen tot gegevens die niet voor hem bestemd zijn</li>
              <li>Het Platform te gebruiken op een wijze die de rechten van anderen schendt</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              4.4. Bij overtreding van deze regels behoudt het Platform zich het recht voor om het account
              van de Gebruiker op te schorten of te beëindigen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Gegevens en Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              5.1. Het Platform verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening
              Gegevensbescherming (AVG) en het Privacybeleid.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              5.2. Alle gegevens die door de Gebruiker in het Platform worden ingevoerd, blijven permanent
              opgeslagen voor dossierbeheer en kunnen niet definitief worden verwijderd.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              5.3. De Gebruiker is verantwoordelijk voor de juistheid en rechtmatigheid van de door hem
              geplaatste gegevens.
            </p>
            <p className="text-gray-700 leading-relaxed">
              5.4. Het Platform neemt technische en organisatorische maatregelen om de gegevens van Gebruikers
              te beschermen tegen verlies, onrechtmatig gebruik en ongeautoriseerde toegang.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectuele Eigendom</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              6.1. Alle intellectuele eigendomsrechten met betrekking tot het Platform berusten bij het Platform
              of haar licentiegevers.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              6.2. De Gebruiker verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht om het Platform
              te gebruiken conform deze voorwaarden.
            </p>
            <p className="text-gray-700 leading-relaxed">
              6.3. Het is niet toegestaan om (delen van) het Platform te kopiëren, te wijzigen of te verspreiden
              zonder voorafgaande schriftelijke toestemming.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Abonnementen en Betaling</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.1. Het Platform biedt verschillende abonnementsvormen (FREE, PLUS, PRO) met verschillende
              functionaliteiten en prijzen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.2. Betaalde abonnementen worden periodiek gefactureerd conform de gekozen betalingstermijn.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.3. Bij niet-betaling kan het Platform de toegang tot betaalde functionaliteiten opschorten.
            </p>
            <p className="text-gray-700 leading-relaxed">
              7.4. Prijzen kunnen worden aangepast. Bestaande Gebruikers worden minimaal 30 dagen van tevoren
              geïnformeerd over prijswijzigingen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Beschikbaarheid en Onderhoud</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              8.1. Het Platform streeft naar maximale beschikbaarheid, maar kan niet garanderen dat de Dienst
              te allen tijde ononderbroken en foutloos beschikbaar is.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              8.2. Het Platform behoudt zich het recht voor om de Dienst tijdelijk buiten gebruik te stellen
              voor onderhoud, updates of verbeteringen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              8.3. Waar mogelijk zal het Platform Gebruikers vooraf informeren over gepland onderhoud.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Aansprakelijkheid</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              9.1. Het Platform is niet aansprakelijk voor schade voortvloeiend uit het gebruik van de Dienst,
              tenzij sprake is van opzet of grove schuld.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              9.2. Het Platform is niet aansprakelijk voor de juistheid of volledigheid van door Gebruikers
              geplaatste informatie.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              9.3. De aansprakelijkheid van het Platform is in alle gevallen beperkt tot het bedrag dat in het
              desbetreffende geval door de aansprakelijkheidsverzekering wordt uitbetaald.
            </p>
            <p className="text-gray-700 leading-relaxed">
              9.4. Het Platform is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst of
              gemiste besparingen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Beëindiging</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              10.1. De Gebruiker kan het gebruik van het Platform te allen tijde beëindigen door het account
              te deactiveren via de instellingen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              10.2. Het Platform kan de dienstverlening beëindigen bij overtreding van deze voorwaarden of
              bij langdurige inactiviteit.
            </p>
            <p className="text-gray-700 leading-relaxed">
              10.3. Na beëindiging blijven de gegevens bewaard conform het doel van dossierbeheer. De Gebruiker
              kan vóór beëindiging een export van de gegevens aanvragen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Geschillen en Toepasselijk Recht</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              11.1. Op deze voorwaarden en alle overeenkomsten tussen het Platform en de Gebruiker is Nederlands
              recht van toepassing.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              11.2. Alle geschillen voortvloeiend uit of verband houdend met deze voorwaarden worden bij uitsluiting
              voorgelegd aan de bevoegde rechter in Nederland.
            </p>
            <p className="text-gray-700 leading-relaxed">
              11.3. Partijen zullen eerst trachten een geschil in onderling overleg op te lossen alvorens een
              beroep te doen op de rechter.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Wijzigingen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              12.1. Het Platform behoudt zich het recht voor deze algemene voorwaarden te wijzigen of aan te vullen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              12.2. Wijzigingen worden bekendgemaakt via het Platform en per e-mail aan geregistreerde Gebruikers.
            </p>
            <p className="text-gray-700 leading-relaxed">
              12.3. Door het Platform te blijven gebruiken na een wijziging, gaat de Gebruiker akkoord met de
              gewijzigde voorwaarden.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Slotbepalingen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              13.1. Indien een bepaling van deze voorwaarden nietig of onverbindend blijkt te zijn, laat dit de
              geldigheid van de overige bepalingen onverlet.
            </p>
            <p className="text-gray-700 leading-relaxed">
              13.2. In situaties waarin deze voorwaarden niet voorzien, wordt beslist naar de geest van deze
              voorwaarden.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Voor vragen over deze algemene voorwaarden kunt u contact opnemen via de contactpagina of per
              e-mail naar info@co-ouderschap.nl.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Deze algemene voorwaarden zijn opgesteld met zorgvuldigheid. Door gebruik te maken van het Platform
            verklaart u kennis te hebben genomen van en akkoord te gaan met deze voorwaarden.
          </p>
        </div>
      </div>
    </div>
  );
}
