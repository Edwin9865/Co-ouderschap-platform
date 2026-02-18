import { Helmet } from 'react-helmet-async';
import { Users, Heart, Shield, Calendar, FileText, MessageSquare, UserPlus, Sparkles } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';

export function AboutUs() {
  return (
    <>
      <Helmet>
        <title>Over Ons - Co-Parenting App voor Gescheiden Ouders | Samenwerking & Transparantie</title>
        <meta
          name="description"
          content="Ontdek hoe onze co-parenting app tot stand is gekomen door samenwerking met ervaringsdeskundigen en hulpverleners. Een platform dat communicatie, planning en transparantie bevordert voor gescheiden ouders."
        />
        <meta
          name="keywords"
          content="co-parenting app, gescheiden ouders, co-ouderschap, ouderschap na scheiding, communicatie gescheiden ouders, omgangsregeling app, gedeeld ouderschap, hulpverleners, ervaringsdeskundigen"
        />
        <link rel="canonical" href="https://coparenting.app/over-ons" />

        <meta property="og:title" content="Over Ons - Co-Parenting App voor Gescheiden Ouders" />
        <meta property="og:description" content="Een platform ontwikkeld met ervaringsdeskundigen en hulpverleners voor effectieve communicatie en samenwerking in co-ouderschap." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://coparenting.app/over-ons" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "mainEntity": {
              "@type": "Organization",
              "name": "Co-Parenting App",
              "description": "Platform voor effectieve communicatie en samenwerking tussen gescheiden ouders",
              "url": "https://coparenting.app",
              "foundingDate": "2024",
              "founder": {
                "@type": "Person",
                "name": "Co-Parenting Team"
              },
              "areaServed": "Nederland",
              "serviceType": "Co-parenting platform"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <SiteHeader />

        <main className="pt-20 pb-16">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                  Over Ons
                </h1>
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  Een platform ontwikkeld met en voor ouders die gescheiden zijn en streven naar
                  constructieve samenwerking in het belang van hun kinderen.
                </p>
              </div>
            </div>
          </section>

          {/* Missie Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-8 h-8 text-red-600" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Onze Missie
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none text-gray-700">
                  <p className="text-base sm:text-lg leading-relaxed mb-4">
                    Wij geloven dat kinderen het recht hebben op een gezonde relatie met beide ouders,
                    ook na een scheiding. Onze missie is om gescheiden ouders te ondersteunen met tools
                    die effectieve communicatie bevorderen, transparantie waarborgen en conflicten
                    minimaliseren.
                  </p>
                  <p className="text-base sm:text-lg leading-relaxed">
                    Door het bieden van een gestructureerd platform helpen we ouders om zich te richten
                    op wat echt belangrijk is: het welzijn en de ontwikkeling van hun kinderen.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Doelgroep Section */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Voor Wie Is Deze App Bedoeld?
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                      Gescheiden Ouders
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Of je nu een omgangsregeling hebt afgesproken, co-ouderschap uitvoert of in een
                      complexe gezinssituatie zit: onze app biedt de structuur en overzicht die je
                      nodig hebt om effectief samen te werken met je ex-partner.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                      Hulpverleners en Professionals
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Mediators, gezinstherapeuten, jeugdzorgwerkers en advocaten kunnen toegang
                      krijgen tot het dossier van hun cliënten (met toestemming). Dit biedt waardevolle
                      context en helpt bij het bieden van gerichte ondersteuning.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                      Nieuwe Partners en Stiefouders
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Ook nieuwe partners kunnen een rol spelen in de opvoeding. Via onze app blijven
                      zij op de hoogte van afspraken en belangrijke informatie, zonder dat dit leidt
                      tot miscommunicatie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ontstaan Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-8 h-8 text-amber-600" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Hoe Is Deze App Ontstaan?
                  </h2>
                </div>
                <div className="space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
                  <p>
                    De ontwikkeling van onze co-parenting app is begonnen vanuit een simpele maar
                    belangrijke observatie: veel gescheiden ouders worstelen met communicatie,
                    transparantie en het bijhouden van belangrijke informatie over hun kinderen.
                  </p>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Samenwerking met Ervaringsdeskundigen
                    </h3>
                    <p>
                      Vanaf dag één hebben we nauw samengewerkt met gescheiden ouders die zelf de
                      uitdagingen van co-ouderschap ervaren. Hun inzichten, frustraties en wensen
                      vormden de basis voor elke functie die we hebben ontwikkeld. Dit zorgt ervoor
                      dat de app niet alleen technisch goed is, maar ook echt aansluit bij de
                      dagelijkse realiteit van gescheiden gezinnen.
                    </p>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Input van Hulpverleners
                    </h3>
                    <p>
                      Daarnaast hebben we hulpverleners, mediators, gezinstherapeuten en
                      jeugdzorgwerkers betrokken bij het ontwikkelproces. Zij brachten professionele
                      expertise in over wat werkt en wat niet in conflictsituaties. Hun feedback heeft
                      ons geholpen om functies te bouwen die niet alleen praktisch zijn, maar ook
                      bijdragen aan de-escalatie en constructieve samenwerking.
                    </p>
                  </div>

                  <p>
                    Het resultaat is een platform dat zowel gebruiksvriendelijk als effectief is,
                    gebouwd op echte ervaringen en wetenschappelijk onderbouwde principes voor
                    gezonde co-ouderschap.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Functies Section */}
          <section className="py-12 sm:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">
                  Wat Biedt Onze App?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Gedeelde Agenda
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Plan afspraken, vakanties, ouderavonden en andere belangrijke momenten. Beide
                      ouders hebben realtime inzicht en kunnen wijzigingen voorstellen via het
                      verzoekenssysteem.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Digitaal Logboek
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Houd belangrijke gebeurtenissen bij zoals schoolresultaten, medische
                      informatie, ontwikkelingsmijlpalen en bijzondere momenten. Alle informatie
                      is toegankelijk voor beide ouders en kan geëxporteerd worden.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Verzoekenssysteem
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Stel wijzigingsverzoeken in voor afspraken zonder directe confrontatie.
                      Verzoeken kunnen worden goedgekeurd, afgewezen of aangepast met een
                      tegenvoorstel. Alles wordt gedocumenteerd.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <UserPlus className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Hulpverlener Toegang
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Geef hulpverleners read-only toegang tot jullie dossier. Via het ingebouwde
                      berichtensysteem kunnen jullie vragen stellen, advies vragen bij uitdagingen
                      in de opvoeding, en ondersteuning krijgen wanneer jullie vastlopen.
                      Hulpverleners kunnen proactief bemiddelen en ondersteunen op basis van
                      feitelijke informatie.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Privacy & Veiligheid
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Jouw gegevens zijn volledig versleuteld en veilig opgeslagen. Je bepaalt zelf
                      welke informatie je deelt en met wie. Alle acties worden gelogd voor
                      transparantie.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Export Functionaliteit
                      </h3>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Exporteer je logboek, agenda en andere gegevens naar PDF. Handig voor gesprekken
                      met hulpverleners, rechtszaken of gewoon als back-up van belangrijke
                      informatie.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Toegevoegde Waarde Section */}
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
                  Waarom Kiezen Voor Onze App?
                </h2>

                <div className="space-y-6">
                  <div className="border-l-4 border-slate-800 pl-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      1. Alles Op Één Plek
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      In plaats van losse apps voor agenda, communicatie en documentatie, biedt onze
                      app één geïntegreerd platform waar alles samenkomt. Dit bespaart tijd en
                      voorkomt dat belangrijke informatie verloren gaat.
                    </p>
                  </div>

                  <div className="border-l-4 border-slate-800 pl-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      2. Focus Op De-escalatie
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Door gestructureerde communicatie via verzoeken en duidelijke documentatie
                      worden veel conflicten vermeden. Ouders hoeven niet direct met elkaar te
                      overleggen over elke kleine wijziging, wat de emotionele lading verlaagt.
                    </p>
                  </div>

                  <div className="border-l-4 border-slate-800 pl-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      3. Transparantie Voor Alle Betrokkenen
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Hulpverleners, nieuwe partners en andere betrokkenen kunnen (met toestemming)
                      meekijken. Dit zorgt ervoor dat iedereen op de hoogte is en kan bijdragen aan
                      een stabiele omgeving voor de kinderen.
                    </p>
                  </div>

                  <div className="border-l-4 border-slate-800 pl-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      4. Bewijs en Documentatie
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Alle communicatie en afspraken worden automatisch gedocumenteerd. Dit kan
                      waardevol zijn bij juridische procedures of gesprekken met mediators en
                      hulpverleners. Je hebt altijd een objectief overzicht van wat er is afgesproken.
                    </p>
                  </div>

                  <div className="border-l-4 border-slate-800 pl-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      5. Kindgericht
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      Alles in de app draait om het welzijn van de kinderen. Door per kind informatie
                      bij te houden, blijft de focus op hun behoeften en ontwikkeling, in plaats van
                      op het conflict tussen de ouders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
                Klaar Om Te Beginnen?
              </h2>
              <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Ontdek hoe onze app jouw co-parenting ervaring kan verbeteren. Probeer het nu
                gratis en ervaar zelf het verschil.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Gratis Starten
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
                >
                  Bekijk Prijzen
                </a>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
