// src/pages/AboutUs.tsx
import { Users, Heart, Shield, Calendar, FileText, MessageSquare, UserPlus, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import Seo from '../components/Seo';

/* ─── Design tokens (zelfde als Homepage) ─── */
const tk = {
  sand:       "#f5f0e8",
  sandDark:   "#ede7d9",
  warm:       "#c8b89a",
  slate:      "#2d3142",
  slateLight: "#4a506b",
  moss:       "#4a6741",
  mossLight:  "#6b9467",
  terra:      "#b07d5a",
  cream:      "#faf8f4",
  white:      "#ffffff",
  text:       "#2d3142",
  muted:      "#6b7080",
  border:     "#e8e1d6",
  borderLight:"#e5dfd4",
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .au-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .au-serif { font-family: 'Lora', Georgia, serif; }

  @keyframes au-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .au-fade-up  { animation: au-fadeUp 0.65s ease both; }
  .au-delay-1  { animation-delay: 0.10s; }
  .au-delay-2  { animation-delay: 0.20s; }

  .au-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  .au-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 36px;
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .au-card:hover {
    box-shadow: 0 12px 40px rgba(45,49,66,0.09);
    transform: translateY(-3px);
  }

  .au-icon-badge {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: #f5f0e8;
    border: 1px solid #e0d8cc;
  }

  .au-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    background: #4a6741; color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .au-btn-primary:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(74,103,65,0.28);
  }

  .au-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .au-btn-ghost:hover {
    border-color: #4a506b;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(45,49,66,0.08);
  }

  .au-btn-white {
    display: inline-flex; align-items: center; gap: 10px;
    background: #ffffff; color: #4a6741;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .au-btn-white:hover {
    background: #f0ece4;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.15);
  }

  .au-btn-ghost-light {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08); color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid rgba(255,255,255,0.2);
    transition: background 0.2s, transform 0.2s;
  }
  .au-btn-ghost-light:hover {
    background: rgba(255,255,255,0.15);
    transform: translateY(-2px);
  }

  .au-cta-wrap {
    background: #2d3142;
    border-radius: 32px;
    padding: 72px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .au-cta-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(74,103,65,0.35) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 20%, rgba(176,125,90,0.2) 0%, transparent 55%);
    pointer-events: none;
  }

  .au-quote-block {
    border-left: 3px solid #4a6741;
    padding: 28px 32px;
    background: #f5f0e8;
    border-radius: 0 16px 16px 0;
  }

  .au-step-num {
    font-family: 'Lora', serif;
    font-size: 48px;
    font-weight: 500;
    color: #ede7d9;
    line-height: 1;
    user-select: none;
  }

  @media (max-width: 768px) {
    .au-two-col   { grid-template-columns: 1fr !important; }
    .au-three-col { grid-template-columns: 1fr !important; }
    .au-cta-wrap  { padding: 48px 28px; }
  }
