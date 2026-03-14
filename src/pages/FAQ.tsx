// src/pages/FAQ.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import Seo from "../components/Seo";

/* ─── Design tokens ─── */
const tk = {
  sand:        "#f5f0e8",
  sandDark:    "#ede7d9",
  warm:        "#c8b89a",
  slate:       "#2d3142",
  slateLight:  "#4a506b",
  moss:        "#4a6741",
  mossLight:   "#6b9467",
  terra:       "#b07d5a",
  cream:       "#faf8f4",
  white:       "#ffffff",
  text:        "#2d3142",
  muted:       "#6b7080",
  border:      "#e8e1d6",
  borderLight: "#e5dfd4",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .fq-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .fq-serif { font-family: 'Lora', Georgia, serif; }

  @keyframes fq-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fq-fade-up { animation: fq-fadeUp 0.65s ease both; }
  .fq-delay-1 { animation-delay: 0.10s; }
  .fq-delay-2 { animation-delay: 0.20s; }

  .fq-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  /* Search */
  .fq-search {
    width: 100%;
    padding: 14px 18px 14px 48px;
    border: 1.5px solid #e8e1d6;
    border-radius: 12px;
    background: #ffffff;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #2d3142;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .fq-search::placeholder { color: #b0a898; }
  .fq-search:focus {
    border-color: #4a6741;
    box-shadow: 0 0 0 3px rgba(74,103,65,0.1);
  }

  /* Category pill */
  .fq-cat {
    padding: 7px 16px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 500;
    border: 1.5px solid #e8e1d6;
    background: #ffffff;
    color: #6b7080;
    cursor: pointer;
    transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .fq-cat:hover  { border-color: #4a6741; color: #4a6741; }
  .fq-cat.active { background: #4a6741; border-color: #4a6741; color: #ffffff; }

  /* FAQ accordion item */
  .fq-item {
    border-top: 1px solid #e5dfd4;
  }
  .fq-item:last-child { border-bottom: 1px solid #e5dfd4; }

  .fq-item-open {
    /* highlight the open item softly */
  }

  .fq-trigger {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 26px 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: 'DM Sans', sans-serif;
  }

  .fq-trigger:hover .fq-q { color: #4a6741; }

  .fq-cat-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c8b89a;
    margin-bottom: 6px;
    display: block;
  }

  .fq-q {
    font-size: 16px;
    font-weight: 500;
    color: #2d3142;
    line-height: 1.5;
    transition: color 0.18s;
  }

  .fq-chevron {
    flex-shrink: 0;
    margin-top: 3px;
    color: #c8b89a;
    transition: transform 0.25s;
  }
  .fq-chevron.open { transform: rotate(180deg); color: #4a6741; }

  .fq-answer {
    padding: 0 0 28px 0;
    font-size: 15px;
    color: #6b7080;
    line-height: 1.8;
    border-left: 2px solid #e5dfd4;
    padding-left: 20px;
    margin-left: 2px;
    animation: fq-fadeUp 0.3s ease;
  }

  /* Quick links */
  .fq-quick-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 32px;
    text-decoration: none;
    display: block;
    transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
  }
  .fq-quick-card:hover {
    box-shadow: 0 10px 36px rgba(45,49,66,0.10);
    transform: translateY(-3px);
    border-color: #4a6741;
  }

  /* Buttons */
  .fq-btn-white {
    display: inline-flex; align-items: center; gap: 10px;
    background: #fff; color: #4a6741;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .fq-btn-white:hover {
    background: #f0ece4;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.14);
  }

  .fq-btn-ghost-inline {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 12px 24px; border-radius: 12px;
    font-weight: 500; font-size: 15px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .fq-btn-ghost-inline:hover { border-color: #4a506b; transform: translateY(-2px); }

  .fq-cta-wrap {
    background: #2d3142;
    border-radius: 32px;
    padding: 64px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .fq-cta-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(74,103,65,0.35) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 20%, rgba(176,125,90,0.2) 0%, transparent 55%);
    pointer-events: none;
  }

  /* Empty state */
  .fq-empty {
    text-align: center;
    padding: 64px 32px;
    border: 1px dashed #e8e1d6;
    border-radius: 20px;
    background: #fff;
  }

  @media (max-width: 768px) {
    .fq-quick-grid { grid-template-columns: 1fr !important; }
    .fq-cta-wrap   { padding: 48px 28px; }
  }
`;

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export default function FAQ() {
  const [searchTerm, setSearchTerm]         = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [openIndex, setOpenIndex]           = useState<number | null>(0);

  const faqs: FAQItem[] = [
    // Algemeen
    { category: "Algemeen", question: "Wat is co-ouderschap en hoe helpt deze app daarbij?", answer: "Co-ouderschap betekent dat beide ouders na een scheiding actief betrokken blijven bij de opvoeding. CoParenting helpt door afspraken, communicatie en documentatie op één plek te bundelen: een gedeelde agenda, logboek, verzoeken (met acceptatie/afwijzing/tegenvoorstel) en export. Dat geeft overzicht, voorkomt misverstanden en helpt om rust en voorspelbaarheid voor kinderen te creëren." },
    { category: "Algemeen", question: "Voor wie is deze app geschikt?", answer: "Voor co-ouders die afspraken en communicatie helder willen organiseren — ook als samenwerken lastig is. Daarnaast is er (afhankelijk van je abonnement) een portaal voor hulpverleners zoals mediators, gezinscoaches of therapeuten om mee te kijken en te ondersteunen binnen duidelijke rechten." },
    { category: "Algemeen", question: "Moet mijn ex-partner ook een account aanmaken?", answer: "Ja. Voor gedeelde functies (agenda, logboek, verzoeken) maken beide ouders een eigen account aan. Jullie koppelen daarna veilig via een koppelcode of uitnodiging. Zo heeft ieder een eigen login en blijven rechten en privacy duidelijk." },
    { category: "Algemeen", question: "Werkt de app ook als we (bijna) geen direct contact hebben?", answer: "Ja. De app is juist geschikt wanneer direct contact lastig is. Met het verzoeken-systeem en duidelijke, terugvindbare communicatie verminder je ruis en misverstanden. Alles blijft geordend en chronologisch beschikbaar." },
    // Account & Toegang
    { category: "Account & Toegang", question: "Hoe koppel ik mijn account aan die van mijn co-ouder?", answer: "Na registratie ga je naar Instellingen > Koppelen. Daar zie je een koppelcode. Deel die code met je co-ouder via een veilig kanaal (bijv. SMS/WhatsApp). Je co-ouder voert de code in bij Instellingen > Koppelen. Na bevestiging zijn jullie gekoppeld en delen jullie de gezinsgegevens volgens de ingestelde rechten." },
    { category: "Account & Toegang", question: "Kan ik meerdere gezinnen beheren in één account?", answer: "Op dit moment is de app ontworpen voor één gezinssituatie per account. Als je meerdere situaties hebt, is het het meest praktisch om voor elke situatie een apart account te gebruiken (met een ander e-mailadres)." },
    { category: "Account & Toegang", question: "Wat als ik mijn wachtwoord ben vergeten?", answer: "Gebruik op de inlogpagina 'Wachtwoord vergeten?'. Je ontvangt een e-mail om je wachtwoord te resetten. Controleer ook je spam/junk. Lukt het niet? Neem contact op met support via de contactpagina." },
    { category: "Account & Toegang", question: "Hoe kan ik mijn account extra beveiligen?", answer: "Gebruik een sterk, uniek wachtwoord (liefst via een password manager), log uit op gedeelde apparaten en deel je wachtwoord nooit. We adviseren ook om je e-mailaccount goed te beveiligen, omdat reset-links daarheen gaan." },
    // Functionaliteit
    { category: "Functionaliteit", question: "Hoe werkt de gedeelde agenda?", answer: "Beide ouders zien dezelfde agenda-items. Je voegt afspraken toe (wissels, school, sport, doktersafspraken) en koppelt ze eventueel aan een kind. Wijzigingen zijn direct zichtbaar en kunnen notificaties triggeren. Zo voorkom je misverstanden over wie-wat-wanneer." },
    { category: "Functionaliteit", question: "Wat kan ik bijhouden in het logboek?", answer: "Alles wat relevant is voor je kind(eren): gezondheid, school, gedrag, bijzonderheden, afspraken en belangrijke gebeurtenissen. Het logboek is chronologisch, waardoor je informatie snel terugvindt en (indien nodig) kunt delen met een hulpverlener." },
    { category: "Functionaliteit", question: "Hoe stuur ik een verzoek naar mijn co-ouder?", answer: "Ga naar Verzoeken en kies 'Nieuw verzoek'. Selecteer een type (bijv. ruilen, extra tijd, vakantie) of maak je eigen verzoek. Je co-ouder kan accepteren, afwijzen of een tegenvoorstel doen. Alles blijft netjes gelogd." },
    { category: "Functionaliteit", question: "Kan ik berichten of logboek-items verwijderen?", answer: "Om misverstanden te voorkomen en afspraken betrouwbaar terug te kunnen zien, zijn items meestal niet zomaar te verwijderen. In veel gevallen kun je wel corrigeren of aanvullen, met een duidelijke registratie dat er iets is aangepast. Als er een gegronde reden is om iets te verwijderen, kan support meedenken." },
    { category: "Functionaliteit", question: "Hoe kan ik alle informatie exporteren?", answer: "Met een betaald abonnement kun je exports maken (bijv. per kind of per periode) naar een overzichtelijke PDF. Handig voor eigen administratie, gesprekken met hulpverleners of juridische context. Je vindt dit bij Instellingen > Export." },
    // Privacy & Veiligheid
    { category: "Privacy & Veiligheid", question: "Hoe veilig is mijn data?", answer: "We behandelen privacy en veiligheid als basis. Data wordt opgeslagen op beveiligde infrastructuur en je bepaalt zelf wie toegang heeft. Je gegevens worden niet verkocht aan derden. Lees het privacybeleid voor de volledige uitleg over opslag, verwerking en rechten." },
    { category: "Privacy & Veiligheid", question: "Kan mijn co-ouder zien wat ik typ vóórdat ik verstuur?", answer: "Nee. Alleen definitief verstuurde berichten/requests/logboekitems worden zichtbaar voor de ander. Je kunt dus rustig formuleren voordat je iets deelt." },
    { category: "Privacy & Veiligheid", question: "Wat gebeurt er met mijn data bij een juridische procedure?", answer: "Je data blijft van jou. We verstrekken geen gegevens aan derden zonder jouw toestemming, behalve als we daartoe wettelijk verplicht zijn. Je kunt zelf exports maken om je administratie te onderbouwen." },
    { category: "Privacy & Veiligheid", question: "Hoe werkt toegang voor hulpverleners?", answer: "Je kunt (afhankelijk van je abonnement) een hulpverlener veilig toegang geven met duidelijke rechten. Denk aan alleen lezen of beperkt reageren. Je kunt deze toegang altijd intrekken." },
    // Abonnementen
    { category: "Abonnementen", question: "Wat is het verschil tussen Basis, Pro en Familie?", answer: "Basis is gratis en bevat de kernfuncties. Pro voegt extra mogelijkheden toe zoals uitgebreidere exports en meer ruimte. Familie is bedoeld wanneer je ook met hulpverleners wilt werken en extra ondersteuning wil. Voor exacte features en actuele prijzen: zie de prijzenpagina." },
    { category: "Abonnementen", question: "Kan ik gratis proberen voordat ik betaal?", answer: "Ja. Je start gratis met het Basis-plan. Upgraden kan altijd later en je zit niet vast aan een proefperiode met creditcard." },
    { category: "Abonnementen", question: "Hoe betaal ik en wanneer wordt er afgeschreven?", answer: "Na upgrade betaal je via de aangeboden betaalmethoden. Je abonnement wordt periodiek afgerekend (maandelijks of jaarlijks). De exacte betaalopties en facturatie vind je bij het upgraden of op de prijzenpagina." },
    { category: "Abonnementen", question: "Wat gebeurt er als ik downgrade of stop?", answer: "Je kunt op elk moment downgraden of opzeggen. Je behoudt toegang tot je abonnement tot het einde van de lopende periode. Daarna ga je terug naar het gratis plan. We raden aan om vóór downgrade eventueel exports te maken als je die nodig hebt." },
    // Technische vragen
    { category: "Technische vragen", question: "Op welke apparaten kan ik de app gebruiken?", answer: "Je kunt de app gebruiken via de website en via mobiel (iOS/Android). Je logt overal in met hetzelfde account en je gegevens synchroniseren automatisch." },
    { category: "Technische vragen", question: "Werkt de app ook zonder internetverbinding?", answer: "De meeste functies werken online omdat gegevens realtime synchroniseren. In de mobiele app kan er beperkte offline inzage zijn, maar voor wijzigingen en synchronisatie is internet nodig." },
    { category: "Technische vragen", question: "Ik ontvang geen notificaties — wat kan ik doen?", answer: "Controleer je app-instellingen én de notificatie-instellingen van je toestel. Zet energiebesparing/achtergrondbeperkingen uit voor de app. Log eventueel uit en opnieuw in. Blijft het probleem? Neem contact op met support en vermeld je toestel + versie." },
    { category: "Technische vragen", question: "De app is traag of crasht — wat nu?", answer: "Sluit de app volledig af en start opnieuw. Controleer of je de nieuwste versie gebruikt en of je verbinding stabiel is. Helpt dat niet, herstart je toestel. Als het aanhoudt: contacteer support met een korte omschrijving en je toesteltype." },
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
      return normalize(faq.question).includes(term) || normalize(faq.answer).includes(term) || normalize(faq.category).includes(term);
    });
  }, [faqs, searchTerm, selectedCategory]);

  const toggle = (i: number) => setOpenIndex(cur => cur === i ? null : i);
  const hasFilters = searchTerm !== "" || selectedCategory !== "Alle";

  return (
    <div className="fq-page">
      <style>{globalStyles}</style>
      <Seo
        title="Veelgestelde vragen over co-ouderschap | FAQ CoParenting"
        description="Antwoorden op veelgestelde vragen over CoParenting: hoe werkt de app voor gescheiden ouders, koppelen met co-ouder, agenda, logboek, privacy, hulpverleners en abonnementen."
        canonicalUrl="https://coparenting.nl/faq"
        ogTitle="Veelgestelde vragen | CoParenting – App voor gescheiden ouders"
        ogDescription="Vind snel antwoorden over co-ouderschap, de gedeelde agenda, logboek, hulpverleners, privacy en abonnementen van CoParenting."
        ogUrl="https://coparenting.nl/faq"
        keywords={[
          "co-ouderschap FAQ",
          "vragen co-ouderschap app",
          "co ouderschap app uitleg",
          "gedeelde agenda ouders vragen",
          "co-parenting platform help",
          "gescheiden ouders app vragen",
          "logboek co-ouderschap",
          "hulpverlener co-ouderschap toegang",
          "co ouderschap privacy",
          "omgangsregeling app vragen",
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Wat is co-ouderschap en hoe helpt CoParenting daarbij?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Co-ouderschap betekent dat beide ouders na een scheiding actief betrokken blijven bij de opvoeding. CoParenting helpt door afspraken, communicatie en documentatie op één plek te bundelen: een gedeelde agenda, logboek, verzoeken en export. Dat geeft overzicht, voorkomt misverstanden en helpt om rust en voorspelbaarheid voor kinderen te creëren."
              }
            },
            {
              "@type": "Question",
              "name": "Moet mijn ex-partner ook een account aanmaken?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ja. Voor gedeelde functies (agenda, logboek, verzoeken) maken beide ouders een eigen account aan. Jullie koppelen daarna veilig via een koppelcode of uitnodiging. Zo heeft ieder een eigen login en blijven rechten en privacy duidelijk."
              }
            },
            {
              "@type": "Question",
              "name": "Werkt de app ook als we bijna geen direct contact hebben?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ja. De app is juist geschikt wanneer direct contact lastig is. Met het verzoeken-systeem en duidelijke, terugvindbare communicatie verminder je ruis en misverstanden."
              }
            },
            {
              "@type": "Question",
              "name": "Hoe veilig is mijn data in CoParenting?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Privacy en veiligheid staan centraal. Data wordt opgeslagen op beveiligde infrastructuur en je bepaalt zelf wie toegang heeft. Je gegevens worden niet verkocht aan derden."
              }
            },
            {
              "@type": "Question",
              "name": "Kan ik gratis proberen voordat ik betaal?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ja. Je start gratis met het Basis-plan. Upgraden kan altijd later en je zit niet vast aan een proefperiode met creditcard."
              }
            },
            {
              "@type": "Question",
              "name": "Hoe werkt de gedeelde agenda in CoParenting?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Beide ouders zien dezelfde agenda-items. Je voegt afspraken toe (wissels, school, sport, doktersafspraken) en koppelt ze eventueel aan een kind. Wijzigingen zijn direct zichtbaar en kunnen notificaties triggeren."
              }
            },
            {
              "@type": "Question",
              "name": "Hoe werkt toegang voor hulpverleners?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Je kunt een hulpverlener veilig toegang geven met duidelijke rechten, zoals alleen lezen of beperkt reageren. Je kunt deze toegang altijd intrekken."
              }
            }
          ]
        }}
      />

      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ background: tk.cream, padding: "80px 0 72px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
          <p className="fq-fade-up" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
            Hulp & vragen
          </p>
          <h1 className="fq-serif fq-fade-up fq-delay-1" style={{ fontSize: "clamp(44px, 5vw, 66px)", fontWeight: 500, lineHeight: 1.13, margin: "0 0 24px", color: tk.slate, maxWidth: 640 }}>
            Veelgestelde vragen
          </h1>
          <p className="fq-fade-up fq-delay-2" style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, maxWidth: 500, margin: "0 0 40px" }}>
            Zoek op onderwerp of filter op categorie. Staat je vraag er niet bij?
            Neem contact op — we helpen je graag.
          </p>

          {/* Search */}
          <div className="fq-fade-up fq-delay-2" style={{ maxWidth: 480, position: "relative" as const, marginBottom: 24 }}>
            <Search size={17} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: tk.warm, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Zoek in veelgestelde vragen…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setOpenIndex(null); }}
              className="fq-search"
              aria-label="Zoek in FAQ"
            />
          </div>

          {/* Categories */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setOpenIndex(null); }}
                className={`fq-cat${selectedCategory === cat ? " active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <hr className="fq-rule" />

      {/* ── FAQ BODY ── */}
      <section style={{ background: tk.white, padding: "72px 32px 96px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Result count */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap" as const, gap: 10 }}>
            <span style={{ fontSize: 13, color: tk.muted }}>
              {filteredFAQs.length} {filteredFAQs.length === 1 ? "antwoord" : "antwoorden"} gevonden
              {selectedCategory !== "Alle" && <span style={{ color: tk.warm }}> · {selectedCategory}</span>}
              {searchTerm.trim() && <span style={{ color: tk.warm }}> · "{searchTerm.trim()}"</span>}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setSearchTerm(""); setSelectedCategory("Alle"); setOpenIndex(0); }}
                style={{ fontSize: 13, color: tk.moss, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Accordion */}
          {filteredFAQs.length > 0 ? (
            <div>
              {filteredFAQs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={`${faq.category}-${i}`} className={`fq-item${isOpen ? " fq-item-open" : ""}`}>
                    <button
                      type="button"
                      className="fq-trigger"
                      onClick={() => toggle(i)}
                      aria-expanded={isOpen}
                    >
                      <div style={{ flex: 1 }}>
                        <span className="fq-cat-label">{faq.category}</span>
                        <span className="fq-q">{faq.question}</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`fq-chevron${isOpen ? " open" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="fq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fq-empty">
              <p style={{ fontSize: 17, fontWeight: 500, color: tk.slate, margin: "0 0 8px" }}>Geen resultaten gevonden</p>
              <p style={{ fontSize: 14, color: tk.muted, margin: "0 0 24px" }}>Probeer een andere zoekterm of categorie.</p>
              <button
                className="fq-btn-ghost-inline"
                onClick={() => { setSearchTerm(""); setSelectedCategory("Alle"); setOpenIndex(0); }}
              >
                Reset filters
              </button>
            </div>
          )}

          {/* ── CTA ── */}
          <div style={{ marginTop: 72 }}>
            <div className="fq-cta-wrap">
              <p style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                Niet gevonden?
              </p>
              <h2 className="fq-serif" style={{ position: "relative", zIndex: 1, fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 500, color: "#fff", lineHeight: 1.22, margin: "0 auto 16px", maxWidth: 440 }}>
                Staat je vraag er niet bij?
              </h2>
              <p style={{ position: "relative", zIndex: 1, fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 360, margin: "0 auto 36px", lineHeight: 1.7 }}>
                Laat het ons weten. We reageren zo snel mogelijk en helpen je graag verder.
              </p>
              <div style={{ position: "relative", zIndex: 1 }}>
                <Link to="/contact" className="fq-btn-white">
                  Neem contact op <ArrowRight size={18} />
                </Link>
              </div>
              <p style={{ position: "relative", zIndex: 1, marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                Tip: vermeld je e-mailadres, toesteltype en een korte beschrijving.
              </p>
            </div>
          </div>

          {/* ── QUICK LINKS ── */}
          <div style={{ marginTop: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.warm, margin: "0 0 20px" }}>
              Verder lezen
            </p>
            <div className="fq-quick-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { to: "/pricing", title: "Bekijk prijzen",  desc: "Ontdek welk abonnement bij jouw situatie past." },
                { to: "/blog",    title: "Lees de blog",    desc: "Tips en inzichten om co-ouderschap rustiger te maken." },
                { to: "/register",title: "Start gratis",    desc: "Begin vandaag nog met overzicht en structuur." },
              ].map(({ to, title, desc }) => (
                <Link key={to} to={to} className="fq-quick-card">
                  <div style={{ fontSize: 15, fontWeight: 500, color: tk.slate, marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: tk.muted, lineHeight: 1.65 }}>{desc}</div>
                  <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: tk.moss, fontWeight: 500 }}>
                    Ga verder <ArrowRight size={13} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
