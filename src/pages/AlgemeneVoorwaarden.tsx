import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AlgemeneVoorwaarden() {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Algemene Voorwaarden</h1>
        <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: maart 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Definities</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              In deze algemene voorwaarden wordt verstaan onder:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Aanbieder:</strong> Co-Ouderschap, een dochteronderneming van JoyVentures, gevestigd aan Provincialeweg 163, 9865AG Opende, ingeschreven bij de KvK onder nummer 95614583</li>
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
              2.1. Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten tussen de Aanbieder
              en de Gebruiker met betrekking tot het gebruik van de Dienst.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              2.2. Door gebruik te maken van het Platform gaat de Gebruiker akkoord met deze algemene voorwaarden.
            </p>
            <p className="text-gray-700 leading-relaxed">
              2.3. De Aanbieder behoudt zich het recht voor deze voorwaarden te wijzigen. Wijzigingen worden
              minimaal 30 dagen voor inwerkingtreding bekendgemaakt via het Platform en per e-mail aan
              geregistreerde Gebruikers. Bij voortgezet gebruik na de wijzigingsdatum gaat de Gebruiker
              akkoord met de gewijzigde voorwaarden.
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
              3.3. Bij vermoeden van ongeautoriseerd gebruik dient de Gebruiker dit onmiddellijk te melden
              via info@coparenting.nl.
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
              4.4. Bij overtreding van deze regels behoudt de Aanbieder zich het recht voor om het account
              van de Gebruiker op te schorten of te beëindigen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Gegevens en Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              5.1. De Aanbieder verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening
              Gegevensbescherming (AVG) en het Privacybeleid.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              5.2. Gegevens die door de Gebruiker in het Platform worden ingevoerd, worden bewaard voor
              dossierbeheer zolang dit noodzakelijk is voor het doel waarvoor ze zijn verzameld, of zolang
              de Gebruiker een actief account heeft. Na beëindiging van het account worden gegevens bewaard
              conform de bewaartermijnen zoals beschreven in het Privacybeleid. De Gebruiker kan te allen
              tijde een export van zijn gegevens aanvragen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              5.3. De Gebruiker is verantwoordelijk voor de juistheid en rechtmatigheid van de door hem
              geplaatste gegevens.
            </p>
            <p className="text-gray-700 leading-relaxed">
              5.4. De Aanbieder neemt technische en organisatorische maatregelen om de gegevens van Gebruikers
              te beschermen tegen verlies, onrechtmatig gebruik en ongeautoriseerde toegang.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectuele Eigendom</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              6.1. Alle intellectuele eigendomsrechten met betrekking tot het Platform berusten bij de Aanbieder
              of haar licentiegevers.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              6.2. De Gebruiker verkrijgt een niet-exclusief, niet-overdraagbaar gebruiksrecht om het Platform
              te gebruiken conform deze voorwaarden.
            </p>
            <p className="text-gray-700 leading-relaxed">
              6.3. Het is niet toegestaan om (delen van) het Platform te kopiëren, te wijzigen of te verspreiden
              zonder voorafgaande schriftelijke toestemming van de Aanbieder.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Abonnementen en Betaling</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.1. Het Platform biedt verschillende abonnementsvormen (FREE, PLUS, PRO) met verschillende
              functionaliteiten en prijzen. De actuele prijzen zijn te vinden op de abonnementspagina.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.2. Betaalde abonnementen worden periodiek gefactureerd conform de gekozen betalingstermijn
              (maandelijks of jaarlijks). Betalingen worden verwerkt via onze externe betalingsprovider Stripe.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.3. Bij niet-betaling kan de Aanbieder de toegang tot betaalde functionaliteiten opschorten.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              7.4. Prijzen kunnen worden aangepast. Bestaande Gebruikers worden minimaal 30 dagen van tevoren
              geïnformeerd over prijswijzigingen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              7.5. Bij opzegging van een betaald abonnement wordt het abonnement beëindigd aan het einde van
              de lopende betaalperiode. Er vindt geen restitutie plaats voor reeds gefactureerde periodes,
              tenzij de Gebruiker gebruikmaakt van het herroepingsrecht zoals beschreven in artikel 8.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Herroepingsrecht</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              8.1. Als consument heeft de Gebruiker het recht om binnen 14 dagen na het afsluiten van een
              betaald abonnement de overeenkomst zonder opgave van reden te ontbinden (herroepingsrecht),
              conform artikel 6:230o van het Burgerlijk Wetboek.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              8.2. De herroepingstermijn verstrijkt 14 dagen na de dag waarop het abonnement is afgesloten.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              8.3. Om het herroepingsrecht uit te oefenen, dient de Gebruiker de Aanbieder via een ondubbelzinnige
              verklaring (per e-mail aan info@coparenting.nl) op de hoogte te stellen van de beslissing de
              overeenkomst te herroepen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              8.4. Indien de Gebruiker heeft verzocht de dienstverlening te beginnen tijdens de herroepingstermijn,
              is de Gebruiker een bedrag verschuldigd dat evenredig is aan het gedeelte van de dienst dat
              al is geleverd op het moment van herroeping.
            </p>
            <p className="text-gray-700 leading-relaxed">
              8.5. Eventuele terugbetalingen worden binnen 14 dagen na de herroeping verwerkt via de
              oorspronkelijke betaalmethode.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Beschikbaarheid en Onderhoud</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              9.1. De Aanbieder streeft naar maximale beschikbaarheid, maar kan niet garanderen dat de Dienst
              te allen tijde ononderbroken en foutloos beschikbaar is.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              9.2. De Aanbieder behoudt zich het recht voor om de Dienst tijdelijk buiten gebruik te stellen
              voor onderhoud, updates of verbeteringen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              9.3. Waar mogelijk zal de Aanbieder Gebruikers vooraf informeren over gepland onderhoud.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Aansprakelijkheid</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              10.1. De Aanbieder is niet aansprakelijk voor schade voortvloeiend uit het gebruik van de Dienst,
              tenzij sprake is van opzet of grove schuld aan de zijde van de Aanbieder.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              10.2. De Aanbieder is niet aansprakelijk voor de juistheid of volledigheid van door Gebruikers
              geplaatste informatie.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              10.3. De totale aansprakelijkheid van de Aanbieder is in alle gevallen beperkt tot het bedrag
              dat de Gebruiker in de drie maanden voorafgaand aan de schadeveroorzakende gebeurtenis aan
              abonnementskosten heeft betaald, met een maximum van € 500,-.
            </p>
            <p className="text-gray-700 leading-relaxed">
              10.4. De Aanbieder is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst of
              gemiste besparingen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Beëindiging</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              11.1. De Gebruiker kan het gebruik van het Platform te allen tijde beëindigen door het account
              te deactiveren via de instellingen of door een verzoek te sturen naar info@coparenting.nl.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              11.2. De Aanbieder kan de dienstverlening beëindigen bij overtreding van deze voorwaarden of
              bij langdurige inactiviteit (meer dan 24 maanden).
            </p>
            <p className="text-gray-700 leading-relaxed">
              11.3. Na beëindiging worden gegevens bewaard conform het Privacybeleid. De Gebruiker kan vóór
              of na beëindiging een export van de gegevens aanvragen via info@coparenting.nl.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Klachten</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              12.1. Klachten over de Dienst kunnen worden ingediend via info@coparenting.nl. De Aanbieder
              streeft ernaar klachten binnen 14 dagen te behandelen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              12.2. Indien de klacht niet naar tevredenheid wordt opgelost, kan de Gebruiker een geschil
              voorleggen via het Europese ODR-platform (ec.europa.eu/consumers/odr) of zich wenden tot
              de bevoegde rechter conform artikel 13.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Geschillen en Toepasselijk Recht</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              13.1. Op deze voorwaarden en alle overeenkomsten tussen de Aanbieder en de Gebruiker is Nederlands
              recht van toepassing.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              13.2. Partijen zullen eerst trachten een geschil in onderling overleg op te lossen alvorens een
              beroep te doen op de rechter.
            </p>
            <p className="text-gray-700 leading-relaxed">
              13.3. Alle geschillen die niet in onderling overleg worden opgelost, worden voorgelegd aan de
              bevoegde rechter in het arrondissement Noord-Nederland.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Slotbepalingen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              14.1. Indien een bepaling van deze voorwaarden nietig of onverbindend blijkt te zijn, laat dit de
              geldigheid van de overige bepalingen onverlet.
            </p>
            <p className="text-gray-700 leading-relaxed">
              14.2. In situaties waarin deze voorwaarden niet voorzien, wordt beslist naar de geest van deze
              voorwaarden en het toepasselijk Nederlands recht.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Voor vragen over deze algemene voorwaarden kunt u contact opnemen:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p className="mb-1"><strong>Co-Ouderschap</strong></p>
              <p className="mb-1 text-sm text-gray-500">Een dochteronderneming van JoyVentures</p>
              <p className="mb-1">Provincialeweg 163</p>
              <p className="mb-1">9865AG Opende</p>
              <p className="mb-1">KvK-nummer: 95614583</p>
              <p className="mb-1">Btw-nummer: NL005164427B11</p>
              <p>E-mail: info@coparenting.nl</p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Deze algemene voorwaarden zijn opgesteld met zorgvuldigheid en in overeenstemming met het
            Nederlands consumentenrecht. Door gebruik te maken van het Platform verklaart u kennis te
            hebben genomen van en akkoord te gaan met deze voorwaarden.
          </p>
        </div>
      </div>
    </div>
  );
}
