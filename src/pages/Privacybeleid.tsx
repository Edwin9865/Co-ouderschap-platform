import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Privacybeleid() {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacybeleid</h1>
        <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: maart 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introductie</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Co-Ouderschap ("wij", "ons", "het Platform") hecht groot belang aan de bescherming van uw privacy
              en persoonsgegevens. In dit privacybeleid leggen wij uit welke gegevens wij verzamelen, waarom wij
              deze verzamelen, en hoe wij deze gebruiken en beschermen.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Dit privacybeleid is van toepassing op alle gebruikers van het Co-Ouderschap platform, inclusief
              ouders en hulpverleners. Door gebruik te maken van ons platform, gaat u akkoord met de verwerking
              van uw gegevens zoals beschreven in dit beleid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Verantwoordelijke voor de Gegevensverwerking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              De verantwoordelijke (verwerkingsverantwoordelijke in de zin van de AVG) voor de verwerking van
              uw persoonsgegevens is:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p className="mb-1"><strong>Co-Ouderschap</strong></p>
              <p className="mb-1 text-sm text-gray-500">Een dochteronderneming van JoyVentures</p>
              <p className="mb-1">Provincialeweg 163</p>
              <p className="mb-1">9865AG Opende</p>
              <p className="mb-1">KvK-nummer: 95614583</p>
              <p className="mb-1">Btw-nummer: NL005164427B11</p>
              <p className="mb-1">E-mail: info@coparenting.nl</p>
            </div>
            <p className="text-gray-700 leading-relaxed mt-3">
              Voor vragen over dit privacybeleid of over de verwerking van uw persoonsgegevens kunt u contact
              met ons opnemen via bovenstaande gegevens.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Welke Gegevens Verzamelen Wij?</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij verzamelen verschillende soorten gegevens om onze diensten te kunnen leveren:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1. Accountgegevens</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Naam</li>
              <li>E-mailadres</li>
              <li>Wachtwoord (versleuteld opgeslagen)</li>
              <li>Accounttype (ouder of hulpverlener)</li>
              <li>Registratiedatum</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2. Gezins- en Kindergegevens</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Gezinsnamen en -structuren</li>
              <li>Namen en geboortedatums van kinderen</li>
              <li>Relaties tussen gebruikers (co-ouders, hulpverleners)</li>
              <li>Koppelcodes en uitnodigingen</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3. Platform-gebruik Gegevens</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Agenda-items en afspraken</li>
              <li>Logboekregistraties</li>
              <li>Verzoeken tussen co-ouders</li>
              <li>Berichten tussen ouders en hulpverleners</li>
              <li>Geüploade documenten en bestanden</li>
              <li>Notificatie-instellingen en voorkeuren</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.4. Technische Gegevens</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>IP-adres</li>
              <li>Browsertype en -versie</li>
              <li>Apparaatinformatie (type, besturingssysteem)</li>
              <li>Inloggeschiedenis en sessiegegevens</li>
              <li>Push notification tokens (voor meldingen)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.5. Betalingsgegevens</h3>
            <p className="text-gray-700 leading-relaxed">
              Voor betaalde abonnementen werken wij samen met Stripe als externe betalingsprovider. Wij slaan
              geen volledige betaalkaartgegevens op. Alleen basis transactie-informatie (zoals abonnementsstatus
              en factuurdatum) wordt door ons bewaard. Stripe verwerkt betaalgegevens conform hun eigen
              privacybeleid en PCI DSS-vereisten.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Waarvoor Gebruiken Wij Uw Gegevens?</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij verwerken uw persoonsgegevens voor de volgende doeleinden:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1. Dienstverlening</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Het aanmaken en beheren van uw account</li>
              <li>Het mogelijk maken van communicatie tussen co-ouders</li>
              <li>Het faciliteren van samenwerking met hulpverleners</li>
              <li>Het opslaan en organiseren van gezinsinformatie</li>
              <li>Het versturen van notificaties over belangrijke gebeurtenissen</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2. Dossierbeheer</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Informatie die u in het platform invoert, wordt bewaard om een volledig en betrouwbaar dossier
              te kunnen bieden. Dit is essentieel voor juridische doeleinden en voor het bijhouden van een
              compleet overzicht van de ontwikkeling van uw kinderen. De rechtsgrond hiervoor is de uitvoering
              van de overeenkomst en ons gerechtvaardigd belang bij het leveren van een betrouwbare
              dossierservice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3. Verbetering van de Dienst</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Het analyseren van geanonimiseerde gebruikspatronen om de dienst te verbeteren</li>
              <li>Het oplossen van technische problemen</li>
              <li>Het ontwikkelen van nieuwe functionaliteiten</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.4. Communicatie</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Het versturen van serviceberichten over uw account</li>
              <li>Het informeren over updates en nieuwe functies</li>
              <li>Het beantwoorden van uw vragen en verzoeken</li>
              <li>Het versturen van marketing e-mails, uitsluitend met uw toestemming</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.5. Wettelijke Verplichtingen</h3>
            <p className="text-gray-700 leading-relaxed">
              Het voldoen aan wettelijke verplichtingen, zoals het bewaren van financiële administratie
              (7 jaar conform de Belastingdienst) en het nakomen van gerechtelijke bevelen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Rechtsgronden voor Verwerking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij verwerken uw persoonsgegevens op basis van de volgende rechtsgronden:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Overeenkomst (art. 6(1)(b) AVG):</strong> De verwerking is noodzakelijk voor de
              uitvoering van de overeenkomst tussen u en ons, zoals het leveren van de platformdiensten
              en het bijhouden van het dossier.</li>
              <li><strong>Toestemming (art. 6(1)(a) AVG):</strong> U heeft toestemming gegeven voor
              specifieke verwerkingen, zoals het ontvangen van marketing e-mails. U kunt deze toestemming
              te allen tijde intrekken.</li>
              <li><strong>Gerechtvaardigd belang (art. 6(1)(f) AVG):</strong> De verwerking is noodzakelijk
              voor onze gerechtvaardigde belangen, zoals het verbeteren van onze diensten, het voorkomen
              van fraude en het bewaren van dossiergegevens voor juridische continuïteit.</li>
              <li><strong>Wettelijke verplichting (art. 6(1)(c) AVG):</strong> De verwerking is noodzakelijk
              om te voldoen aan wettelijke verplichtingen, zoals fiscale bewaarplichten.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delen van Gegevens</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij delen uw gegevens alleen in de volgende gevallen:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.1. Binnen het Platform</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Met uw gekoppelde co-ouder(s) binnen een gezin</li>
              <li>Met hulpverleners die u uitnodigt en toegang geeft tot uw gezin</li>
              <li>Alleen de gegevens die relevant zijn voor de betreffende relatie worden gedeeld</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.2. Sub-verwerkers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Wij maken gebruik van zorgvuldig geselecteerde dienstverleners (sub-verwerkers) die namens
              ons gegevens verwerken. Met alle sub-verwerkers hebben wij verwerkersovereenkomsten gesloten:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Supabase</strong> — database en authenticatie (opslag binnen de EER)</li>
              <li><strong>Stripe</strong> — betalingsverwerking</li>
              <li><strong>E-mailserviceprovider</strong> — voor het verzenden van transactionele e-mails en notificaties</li>
              <li><strong>Push notification service</strong> — voor het verzenden van pushmeldingen</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Deze partijen zijn contractueel verplicht om uw gegevens alleen te gebruiken voor de
              doeleinden waarvoor ze zijn ingeschakeld en passende beveiligingsmaatregelen te nemen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">6.3. Wettelijke Verplichtingen</h3>
            <p className="text-gray-700 leading-relaxed">
              Wij kunnen uw gegevens delen wanneer dit wettelijk verplicht is, bijvoorbeeld bij een
              gerechtelijk bevel of verzoek van een bevoegde autoriteit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Bewaartermijnen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor het doel waarvoor ze zijn
              verzameld, of zolang wettelijk vereist. De volgende termijnen hanteren wij:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-3">
              <li><strong>Actieve accountgegevens en dossierinhoud:</strong> zolang uw account actief is.
              Na deactivering worden gegevens nog maximaal 2 jaar bewaard, tenzij u eerder om verwijdering
              verzoekt of tenzij een langere bewaring wettelijk verplicht is.</li>
              <li><strong>Financiële en betaalgegevens:</strong> 7 jaar conform de fiscale bewaarplicht</li>
              <li><strong>Technische logbestanden:</strong> maximaal 2 jaar</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij bewaren dossiergegevens ook na accountdeactivering vanwege ons gerechtvaardigd belang
              bij juridische continuïteit en de mogelijkheid voor de Gebruiker om op een later moment zijn
              dossier op te vragen. Items die worden verwijderd worden gemarkeerd als verwijderd maar
              blijven gedurende de bewaartermijn aanwezig.
            </p>
            <p className="text-gray-700 leading-relaxed">
              U kunt te allen tijde een export van uw gegevens aanvragen via info@coparenting.nl.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Beveiliging van Gegevens</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij nemen de beveiliging van uw gegevens zeer serieus en hebben passende technische en
              organisatorische maatregelen getroffen:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Alle gegevens worden versleuteld opgeslagen en verzonden (TLS/SSL)</li>
              <li>Wachtwoorden worden ge-hashed en gezouten opgeslagen</li>
              <li>Toegang tot gegevens is streng beperkt via Row Level Security (RLS)</li>
              <li>Regelmatige back-ups worden gemaakt</li>
              <li>Servers worden continu gemonitord op beveiligingsincidenten</li>
              <li>Medewerkers hebben alleen toegang tot gegevens voor zover noodzakelijk voor hun functie</li>
              <li>Alle medewerkers zijn gebonden aan geheimhouding</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Uw Rechten</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Onder de AVG heeft u de volgende rechten met betrekking tot uw persoonsgegevens:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.1. Recht op Inzage</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              U heeft het recht om te weten welke gegevens wij van u verwerken en een kopie daarvan
              op te vragen. U kunt via de Export-functie in het platform een volledige export van uw
              gegevens aanvragen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.2. Recht op Rectificatie</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              U kunt onjuiste of onvolledige gegevens laten corrigeren. De meeste gegevens kunt u
              zelf wijzigen via uw accountinstellingen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.3. Recht op Vergetelheid</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              U heeft het recht om verwijdering van uw persoonsgegevens te verzoeken. Wij zullen hieraan
              voldoen tenzij wij een gerechtvaardigd belang of wettelijke verplichting hebben om de gegevens
              langer te bewaren (art. 17(3) AVG). In dat geval informeren wij u hierover met opgave van
              de specifieke grond. U kunt uw account deactiveren via de instellingen; wij verwerken een
              volledig verwijderingsverzoek binnen één maand na ontvangst.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.4. Recht op Beperking</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              U kunt verzoeken om de verwerking van uw gegevens te beperken, bijvoorbeeld wanneer u de
              juistheid van de gegevens betwist of bezwaar heeft gemaakt tegen de verwerking.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.5. Recht op Overdraagbaarheid</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              U heeft het recht om uw gegevens in een gestructureerd, gangbaar en machineleesbaar
              formaat te ontvangen. Dit kunt u doen via de Export-functie in het platform.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.6. Recht op Bezwaar</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              U heeft het recht om bezwaar te maken tegen de verwerking van uw gegevens op grond van
              gerechtvaardigd belang. Wij stoppen dan met de verwerking, tenzij wij dwingende gerechtvaardigde
              gronden hebben die zwaarder wegen dan uw belangen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.7. Intrekken van Toestemming</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Waar verwerking gebaseerd is op uw toestemming (zoals marketing e-mails), kunt u deze
              toestemming te allen tijde intrekken. Dit heeft geen invloed op de rechtmatigheid van
              de verwerking vóór de intrekking.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">9.8. Uitoefenen van Rechten</h3>
            <p className="text-gray-700 leading-relaxed">
              Om een van deze rechten uit te oefenen, kunt u contact met ons opnemen via
              info@coparenting.nl. Wij reageren binnen één maand op uw verzoek. Wij kunnen u vragen
              uw identiteit te bevestigen voordat wij uw verzoek verwerken.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies en Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Ons platform maakt minimaal gebruik van cookies en tracking:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-3">
              <li><strong>Essentiële cookies:</strong> Noodzakelijk voor de werking van het platform
              (authenticatie, sessies). Voor deze cookies is geen toestemming vereist.</li>
              <li><strong>Functionele cookies:</strong> Voor het onthouden van uw voorkeuren en instellingen.
              Hiervoor vragen wij uw toestemming bij het eerste bezoek.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Wij gebruiken geen tracking cookies voor advertentiedoeleinden of het delen van gegevens
              met derden voor marketing. U kunt uw cookie-instellingen aanpassen via de cookie-instellingen
              in uw browser.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Gegevens van Kinderen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Het platform is bedoeld voor gebruik door volwassenen (18+). De informatie over kinderen
              die in het platform wordt opgeslagen, wordt ingevoerd door hun ouders of voogden. De
              rechtsgrond voor het verwerken van kindergegevens is de uitvoering van de overeenkomst
              met de ouder/voogd en het gerechtvaardigd belang bij het bijhouden van een compleet
              kinderdossier.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Als ouder of voogd bent u verantwoordelijk voor de bescherming van de privacy van uw kinderen
              en het delen van hun gegevens met andere gebruikers (zoals de co-ouder of hulpverleners).
              Wij verwerken kindergegevens met extra zorgvuldigheid en beperken de toegang strikt tot
              de betrokken gebruikers binnen het gezin.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Internationale Gegevensoverdracht</h2>
            <p className="text-gray-700 leading-relaxed">
              Uw gegevens worden primair opgeslagen op servers binnen de Europese Economische Ruimte (EER)
              via Supabase. In gevallen waarbij sub-verwerkers (zoals Stripe) gegevens buiten de EER
              verwerken, is dit gebaseerd op passende waarborgen conform de AVG, zoals de
              Standaardcontractbepalingen (SCC's) van de Europese Commissie.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Datalekken</h2>
            <p className="text-gray-700 leading-relaxed">
              In het geval van een datalek dat een risico vormt voor uw rechten en vrijheden, zullen wij
              dit binnen 72 uur melden bij de Autoriteit Persoonsgegevens conform art. 33 AVG. Indien het
              datalek waarschijnlijk een hoog risico inhoudt voor uw rechten en vrijheden, stellen wij
              u hier ook persoonlijk van op de hoogte conform art. 34 AVG.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Wijzigingen in dit Privacybeleid</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Wij kunnen dit privacybeleid van tijd tot tijd aanpassen om wijzigingen in onze praktijken
              of wetgeving te reflecteren. Belangrijke wijzigingen melden wij u minimaal 30 dagen van
              tevoren via e-mail en via een melding in het platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              De meest recente versie van dit privacybeleid is altijd beschikbaar op deze pagina.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact en Klachten</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Voor vragen over dit privacybeleid of over de verwerking van uw persoonsgegevens kunt u
              contact met ons opnemen:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mb-4">
              <p className="mb-1"><strong>Co-Ouderschap</strong></p>
              <p className="mb-1 text-sm text-gray-500">Een dochteronderneming van JoyVentures</p>
              <p className="mb-1">Provincialeweg 163</p>
              <p className="mb-1">9865AG Opende</p>
              <p className="mb-1"><strong>E-mail:</strong> info@coparenting.nl</p>
              <p><strong>Via de app:</strong> Ga naar Contact & Support in het menu</p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Als u niet tevreden bent met de manier waarop wij met uw gegevens omgaan, heeft u het
              recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Dit privacybeleid is opgesteld met zorgvuldigheid en in overeenstemming met de Algemene
            Verordening Gegevensbescherming (AVG). Door gebruik te maken van het Platform verklaart u
            kennis te hebben genomen van dit privacybeleid.
          </p>
        </div>
      </div>
    </div>
  );
}
