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
  link?: { href: string; label: string; download?: string };
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
    { category: "Algemeen", question: "Voor wie is deze app geschikt?", answer: "Voor co-ouders die afspraken en communicatie helder willen organiseren, ook als samenwerken lastig is. Daarnaast is er (afhankelijk van je abonnement) een portaal voor hulpverleners zoals mediators, gezinscoaches of therapeuten om mee te kijken en te ondersteunen binnen duidelijke rechten." },
    { category: "Algemeen", question: "Moet mijn ex-partner ook een account aanmaken?", answer: "Ja. Voor gedeelde functies (agenda, logboek, verzoeken) maken beide ouders een eigen account aan. Jullie koppelen daarna veilig via een koppelcode of uitnodiging. Zo heeft ieder een eigen login en blijven rechten en privacy duidelijk." },
    { category: "Algemeen", question: "Werkt de app ook als we (bijna) geen direct contact hebben?", answer: "Ja. De app is juist geschikt wanneer direct contact lastig is. Met het verzoeken-systeem en duidelijke, terugvindbare communicatie verminder je ruis en misverstanden. Alles blijft geordend en chronologisch beschikbaar." },
    { category: "Algemeen", question: "Moet ik een advocaat of mediator hebben om de app te gebruiken?", answer: "Nee, dat hoeft helemaal niet. CoParenting is voor alle co-ouders, ongeacht de fase van de scheiding of hoe de afspraken geregeld zijn. Je kunt de app gebruiken als je net gescheiden bent, als afspraken al vaststaan of als alles allang geregeld is. Een hulpverlener kan later altijd toegang krijgen als dat handig is." },
    { category: "Algemeen", question: "Is de app ook geschikt als de scheiding net heeft plaatsgevonden?", answer: "Ja, juist ook dan. Hoe eerder je een gedeeld systeem hebt voor afspraken en communicatie, hoe minder ruis en misverstanden er ontstaan. De app helpt je om ook in een emotioneel zware periode helder en gedocumenteerd te communiceren. Je hoeft geen vaststaand ouderschapsplan te hebben om te starten." },
    // Account & Toegang
    { category: "Account & Toegang", question: "Hoe koppel ik mijn account aan die van mijn co-ouder?", answer: "Na registratie ga je naar Instellingen > Koppelen. Daar zie je een koppelcode. Deel die code met je co-ouder via een veilig kanaal (bijv. SMS/WhatsApp). Je co-ouder voert de code in bij Instellingen > Koppelen. Na bevestiging zijn jullie gekoppeld en delen jullie de gezinsgegevens volgens de ingestelde rechten." },
    { category: "Account & Toegang", question: "Kan ik meerdere gezinnen beheren in één account?", answer: "Op dit moment is de app ontworpen voor één gezinssituatie per account. Als je meerdere situaties hebt, is het het meest praktisch om voor elke situatie een apart account te gebruiken (met een ander e-mailadres)." },
    { category: "Account & Toegang", question: "Wat als mijn co-ouder niet wil meewerken of de app niet wil gebruiken?", answer: "De gedeelde functies (agenda, verzoeken, logboek) werken alleen als beide ouders een account aanmaken en gekoppeld zijn. Als je co-ouder nog niet wil meedoen, kun je de app alvast zelf gebruiken als persoonlijk logboek. Sommige ouders sturen hun co-ouder een uitnodiging met uitleg; anderen wachten op een beter moment. Je kunt altijd later koppelen als de ander alsnog mee wil doen." },
    { category: "Account & Toegang", question: "Kan ik de app gebruiken als de omgangsregeling nog niet vaststaat?", answer: "Ja. Je hoeft geen officieel ouderschapsplan of vaste regeling te hebben om te beginnen. Je kunt afspraken vastleggen zoals ze op dat moment zijn, ook als ze tijdelijk of informeel zijn. Dat geeft overzicht en een duidelijke geschiedenis, wat later van pas kan komen als de regeling formeel vastgelegd wordt." },
    { category: "Account & Toegang", question: "Wat als ik mijn wachtwoord ben vergeten?", answer: "Gebruik op de inlogpagina 'Wachtwoord vergeten?'. Je ontvangt een e-mail om je wachtwoord te resetten. Controleer ook je spam/junk. Lukt het niet? Neem contact op met support via de contactpagina." },
    { category: "Account & Toegang", question: "Hoe kan ik mijn account extra beveiligen?", answer: "Gebruik een sterk, uniek wachtwoord (liefst via een password manager), log uit op gedeelde apparaten en deel je wachtwoord nooit. We adviseren ook om je e-mailaccount goed te beveiligen, omdat reset-links daarheen gaan." },
    // Functionaliteit
    { category: "Functionaliteit", question: "Hoe werkt de gedeelde agenda?", answer: "Beide ouders zien dezelfde agenda-items. Je voegt afspraken toe (wissels, school, sport, doktersafspraken) en koppelt ze eventueel aan een kind. Wijzigingen zijn direct zichtbaar en kunnen notificaties triggeren. Zo voorkom je misverstanden over wie-wat-wanneer." },
    { category: "Functionaliteit", question: "Wat kan ik bijhouden in het logboek?", answer: "Alles wat relevant is voor je kind(eren): gezondheid, school, gedrag, bijzonderheden, afspraken en belangrijke gebeurtenissen. Het logboek is chronologisch, waardoor je informatie snel terugvindt en (indien nodig) kunt delen met een hulpverlener." },
    { category: "Functionaliteit", question: "Kan ik terugkijken in de geschiedenis van het logboek?", answer: "Ja. Het logboek is chronologisch opgebouwd en volledig doorzoekbaar. Je kunt altijd terugkijken naar eerdere notities, ook van maanden geleden. Met een betaald abonnement kun je bovendien exports maken van een geselecteerde periode, handig voor eigen administratie of gesprekken met een hulpverlener." },
    { category: "Functionaliteit", question: "Hoe stuur ik een verzoek naar mijn co-ouder?", answer: "Ga naar Verzoeken en kies 'Nieuw verzoek'. Selecteer een type (bijv. ruilen, extra tijd, vakantie) of maak je eigen verzoek. Je co-ouder kan accepteren, afwijzen of een tegenvoorstel doen. Alles blijft netjes gelogd." },
    { category: "Functionaliteit", question: "Kunnen kinderen ook inloggen of meekijken?", answer: "Nee. De app is uitsluitend voor de ouders. Kinderen hebben geen eigen account en kunnen niet meekijken. Dit is bewust: het platform is bedoeld als communicatiemiddel tussen co-ouders, niet als iets waarbij kinderen betrokken zijn of druk door voelen." },
    { category: "Functionaliteit", question: "Kan ik berichten of logboek-items verwijderen?", answer: "Om misverstanden te voorkomen en afspraken betrouwbaar terug te kunnen zien, zijn items meestal niet zomaar te verwijderen. In veel gevallen kun je wel corrigeren of aanvullen, met een duidelijke registratie dat er iets is aangepast. Als er een gegronde reden is om iets te verwijderen, kan support meedenken." },
    { category: "Functionaliteit", question: "Hoe kan ik alle informatie exporteren?", answer: "Met een betaald abonnement kun je exports maken (bijv. per kind of per periode) naar een overzichtelijke PDF. Handig voor eigen administratie, gesprekken met hulpverleners of juridische context. Je vindt dit bij Instellingen > Export." },
    // Privacy & Veiligheid
    { category: "Privacy & Veiligheid", question: "Hoe veilig is mijn data?", answer: "We behandelen privacy en veiligheid als basis. Data wordt opgeslagen op beveiligde infrastructuur en je bepaalt zelf wie toegang heeft. Je gegevens worden niet verkocht aan derden. Lees het privacybeleid voor de volledige uitleg over opslag, verwerking en rechten." },
    { category: "Privacy & Veiligheid", question: "Zijn jullie AVG/GDPR-compliant?", answer: "Ja. CoParenting voldoet aan de Algemene Verordening Gegevensbescherming (AVG), de Nederlandse en Europese privacywetgeving. Je hebt recht op inzage, correctie en verwijdering van je gegevens. We verwerken alleen gegevens die nodig zijn voor de werking van de app en delen niets met derden zonder jouw toestemming. Meer details vind je in ons privacybeleid." },
    { category: "Privacy & Veiligheid", question: "Kan mijn co-ouder zien wat ik typ vóórdat ik verstuur?", answer: "Nee. Alleen definitief verstuurde berichten/requests/logboekitems worden zichtbaar voor de ander. Je kunt dus rustig formuleren voordat je iets deelt." },
    { category: "Privacy & Veiligheid", question: "Is de app geschikt bij een hoog-conflict situatie of vechtscheiding?", answer: "Ja, de app is ook geschikt en soms juist extra waardevol bij een hoog-conflict situatie. Door alle communicatie via de app te laten verlopen, verminder je direct contact en de bijbehorende spanningen. Alles is schriftelijk, gedateerd en terugvindbaar. Dit sluit goed aan bij de parallel parenting-aanpak, waarbij ouders zo min mogelijk direct contact hebben maar toch gestructureerd samenwerken voor de kinderen. Lees ook onze blogpost over hoog-conflict co-ouderschap voor praktische tips." },
    { category: "Privacy & Veiligheid", question: "Kan ik de exportdata gebruiken als bewijs bij de rechter?", answer: "De exports die je via de app kunt maken (logboek, berichten, verzoeken) vormen een gedocumenteerd en chronologisch overzicht van jullie communicatie en afspraken. Dit kan ondersteunend zijn in gesprekken met een mediator, hulpverlener of advocaat. Of en hoe dit juridisch als bewijs kan dienen, hangt af van de specifieke situatie. Raadpleeg hiervoor een juridisch professional. Zorg in ieder geval dat je tijdig exports maakt als je een procedure overweegt." },
    { category: "Privacy & Veiligheid", question: "Wat gebeurt er met mijn data bij een juridische procedure?", answer: "Je data blijft van jou. We verstrekken geen gegevens aan derden zonder jouw toestemming, behalve als we daartoe wettelijk verplicht zijn. Je kunt zelf exports maken om je administratie te onderbouwen." },
    { category: "Privacy & Veiligheid", question: "Wat gebeurt er met mijn data als ik stop met de app?", answer: "Als je jouw account opzegt, heb je recht op verwijdering van je gegevens (conform de AVG). We raden aan om voor opzegging een export te maken als je je administratie wilt bewaren. Na verwijdering zijn je gegevens niet meer toegankelijk. Heb je specifieke vragen over dataverwijdering? Neem dan contact op met onze support." },
    { category: "Privacy & Veiligheid", question: "Hoe werkt toegang voor hulpverleners?", answer: "Je kunt (afhankelijk van je abonnement) een hulpverlener veilig toegang geven met duidelijke rechten. Denk aan alleen lezen of beperkt reageren. Je kunt deze toegang altijd intrekken." },
    // Abonnementen
    { category: "Abonnementen", question: "Wat is het verschil tussen FREE, PLUS en PRO?", answer: "FREE is gratis en bevat de kernfuncties. PLUS voegt extra mogelijkheden toe zoals meerdere kinderen, bijlagen, foto's en PDF-export. PRO is bedoeld wanneer je ook met hulpverleners wilt werken en geavanceerde exports wil. Voor exacte functies en actuele prijzen: zie de prijzenpagina." },
    { category: "Abonnementen", question: "Betalen beide ouders, of maar één van ons?", answer: "Maar één ouder hoeft te betalen. Zodra een van de twee gekoppelde ouders een betaald abonnement afsluit, hebben beide ouders automatisch toegang tot alle bijbehorende premiumfuncties. Je hoeft dit niet dubbel te betalen." },
    { category: "Abonnementen", question: "Kan ik gratis proberen voordat ik betaal?", answer: "Ja. Je start gratis met het FREE-plan. PLUS en PRO zijn 7 dagen gratis te proberen. Je zit niet vast aan een proefperiode met creditcard." },
    { category: "Abonnementen", question: "Hoe betaal ik en wanneer wordt er afgeschreven?", answer: "Een van de twee gekoppelde ouders neemt een betaald abonnement. Zodra het abonnement actief is, profiteren beide gekoppelde ouders automatisch van de premiumfuncties. Het abonnement wordt periodiek afgerekend (maandelijks of jaarlijks). De exacte betaalopties en facturatie vind je bij het upgraden of op de prijzenpagina." },
    { category: "Abonnementen", question: "Wat gebeurt er als ik downgrade of stop?", answer: "Je kunt op elk moment downgraden of opzeggen. Je behoudt toegang tot je abonnement tot het einde van de lopende periode. Daarna ga je terug naar het gratis plan. We raden aan om vóór downgrade eventueel exports te maken als je die nodig hebt." },
    // Technische vragen
    { category: "Technische vragen", question: "Op welke apparaten kan ik de app gebruiken?", answer: "De app werkt op Android-telefoons en -tablets. Je kunt de APK direct downloaden via de knop op de homepage. iPhone- en iPad-gebruikers gebruiken de webversie via de browser, die op mobiel uitstekend werkt. Je logt overal in met hetzelfde account en je gegevens synchroniseren automatisch." },
    { category: "Technische vragen", question: "Hoe download en installeer ik de Android-app?", answer: "Open het APK-bestand op je Android-telefoon en volg de installatiestappen. Je moet mogelijk éénmalig in je instellingen 'Installatie uit onbekende bronnen' toestaan (dit is normaal voor apps buiten de Play Store). Na installatie log je in met je bestaande account, of maak je een nieuw account aan.", link: { href: "/CoParenting Platform 1.1.3.apk", label: "Android app downloaden", download: "CoParenting-1.1.3.apk" } },
    { category: "Technische vragen", question: "Werkt de app ook zonder internetverbinding?", answer: "De meeste functies werken online omdat gegevens realtime synchroniseren. In de mobiele app kan er beperkte offline inzage zijn, maar voor wijzigingen en synchronisatie is internet nodig." },
    { category: "Technische vragen", question: "Ik ontvang geen notificaties, wat kan ik doen?", answer: "Controleer je app-instellingen én de notificatie-instellingen van je toestel. Zet energiebesparing/achtergrondbeperkingen uit voor de app. Log eventueel uit en opnieuw in. Blijft het probleem? Neem contact op met support en vermeld je toestel en versie." },
    { category: "Technische vragen", question: "De app is traag of crasht, wat nu?", answer: "Sluit de app volledig af en start opnieuw. Controleer of je de nieuwste versie gebruikt en of je verbinding stabiel is. Helpt dat niet, herstart je toestel. Als het aanhoudt: contacteer support met een korte omschrijving en je toesteltype." },
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
        title="FAQ | CoParenting"
        description="Antwoorden op veelgestelde vragen over CoParenting: co-ouderschap, koppelen, agenda, logboek, privacy en abonnementen."
        canonicalUrl={(import.meta as any).env?.VITE_SITE_URL ? `${(import.meta as any).env.VITE_SITE_URL}/faq` : undefined}
        ogTitle="Veelgestelde vragen | CoParenting"
        ogDescription="Vind snel antwoorden over co-ouderschap, functies, privacy, hulpverleners en abonnementen."
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
                        {faq.link && (
                          <a
                            href={faq.link.href}
                            download={faq.link.download}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 10,
                              marginTop: 16,
                              background: "#1a1a1a",
                              color: "#fff",
                              padding: "10px 18px",
                              borderRadius: 10,
                              textDecoration: "none",
                              fontSize: 14,
                              fontWeight: 500,
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1C2.67 17 2 17.67 2 18.5v5c0 .83.67 1.5 1.5 1.5S5 24.33 5 23.5v-5C5 17.67 4.33 17 3.5 17zm17 0c-.83 0-1.5.67-1.5 1.5v5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5c0-.83-.67-1.5-1.5-1.5zM15.53 2.16l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1c-.74 0-1.45.14-2.1.38L8.34.1c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.27 1.27C7.19 3.28 6 5.27 6 7.5V8h12v-.5c0-2.2-1.15-4.17-2.47-5.34zM10 6H9V5h1v1zm5 0h-1V5h1v1z" fill="#78C257"/>
                            </svg>
                            {faq.link.label}
                          </a>
                        )}
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
