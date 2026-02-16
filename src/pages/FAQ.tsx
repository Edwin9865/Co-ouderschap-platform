// src/pages/FAQ.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Shield,
  Lock,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import Seo from "../components/Seo";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    // Algemeen
    {
      category: "Algemeen",
      question: "Wat is co-ouderschap en hoe helpt deze app daarbij?",
      answer:
        "Co-ouderschap betekent dat beide ouders na een scheiding actief betrokken blijven bij de opvoeding. CoParenting helpt door afspraken, communicatie en documentatie op één plek te bundelen: een gedeelde agenda, logboek, verzoeken (met acceptatie/afwijzing/tegenvoorstel) en export. Dat geeft overzicht, voorkomt misverstanden en helpt om rust en voorspelbaarheid voor kinderen te creëren.",
    },
    {
      category: "Algemeen",
      question: "Voor wie is deze app geschikt?",
      answer:
        "Voor co-ouders die afspraken en communicatie helder willen organiseren—ook als samenwerken lastig is. Daarnaast is er (afhankelijk van je abonnement) een portaal voor hulpverleners zoals mediators, gezinscoaches of therapeuten om mee te kijken en te ondersteunen binnen duidelijke rechten.",
    },
    {
      category: "Algemeen",
      question: "Moet mijn ex-partner ook een account aanmaken?",
      answer:
        "Ja. Voor gedeelde functies (agenda, logboek, verzoeken) maken beide ouders een eigen account aan. Jullie koppelen daarna veilig via een koppelcode of uitnodiging. Zo heeft ieder een eigen login en blijven rechten en privacy duidelijk.",
    },
    {
      category: "Algemeen",
      question: "Werkt de app ook als we (bijna) geen direct contact hebben?",
      answer:
        "Ja. De app is juist geschikt wanneer direct contact lastig is. Met het verzoeken-systeem en duidelijke, terugvindbare communicatie verminder je ruis en misverstanden. Alles blijft geordend en chronologisch beschikbaar.",
    },

    // Account & Toegang
    {
      category: "Account & Toegang",
      question: "Hoe koppel ik mijn account aan die van mijn co-ouder?",
      answer:
        'Na registratie ga je naar Instellingen > Koppelen. Daar zie je een koppelcode. Deel die code met je co-ouder via een veilig kanaal (bijv. SMS/WhatsApp). Je co-ouder voert de code in bij Instellingen > Koppelen. Na bevestiging zijn jullie gekoppeld en delen jullie de gezinsgegevens volgens de ingestelde rechten.',
    },
    {
      category: "Account & Toegang",
      question: "Kan ik meerdere gezinnen beheren in één account?",
      answer:
        "Op dit moment is de app ontworpen voor één gezinssituatie per account. Als je meerdere situaties hebt, is het het meest praktisch om voor elke situatie een apart account te gebruiken (met een ander e-mailadres).",
    },
    {
      category: "Account & Toegang",
      question: "Wat als ik mijn wachtwoord ben vergeten?",
      answer:
        'Gebruik op de inlogpagina "Wachtwoord vergeten?". Je ontvangt een e-mail om je wachtwoord te resetten. Controleer ook je spam/junk. Lukt het niet? Neem contact op met support via de contactpagina.',
    },
    {
      category: "Account & Toegang",
      question: "Hoe kan ik mijn account extra beveiligen?",
      answer:
        "Gebruik een sterk, uniek wachtwoord (liefst via een password manager), log uit op gedeelde apparaten en deel je wachtwoord nooit. We adviseren ook om je e-mailaccount goed te beveiligen, omdat reset-links daarheen gaan.",
    },

    // Functionaliteit
    {
      category: "Functionaliteit",
      question: "Hoe werkt de gedeelde agenda?",
      answer:
        "Beide ouders zien dezelfde agenda-items. Je voegt afspraken toe (wissels, school, sport, doktersafspraken) en koppelt ze eventueel aan een kind. Wijzigingen zijn direct zichtbaar en kunnen notificaties triggeren. Zo voorkom je misverstanden over wie-wat-wanneer.",
    },
    {
      category: "Functionaliteit",
      question: "Wat kan ik bijhouden in het logboek?",
      answer:
        "Alles wat relevant is voor je kind(eren): gezondheid, school, gedrag, bijzonderheden, afspraken en belangrijke gebeurtenissen. Het logboek is chronologisch, waardoor je informatie snel terugvindt en (indien nodig) kunt delen met een hulpverlener.",
    },
    {
      category: "Functionaliteit",
      question: "Hoe stuur ik een verzoek naar mijn co-ouder?",
      answer:
        'Ga naar Verzoeken en kies "Nieuw verzoek". Selecteer een type (bijv. ruilen, extra tijd, vakantie) of maak je eigen verzoek. Je co-ouder kan accepteren, afwijzen of een tegenvoorstel doen. Alles blijft netjes gelogd.',
    },
    {
      category: "Functionaliteit",
      question: "Kan ik berichten of logboek-items verwijderen?",
      answer:
        "Om misverstanden te voorkomen en afspraken betrouwbaar terug te kunnen zien, zijn items meestal niet zomaar te verwijderen. In veel gevallen kun je wel corrigeren of aanvullen, met een duidelijke registratie dat er iets is aangepast. Als er een gegronde reden is om iets te verwijderen, kan support meedenken.",
    },
    {
      category: "Functionaliteit",
      question: "Hoe kan ik alle informatie exporteren?",
      answer:
        "Met een betaald abonnement kun je exports maken (bijv. per kind of per periode) naar een overzichtelijke PDF. Handig voor eigen administratie, gesprekken met hulpverleners of juridische context. Je vindt dit bij Instellingen > Export.",
    },

    // Privacy & Veiligheid
    {
      category: "Privacy & Veiligheid",
      question: "Hoe veilig is mijn data?",
      answer:
        "We behandelen privacy en veiligheid als basis. Data wordt opgeslagen op beveiligde infrastructuur en je bepaalt zelf wie toegang heeft. Je gegevens worden niet verkocht aan derden. Lees het privacybeleid voor de volledige uitleg over opslag, verwerking en rechten.",
    },
    {
      category: "Privacy & Veiligheid",
      question: "Kan mijn co-ouder zien wat ik typ vóórdat ik verstuur?",
      answer:
        "Nee. Alleen definitief verstuurde berichten/requests/logboekitems worden zichtbaar voor de ander. Je kunt dus rustig formuleren voordat je iets deelt.",
    },
    {
      category: "Privacy & Veiligheid",
      question: "Wat gebeurt er met mijn data bij een juridische procedure?",
      answer:
        "Je data blijft van jou. We verstrekken geen gegevens aan derden zonder jouw toestemming, behalve als we daartoe wettelijk verplicht zijn. Je kunt zelf exports maken om je administratie te onderbouwen.",
    },
    {
      category: "Privacy & Veiligheid",
      question: "Hoe werkt toegang voor hulpverleners?",
      answer:
        "Je kunt (afhankelijk van je abonnement) een hulpverlener veilig toegang geven met duidelijke rechten. Denk aan alleen lezen of beperkt reageren. Je kunt deze toegang altijd intrekken.",
    },

    // Abonnementen
    {
      category: "Abonnementen",
      question: "Wat is het verschil tussen Basis, Pro en Familie?",
      answer:
        "Basis is gratis en bevat de kernfuncties. Pro voegt extra mogelijkheden toe zoals uitgebreidere exports en meer ruimte. Familie is bedoeld wanneer je ook met hulpverleners wilt werken en extra ondersteuning wil. Voor exacte features en actuele prijzen: zie de prijzenpagina.",
    },
    {
      category: "Abonnementen",
      question: "Kan ik gratis proberen voordat ik betaal?",
      answer:
        "Ja. Je start gratis met het Basis-plan. Upgraden kan altijd later en je zit niet vast aan een proefperiode met creditcard.",
    },
    {
      category: "Abonnementen",
      question: "Hoe betaal ik en wanneer wordt er afgeschreven?",
      answer:
        "Na upgrade betaal je via de aangeboden betaalmethoden. Je abonnement wordt periodiek afgerekend (maandelijks of jaarlijks). De exacte betaalopties en facturatie vind je bij het upgraden of op de prijzenpagina.",
    },
    {
      category: "Abonnementen",
      question: "Wat gebeurt er als ik downgrade of stop?",
      answer:
        "Je kunt op elk moment downgraden of opzeggen. Je behoudt toegang tot je abonnement tot het einde van de lopende periode. Daarna ga je terug naar het gratis plan. We raden aan om vóór downgrade eventueel exports te maken als je die nodig hebt.",
    },

    // Technische vragen
    {
      category: "Technische vragen",
      question: "Op welke apparaten kan ik de app gebruiken?",
      answer:
        "Je kunt de app gebruiken via de website en via mobiel (iOS/Android). Je logt overal in met hetzelfde account en je gegevens synchroniseren automatisch.",
    },
    {
      category: "Technische vragen",
      question: "Werkt de app ook zonder internetverbinding?",
      answer:
        "De meeste functies werken online omdat gegevens realtime synchroniseren. In de mobiele app kan er beperkte offline inzage zijn, maar voor wijzigingen en synchronisatie is internet nodig.",
    },
    {
      category: "Technische vragen",
      question: "Ik ontvang geen notificaties—wat kan ik doen?",
      answer:
        "Controleer je app-instellingen én de notificatie-instellingen van je toestel. Zet energiebesparing/achtergrondbeperkingen uit voor de app. Log eventueel uit en opnieuw in. Blijft het probleem? Neem contact op met support en vermeld je toestel + versie.",
    },
    {
      category: "Technische vragen",
      question: "De app is traag of crasht—wat nu?",
      answer:
        "Sluit de app volledig af en start opnieuw. Controleer of je de nieuwste versie gebruikt en of je verbinding stabiel is. Helpt dat niet, herstart je toestel. Als het aanhoudt: contacteer support met een korte omschrijving en je toesteltype.",
    },
  ];

  const categories = useMemo(
    () => ["Alle", "Algemeen", "Account & Toegang", "Functionaliteit", "Privacy & Veiligheid", "Abonnementen", "Technische vragen"],
    []
  );

  const filteredFAQs = useMemo(() => {
    const term = normalize(searchTerm);

    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === "Alle" || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!term) return true;

      return (
        normalize(faq.question).includes(term) ||
        normalize(faq.answer).includes(term) ||
        normalize(faq.category).includes(term)
      );
    });
  }, [faqs, searchTerm, selectedCategory]);

  const toggleFAQ = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="FAQ | CoParenting"
        description="Antwoorden op veelgestelde vragen over CoParenting: co-ouderschap, koppelen, agenda, logboek, privacy en abonnementen."
        canonicalUrl={(import.meta as any).env?.VITE_SITE_URL ? `${(import.meta as any).env.VITE_SITE_URL}/faq` : undefined}
        ogTitle="Veelgestelde vragen | CoParenting"
        ogDescription="Vind snel antwoorden over co-ouderschap, functies, privacy, hulpverleners en abonnementen."
      />

      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Antwoorden die je snel verder helpen
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Veelgestelde vragen
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Zoek op onderwerp of filter op categorie. Staat je vraag er niet bij? Neem contact op — we helpen je graag.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy-first
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Veilig delen met rechten
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Duidelijke communicatie
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          {/* Search */}
          <div className="mt-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Zoek in veelgestelde vragen..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Als je zoekt, klap alles dicht zodat je sneller scan’t
                  setOpenIndex(null);
                }}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-slate-900 placeholder-slate-400 bg-white"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mt-6">
            <div className="flex flex-wrap gap-2.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setOpenIndex(null);
                  }}
                  className={cx(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    selectedCategory === category
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? "antwoord" : "antwoorden"} gevonden
              {selectedCategory !== "Alle" ? (
                <span className="text-slate-400"> • Categorie: {selectedCategory}</span>
              ) : null}
            </div>

            {(searchTerm || selectedCategory !== "Alle") ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Alle");
                  setOpenIndex(0);
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Reset filters
              </button>
            ) : null}
          </div>

          {/* FAQ Items */}
          <div className="mt-6 space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={`${faq.category}-${faq.question}-${index}`}
                    className={cx(
                      "bg-white rounded-2xl border overflow-hidden transition",
                      isOpen ? "border-blue-200 shadow-sm" : "border-slate-200 hover:border-blue-200"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      className="w-full px-6 py-5 flex items-start justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {faq.question}
                        </h3>
                      </div>

                      <div className="flex-shrink-0 mt-1">
                        {isOpen ? (
                          <ChevronUp className="w-6 h-6 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="px-6 pb-6 pt-1">
                        <div className="pl-6 text-slate-700 leading-relaxed border-l-4 border-blue-200">
                          {faq.answer}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold mb-1">Geen resultaten gevonden</p>
                <p className="text-sm text-slate-500">Probeer een andere zoekterm of categorie.</p>
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-10 text-center text-white shadow-xl shadow-blue-200/50">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Staat je vraag er niet bij?</h2>
            <p className="text-blue-100 mb-7 max-w-2xl mx-auto leading-relaxed">
              Laat het ons weten. We reageren zo snel mogelijk en helpen je graag verder.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-blue-700 rounded-2xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Neem contact op
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="mt-6 text-xs text-blue-100">
              Tip: voeg in je bericht je e-mailadres, toesteltype en een korte beschrijving toe.
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link
              to="/pricing"
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Bekijk prijzen
              </h3>
              <p className="text-sm text-slate-600">Ontdek welk abonnement bij jouw situatie past.</p>
            </Link>

            <Link
              to="/blog"
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Lees de blog
              </h3>
              <p className="text-sm text-slate-600">Tips en inzichten om co-ouderschap rustiger te maken.</p>
            </Link>

            <Link
              to="/register"
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Start gratis
              </h3>
              <p className="text-sm text-slate-600">Begin vandaag nog met overzicht en structuur.</p>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