`;

export function AboutUs() {
  return (
    <>
      <Seo
        title="Over ons | CoParenting – Gebouwd voor gescheiden ouders"
        description="Ontdek hoe CoParenting tot stand is gekomen door samenwerking met ervaringsdeskundigen, mediators en hulpverleners. Een platform voor effectieve communicatie, planning en transparantie in co-ouderschap."
        canonicalUrl="https://coparenting.nl/over-ons"
        ogTitle="Over ons | CoParenting – App voor gescheiden ouders"
        ogDescription="CoParenting is ontwikkeld met en voor ouders die weten hoe uitdagend co-ouderschap kan zijn. Gebouwd met input van mediators en gezinstherapeuten."
        ogUrl="https://coparenting.nl/over-ons"
        keywords={[
          "CoParenting over ons",
          "co-ouderschap app ontwikkeld",
          "co-parenting platform Nederland",
          "gescheiden ouders communicatie app",
          "co ouderschap missie",
          "samen opvoeden platform",
          "co-ouderschap hulpverleners",
          "omgangsregeling app gedeeld ouderschap",
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Organization",
            "name": "CoParenting",
            "description": "Platform voor effectieve communicatie en samenwerking tussen gescheiden ouders in Nederland en België",
            "url": "https://coparenting.nl",
            "foundingDate": "2024",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Provincialeweg 163",
              "postalCode": "9865AG",
              "addressLocality": "Opende",
              "addressCountry": "NL"
            },
            "areaServed": ["NL", "BE"],
            "serviceType": "Co-parenting platform"
          }
        }}
      />

      <div className="au-page">
        <style>{globalStyles}</style>
        <SiteHeader />

        <main>

          {/* ── HERO ── */}
          <section style={{ background: tk.cream, padding: "80px 0 96px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
              <p className="au-fade-up" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
                Ons verhaal
              </p>
              <h1 className="au-serif au-fade-up au-delay-1" style={{ fontSize: "clamp(44px, 5vw, 66px)", fontWeight: 500, lineHeight: 1.13, margin: "0 0 28px", color: tk.slate, maxWidth: 720 }}>
                Gebouwd door mensen die{" "}
                <em style={{ color: tk.moss, fontStyle: "italic" }}>het begrijpen</em>
              </h1>
              <p className="au-fade-up au-delay-2" style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, maxWidth: 580, margin: 0 }}>
                CoParenting is niet bedacht achter een bureau. Het is ontwikkeld met en voor ouders
                die zelf weten hoe uitdagend co-ouderschap kan zijn, en wat er écht nodig is.
              </p>
            </div>
          </section>

          <hr className="au-rule" />

          {/* ── MISSIE ── */}
          <section style={{ background: tk.white, padding: "96px 32px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
              <div className="au-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
                    Waarom wij bestaan
                  </p>
                  <h2 className="au-serif" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 24px" }}>
                    Onze missie
                  </h2>
                  <p style={{ fontSize: 17, color: tk.muted, lineHeight: 1.8, margin: "0 0 20px" }}>
                    Wij geloven dat kinderen het recht hebben op een gezonde relatie met beide ouders,
                    ook na een scheiding. Onze missie is om gescheiden ouders te ondersteunen met tools
                    die effectieve communicatie bevorderen, transparantie waarborgen en conflicten
                    minimaliseren.
                  </p>
                  <p style={{ fontSize: 17, color: tk.muted, lineHeight: 1.8, margin: 0 }}>
                    Door het bieden van een gestructureerd platform helpen we ouders om zich te richten
                    op wat echt belangrijk is: het welzijn en de ontwikkeling van hun kinderen.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                  {[
                    { icon: <Heart size={20} color={tk.moss} />,  text: "Kinderen voorop — altijd" },
                    { icon: <Shield size={20} color={tk.moss} />, text: "Privacy en veiligheid als basis" },
                    { icon: <Users size={20} color={tk.moss} />,  text: "Samenwerking, ook als het moeilijk is" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 16, background: tk.sand, borderRadius: 16, padding: "20px 24px", border: `1px solid ${tk.borderLight}` }}>
                      <div className="au-icon-badge">{icon}</div>
                      <span style={{ fontSize: 16, fontWeight: 500, color: tk.slate }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr className="au-rule" />

          {/* ── ONTSTAAN ── */}
          <section style={{ background: tk.sand, padding: "96px 32px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
              <div style={{ maxWidth: 720 }}>
                <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
                  Hoe het begon
                </p>
                <h2 className="au-serif" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 32px" }}>
                  Hoe is CoParenting ontstaan?
                </h2>
                <p style={{ fontSize: 17, color: tk.muted, lineHeight: 1.8, margin: "0 0 40px" }}>
                  De ontwikkeling van CoParenting begon vanuit een simpele maar belangrijke observatie:
                  veel gescheiden ouders worstelen met communicatie, transparantie en het bijhouden van
                  belangrijke informatie over hun kinderen. Bestaande tools schoten tekort of waren
                  niet gebouwd met deze specifieke situatie in gedachten.
                </p>

                <div style={{ display: "flex", flexDirection: "column" as const, gap: 20 }}>
                  <div className="au-quote-block">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div className="au-icon-badge"><Users size={20} color={tk.moss} /></div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: tk.slate, margin: 0 }}>Samenwerking met ervaringsdeskundigen</h3>
                    </div>
                    <p style={{ fontSize: 15, color: tk.muted, lineHeight: 1.75, margin: 0 }}>
                      Vanaf dag één hebben we nauw samengewerkt met gescheiden ouders die zelf de
                      uitdagingen van co-ouderschap ervaren. Hun inzichten, frustraties en wensen
                      vormden de basis voor elke functie die we hebben ontwikkeld. Dit zorgt ervoor
                      dat de app aansluit bij de dagelijkse realiteit van gescheiden gezinnen.
                    </p>
                  </div>

                  <div className="au-quote-block">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div className="au-icon-badge"><Sparkles size={20} color={tk.moss} /></div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, color: tk.slate, margin: 0 }}>Input van hulpverleners</h3>
                    </div>
                    <p style={{ fontSize: 15, color: tk.muted, lineHeight: 1.75, margin: 0 }}>
                      Mediators, gezinstherapeuten, jeugdzorgwerkers en advocaten werden betrokken bij
                      het ontwikkelproces. Zij brachten professionele expertise in over wat werkt in
                      conflictsituaties. Hun feedback hielp ons functies te bouwen die bijdragen aan
                      de-escalatie en constructieve samenwerking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="au-rule" />

          {/* ── VOOR WIE ── */}
          <section style={{ background: tk.cream, padding: "96px 32px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
                Doelgroep
              </p>
              <h2 className="au-serif" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 52px" }}>
                Voor wie is CoParenting bedoeld?
              </h2>
              <div className="au-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
                {[
                  {
                    icon: <Users size={20} color={tk.moss} />,
                    title: "Gescheiden ouders",
                    desc: "Of je nu een omgangsregeling hebt afgesproken, co-ouderschap uitvoert of in een complexe gezinssituatie zit — CoParenting biedt de structuur en het overzicht om effectief samen te werken.",
                  },
                  {
                    icon: <Heart size={20} color={tk.moss} />,
                    title: "Hulpverleners & professionals",
                    desc: "Mediators, gezinstherapeuten, jeugdzorgwerkers en advocaten kunnen toegang krijgen tot het dossier van hun cliënten (met toestemming) voor gerichte ondersteuning.",
                  },
                  {
                    icon: <UserPlus size={20} color={tk.moss} />,
                    title: "Nieuwe partners & stiefouders",
                    desc: "Ook nieuwe partners kunnen een rol spelen in de opvoeding. Via CoParenting blijven zij op de hoogte van afspraken en informatie, zonder dat dit leidt tot miscommunicatie.",
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="au-card">
                    <div className="au-icon-badge" style={{ marginBottom: 20 }}>{icon}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: tk.slate, margin: "0 0 12px" }}>{title}</h3>
                    <p style={{ fontSize: 15, color: tk.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="au-rule" />

          {/* ── FUNCTIES ── */}
          <section style={{ background: tk.white, padding: "96px 32px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
                Wat je krijgt
              </p>
              <h2 className="au-serif" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 52px" }}>
                Wat biedt CoParenting?
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                {[
                  { icon: <Calendar size={20} color={tk.moss} />,     title: "Gedeelde agenda",        desc: "Plan afspraken, vakanties, ouderavonden en andere belangrijke momenten. Beide ouders hebben realtime inzicht en kunnen wijzigingen voorstellen via het verzoekensysteem." },
                  { icon: <FileText size={20} color={tk.moss} />,     title: "Digitaal logboek",       desc: "Houd schoolresultaten, medische informatie, ontwikkelingsmijlpalen en bijzondere momenten bij. Alle informatie is toegankelijk voor beide ouders en exporteerbaar." },
                  { icon: <MessageSquare size={20} color={tk.moss} />, title: "Verzoekensysteem",      desc: "Stel wijzigingsverzoeken in voor afspraken zonder directe confrontatie. Verzoeken kunnen worden goedgekeurd, afgewezen of aangepast. Alles wordt gedocumenteerd." },
                  { icon: <UserPlus size={20} color={tk.moss} />,     title: "Hulpverlener-toegang",   desc: "Geef hulpverleners read-only toegang tot jullie dossier. Via het berichtensysteem kunnen zij ondersteunen en bemiddelen op basis van feitelijke informatie." },
                  { icon: <Shield size={20} color={tk.moss} />,       title: "Privacy & veiligheid",   desc: "Jouw gegevens zijn volledig versleuteld en veilig opgeslagen. Je bepaalt zelf welke informatie je deelt en met wie. Alle acties worden gelogd voor transparantie." },
                  { icon: <FileText size={20} color={tk.moss} />,     title: "Export-functionaliteit", desc: "Exporteer je logboek, agenda en andere gegevens naar PDF. Handig voor gesprekken met hulpverleners, rechtszaken of gewoon als back-up." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="au-card">
                    <div className="au-icon-badge" style={{ marginBottom: 20 }}>{icon}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 500, color: tk.slate, margin: "0 0 10px" }}>{title}</h3>
                    <p style={{ fontSize: 15, color: tk.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="au-rule" />

          {/* ── WAAROM ── */}
          <section style={{ background: tk.sand, padding: "96px 32px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
              <div className="au-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
                    Toegevoegde waarde
                  </p>
                  <h2 className="au-serif" style={{ fontSize: "clamp(32px, 3.5vw, 46px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 24px" }}>
                    Waarom kiezen voor CoParenting?
                  </h2>
                  <p style={{ fontSize: 17, color: tk.muted, lineHeight: 1.8, margin: 0 }}>
                    Er zijn veel tools beschikbaar voor planning en communicatie. CoParenting is anders
                    omdat het specifiek gebouwd is voor de realiteit van gescheiden ouders — met aandacht
                    voor de-escalatie, transparantie en het welzijn van kinderen.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 28 }}>
                  {[
                    { n: "01", title: "Alles op één plek",               desc: "In plaats van losse apps voor agenda, communicatie en documentatie, biedt CoParenting één geïntegreerd platform. Dit bespaart tijd en voorkomt dat informatie verloren gaat." },
                    { n: "02", title: "Focus op de-escalatie",           desc: "Door gestructureerde communicatie via verzoeken worden veel conflicten vermeden. Ouders hoeven niet direct overleg te plegen over elke kleine wijziging." },
                    { n: "03", title: "Transparantie voor alle betrokkenen", desc: "Hulpverleners en andere betrokkenen kunnen meekijken (met toestemming). Iedereen is op de hoogte en kan bijdragen aan een stabiele omgeving voor de kinderen." },
                    { n: "04", title: "Bewijs en documentatie",          desc: "Alle communicatie en afspraken worden automatisch gedocumenteerd. Waardevol bij juridische procedures of gesprekken met mediators." },
                    { n: "05", title: "Kindgericht",                     desc: "Alles in de app draait om het welzijn van de kinderen. Per kind informatie bijhouden houdt de focus op hun behoeften, in plaats van op het conflict." },
                  ].map(({ n, title, desc }) => (
                    <div key={n} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                      <div className="au-step-num" style={{ flexShrink: 0, minWidth: 48 }}>{n}</div>
                      <div style={{ borderTop: `1px solid ${tk.borderLight}`, paddingTop: 12, flex: 1 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 500, color: tk.slate, margin: "0 0 8px" }}>{title}</h3>
                        <p style={{ fontSize: 14, color: tk.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section style={{ background: tk.cream, padding: "40px 32px 96px" }}>
            <div style={{ maxWidth: 1160, margin: "0 auto" }}>
              <div className="au-cta-wrap">
                <p style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                  Begin vandaag
                </p>
                <h2 className="au-serif" style={{ position: "relative", zIndex: 1, fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 500, color: "#fff", lineHeight: 1.2, margin: "0 auto 20px", maxWidth: 560 }}>
                  Klaar om te beginnen?
                </h2>
                <p style={{ position: "relative", zIndex: 1, fontSize: 17, color: "rgba(255,255,255,0.6)", maxWidth: 420, margin: "0 auto 44px", lineHeight: 1.7 }}>
                  Ontdek hoe CoParenting jouw situatie kan verbeteren. Gratis te starten, geen creditcard nodig.
                </p>
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
                  <a href="/register" className="au-btn-white">
                    Gratis starten <ArrowRight size={18} />
                  </a>
                  <a href="/pricing" className="au-btn-ghost-light">
                    Bekijk prijzen
                  </a>
                </div>
              </div>
            </div>
          </section>

        </main>

        <SiteFooter />
      </div>
    </>
  );
}
