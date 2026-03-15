import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Disclaimer() {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Disclaimer</h1>
        <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: maart 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Algemeen</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Co-Ouderschap, een dochteronderneming van JoyVentures, gevestigd aan Provincialeweg 163,
              9865AG Opende (KvK: 95614583), beheert en exploiteert het Co-Ouderschap platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Door gebruik te maken van dit platform en/of de website accepteert u de voorwaarden van
              deze disclaimer. Co-Ouderschap behoudt zich het recht voor de inhoud van deze disclaimer
              te allen tijde te wijzigen zonder voorafgaande kennisgeving.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Geen Professioneel Advies</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              De informatie en functionaliteiten op het Co-Ouderschap platform zijn uitsluitend bedoeld
              als organisatorisch hulpmiddel voor co-ouders en betrokken hulpverleners. Het platform
              vervangt nadrukkelijk <strong>geen</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-3">
              <li><strong>Juridisch advies</strong> : Voor juridische kwesties rondom scheiding, gezag,
              omgangsregelingen of alimentatie dient u een advocaat of mediator te raadplegen</li>
              <li><strong>Psychologisch of therapeutisch advies</strong> : Voor emotionele of
              psychologische ondersteuning dient u contact op te nemen met een erkend psycholoog
              of therapeut</li>
              <li><strong>Medisch advies</strong> : Voor medische vragen en beslissingen betreffende
              uw kinderen dient u een arts te raadplegen</li>
              <li><strong>Maatschappelijk werk of jeugdzorgbegeleiding</strong> : Wij zijn geen
              erkende zorginstelling</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Co-Ouderschap aanvaardt geen aansprakelijkheid voor beslissingen die worden genomen op
              basis van informatie die via het platform is vastgelegd of gedeeld.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Juistheid van Informatie</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Co-Ouderschap streeft ernaar dat de informatie op de website en in het platform correct
              en actueel is. Wij kunnen echter niet garanderen dat alle informatie te allen tijde
              volledig, juist en up-to-date is.
            </p>
            <p className="text-gray-700 leading-relaxed">
              De inhoud die door gebruikers in het platform wordt ingevoerd, valt volledig onder de
              verantwoordelijkheid van de betreffende gebruiker. Co-Ouderschap controleert deze inhoud
              niet en aanvaardt hiervoor geen aansprakelijkheid.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Aansprakelijkheidsbeperking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Co-Ouderschap is niet aansprakelijk voor enige schade, direct of indirect, die voortvloeit
              uit het gebruik of de onmogelijkheid van gebruik van het platform, waaronder maar niet
              beperkt tot:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-3">
              <li>Verlies van gegevens door technische storingen</li>
              <li>Schade als gevolg van ongeautoriseerde toegang tot accounts</li>
              <li>Onjuiste of onvolledige informatie ingevoerd door gebruikers</li>
              <li>Beslissingen genomen op basis van de via het platform gedeelde informatie</li>
              <li>Schade als gevolg van virussen of andere schadelijke software via externe links</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Voor de volledige aansprakelijkheidsregeling verwijzen wij naar onze{' '}
              <Link to="/algemene-voorwaarden" className="text-blue-600 hover:underline">Algemene Voorwaarden</Link>,
              artikel 10.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Externe Links</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Het platform en de website kunnen links bevatten naar externe websites van derden.
              Co-Ouderschap heeft geen controle over de inhoud of het privacybeleid van deze externe
              websites en aanvaardt hiervoor geen aansprakelijkheid.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Het plaatsen van een link naar een externe website betekent niet dat Co-Ouderschap de
              inhoud van die website onderschrijft of goedkeurt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectuele Eigendom</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Alle inhoud op de website en in het platform, waaronder teksten, afbeeldingen, logo's,
              ontwerpen en software, is eigendom van Co-Ouderschap of haar licentiegevers en is
              beschermd door intellectuele eigendomsrechten.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Niets van deze website mag worden verveelvoudigd, opgeslagen of openbaar gemaakt zonder
              voorafgaande schriftelijke toestemming van Co-Ouderschap, tenzij anders bepaald in de
              <Link to="/algemene-voorwaarden" className="text-blue-600 hover:underline"> Algemene Voorwaarden</Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Beschikbaarheid</h2>
            <p className="text-gray-700 leading-relaxed">
              Co-Ouderschap spant zich in om het platform zo ononderbroken mogelijk beschikbaar te
              houden, maar garandeert geen ononderbroken toegang. Wij zijn niet aansprakelijk voor
              schade als gevolg van tijdelijke onbeschikbaarheid door onderhoud, storingen of
              omstandigheden buiten onze controle.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Toepasselijk Recht</h2>
            <p className="text-gray-700 leading-relaxed">
              Op deze disclaimer is Nederlands recht van toepassing. Geschillen worden voorgelegd aan
              de bevoegde rechter in het arrondissement Noord-Nederland, tenzij dwingend recht anders
              bepaalt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Heeft u vragen over deze disclaimer? Neem contact met ons op:
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
            Zie ook: <Link to="/privacybeleid" className="hover:underline">Privacybeleid</Link> •{' '}
            <Link to="/algemene-voorwaarden" className="hover:underline">Algemene Voorwaarden</Link> •{' '}
            <Link to="/cookieverklaring" className="hover:underline">Cookieverklaring</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
