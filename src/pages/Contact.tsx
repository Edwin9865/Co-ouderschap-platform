// src/pages/Contact.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, FileText, HelpCircle, ArrowRight } from "lucide-react";
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

const SUPPORT_EMAIL = "info@coparenting.nl";

const buildMailto = (email: string, subjectPrefix?: string) => {
  const params = new URLSearchParams();
  if (subjectPrefix) params.set("subject", subjectPrefix);
  const qs = params.toString();
  return `mailto:${email}${qs ? `?${qs}` : ""}`;
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .ct-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .ct-serif { font-family: 'Lora', Georgia, serif; }

  @keyframes ct-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ct-fade-up { animation: ct-fadeUp 0.65s ease both; }
  .ct-delay-1 { animation-delay: 0.10s; }
  .ct-delay-2 { animation-delay: 0.20s; }

  .ct-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  /* Support card */
  .ct-support-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .ct-support-card:hover {
    box-shadow: 0 12px 40px rgba(45,49,66,0.09);
    transform: translateY(-3px);
  }

  .ct-icon-badge {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: #f5f0e8;
    border: 1px solid #e0d8cc;
    margin-bottom: 20px;
  }

  /* Email link */
  .ct-email-link {
    display: inline-block;
    font-size: 14px;
    font-weight: 500;
    color: #4a6741;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.18s;
    word-break: break-all;
  }
  .ct-email-link:hover { color: #6b9467; }

  /* Tips list */
  .ct-tip {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px 0;
    border-bottom: 1px solid #e5dfd4;
    font-size: 14px;
    color: #6b7080;
    line-height: 1.7;
  }
  .ct-tip:last-child { border-bottom: none; }

  .ct-tip-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4a6741;
    flex-shrink: 0;
    margin-top: 7px;
  }

  /* FAQ quick item */
  .ct-faq-item {
    border-top: 1px solid #e5dfd4;
    padding: 22px 0;
  }
  .ct-faq-item:last-child { border-bottom: 1px solid #e5dfd4; }

  /* Buttons */
  .ct-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    background: #4a6741; color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ct-btn-primary:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(74,103,65,0.28);
  }

  .ct-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ct-btn-ghost:hover { border-color: #4a506b; transform: translateY(-2px); }

  .ct-btn-small-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: #4a6741;
    padding: 9px 18px; border-radius: 10px;
    font-weight: 500; font-size: 14px;
    text-decoration: none;
    border: 1.5px solid #c8b89a;
    transition: border-color 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ct-btn-small-ghost:hover { border-color: #4a6741; transform: translateY(-1px); }

  .ct-cta-wrap {
    background: #2d3142;
    border-radius: 32px;
    padding: 64px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .ct-cta-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(74,103,65,0.35) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 20%, rgba(176,125,90,0.2) 0%, transparent 55%);
    pointer-events: none;
  }

  .ct-btn-white {
    display: inline-flex; align-items: center; gap: 10px;
    background: #fff; color: #4a6741;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ct-btn-white:hover {
    background: #f0ece4;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.14);
  }

  .ct-btn-ghost-light {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08); color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid rgba(255,255,255,0.2);
    transition: background 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ct-btn-ghost-light:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }

  /* Quote block */
  .ct-quote-block {
    border-left: 3px solid #4a6741;
    background: #f5f0e8;
    border-radius: 0 14px 14px 0;
    padding: 20px 24px;
  }

  /* Link style */
  .ct-link {
    color: #4a6741;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .ct-link:hover { color: #6b9467; }

  @media (max-width: 640px) {
    .ct-hero-grid   { grid-template-columns: 1fr !important; }
    .ct-cards-grid  { grid-template-columns: 1fr !important; }
    .ct-faq-grid    { grid-template-columns: 1fr !important; }
    .ct-cta-wrap    { padding: 48px 24px; }
    .ct-cta-btns    { flex-direction: column !important; }
  }
  @media (min-width: 641px) and (max-width: 900px) {
    .ct-hero-grid   { grid-template-columns: 1fr !important; }
    .ct-cards-grid  { grid-template-columns: repeat(2, 1fr) !important; }
    .ct-faq-grid    { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 901px) and (max-width: 1100px) {
    .ct-cards-grid  { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

type SupportCard = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  label: string;
  email: string;
  subjectPrefix?: string;
};

const SUPPORT_CARDS: SupportCard[] = [
  {
    icon: <Mail size={20} color={tk.moss} />,
    title: "Algemene vragen",
    desc: "Stuur ons een e-mail met je vraag of probleem. We streven ernaar binnen 24 uur te reageren.",
    label: "Algemeen",
    email: SUPPORT_EMAIL,
    subjectPrefix: "[ALGEMEEN] ",
  },
  {
    icon: <MessageCircle size={20} color={tk.moss} />,
    title: "Technische support",
    desc: "Ondervindt je technische problemen? Vermeld je apparaat, browser en een korte omschrijving.",
    label: "Technisch",
    email: SUPPORT_EMAIL,
    subjectPrefix: "[TECH] ",
  },
  {
    icon: <FileText size={20} color={tk.moss} />,
    title: "Privacy & juridisch",
    desc: "Vragen over privacy, gegevensbescherming of juridische zaken? We staan voor je klaar.",
    label: "Privacy",
    email: SUPPORT_EMAIL,
    subjectPrefix: "[PRIVACY] ",
  },
  {
    icon: <HelpCircle size={20} color={tk.moss} />,
    title: "Feedback & ideeën",
    desc: "We waarderen je feedback! Help ons het platform te verbeteren met je ideeën en suggesties.",
    label: "Feedback",
    email: SUPPORT_EMAIL,
    subjectPrefix: "[FEEDBACK] ",
  },
];

const FAQ_QUICK = [
  {
    q: "Hoe kan ik mijn co-ouder uitnodigen?",
    a: (
      <span>
        Ga naar Instellingen &gt; Koppelen. Deel de koppelcode met je co-ouder via een veilig kanaal
        (bijv. SMS of WhatsApp). Je co-ouder voert de code in bij Instellingen &gt; Koppelen. Na
        bevestiging zijn jullie gekoppeld.
      </span>
    ),
  },
  {
    q: "Kan ik mijn gegevens verwijderen?",
    a: (
      <span>
        Ja. Op basis van de AVG heb je recht op verwijdering van je gegevens. Neem hiervoor contact
        op met onze support. We raden aan om vóór verwijdering een export te maken als je je
        administratie wilt bewaren. Lees meer in ons{" "}
        <Link to="/privacybeleid" className="ct-link">
          Privacybeleid
        </Link>
        .
      </span>
    ),
  },
  {
    q: "Hoe exporteer ik mijn gegevens?",
    a: (
      <span>
        Ga naar Export in het menu voor een volledig overzicht van alle gegevens in je gezin (PDF-formaat,
        beschikbaar in PLUS en PRO).
      </span>
    ),
  },
  {
    q: "Wat zijn de verschillen tussen de abonnementen?",
    a: (
      <span>
        Ga naar{" "}
        <Link to="/pricing" className="ct-link">
          de prijzenpagina
        </Link>{" "}
        voor een volledig overzicht van beschikbare abonnementen en functies.
      </span>
    ),
  },
  {
    q: "Hoe voeg ik een hulpverlener toe?",
    a: (
      <span>
        Ga naar Hulpverleners in het menu en klik op "Uitnodigen". Je hebt de koppelcode nodig die de
        hulpverlener bij registratie heeft ontvangen.
      </span>
    ),
  },
  {
    q: "Is mijn data veilig?",
    a: (
      <span>
        Ja. Alle gegevens worden versleuteld opgeslagen en verzonden. Lees meer in ons{" "}
        <Link to="/privacybeleid" className="ct-link">
          Privacybeleid
        </Link>
        .
      </span>
    ),
  },
];

export default function Contact() {
  const siteUrl = (import.meta as any).env?.VITE_SITE_URL || "";
  const canonicalUrl = siteUrl ? `${siteUrl.replace(/\/+$/, "")}/contact` : "/contact";

  return (
    <div className="ct-page">
      <style>{globalStyles}</style>
      <Seo
        title="Contact & Support | CoParenting – App voor gescheiden ouders"
        description="Neem contact op met CoParenting voor vragen over de co-ouderschap app, technische support, privacy of feedback. Reactie binnen 24 uur op werkdagen. E-mail: info@coparenting.nl"
        canonicalUrl="https://coparenting.nl/contact"
        ogTitle="Contact & Support | CoParenting"
        ogDescription="Vragen of hulp nodig met de co-ouderschap app? Neem contact op via e-mail. Reactie binnen 24 uur op werkdagen."
        ogUrl="https://coparenting.nl/contact"
        keywords={[
          "CoParenting contact",
          "CoParenting support",
          "co-ouderschap app support",
          "co-ouderschap platform helpdesk",
          "privacy co-ouderschap app",
          "technische support co-parenting",
          "contact gescheiden ouders app",
          "info coparenting nl",
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact CoParenting",
          "description": "Contactpagina van CoParenting – de app voor gescheiden ouders",
          "url": "https://coparenting.nl/contact",
          "mainEntity": {
            "@type": "Organization",
            "name": "CoParenting",
            "url": "https://coparenting.nl",
            "email": "info@coparenting.nl",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Provincialeweg 163",
              "postalCode": "9865AG",
              "addressLocality": "Opende",
              "addressRegion": "Groningen",
              "addressCountry": "NL"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": "info@coparenting.nl",
              "availableLanguage": ["Dutch"],
              "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00",
                "closes": "17:00"
              }
            }
          }
        }}
      />

      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ background: tk.cream, padding: "80px 0 96px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
          <div className="ct-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            {/* Left */}
            <div>
              <p className="ct-fade-up" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
                Support & Service
              </p>
              <h1 className="ct-serif ct-fade-up ct-delay-1" style={{ fontSize: "clamp(44px, 5vw, 60px)", fontWeight: 500, lineHeight: 1.13, margin: "0 0 24px", color: tk.slate }}>
                Contact & Support
              </h1>
              <p className="ct-fade-up ct-delay-2" style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, margin: "0 0 36px" }}>
                Heb je vragen of hulp nodig? Kies het onderwerp dat het beste past, dan kunnen we je sneller helpen.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 24 }}>
                <Link to="/faq" className="ct-btn-primary">
                  Bekijk FAQ <ArrowRight size={18} />
                </Link>
                <Link to="/pricing" className="ct-btn-ghost">
                  Bekijk prijzen
                </Link>
              </div>

              <p style={{ fontSize: 13, color: tk.muted }}>
                Richtlijn: reactie binnen 24 uur op werkdagen. Controleer ook je spam-map.
              </p>
            </div>

            {/* Right — tips card */}
            <div className="ct-fade-up ct-delay-2" style={{ background: tk.white, border: `1px solid ${tk.border}`, borderRadius: 20, padding: 36 }}>
              <h2 className="ct-serif" style={{ fontSize: 20, fontWeight: 500, color: tk.slate, margin: "0 0 20px" }}>
                Handige tips
              </h2>
              <div>
                {[
                  'Voeg bij technische issues je apparaat + browser toe (bijv. "Chrome op Windows 11").',
                  "Vermeld bij export-problemen de datum en welk scherm je gebruikte.",
                  "Bij dringende technische problemen: zet [URGENT] in het onderwerp.",
                ].map((tip) => (
                  <div key={tip} className="ct-tip">
                    <div className="ct-tip-dot" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              <div className="ct-quote-block" style={{ marginTop: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: tk.slate, marginBottom: 6 }}>Geen antwoord ontvangen?</div>
                <p style={{ fontSize: 14, color: tk.muted, lineHeight: 1.7, margin: 0 }}>
                  Controleer of je e-mail correct is verzonden en kijk in je spam-map. We streven ernaar binnen 24 uur te reageren op werkdagen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="ct-rule" />

      {/* ── SUPPORT CARDS ── */}
      <section style={{ background: tk.white, padding: "80px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
            Neem contact op
          </p>
          <h2 className="ct-serif" style={{ fontSize: "clamp(32px, 3.5vw, 46px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 48px" }}>
            Kies het juiste onderwerp
          </h2>

          <div className="ct-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {SUPPORT_CARDS.map((c) => {
              const mailto = buildMailto(c.email, c.subjectPrefix);
              return (
                <div key={c.title} className="ct-support-card">
                  <div className="ct-icon-badge">{c.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 500, color: tk.slate, margin: "0 0 10px" }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: tk.muted, lineHeight: 1.7, margin: "0 0 20px", flex: 1 }}>{c.desc}</p>
                  <div style={{ background: tk.sand, borderRadius: 12, padding: "14px 16px", border: `1px solid ${tk.borderLight}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: tk.warm, marginBottom: 6 }}>
                      {c.label}
                    </div>
                    <a href={mailto} className="ct-email-link">{c.email}</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="ct-rule" />

      {/* ── FAQ QUICK ── */}
      <section style={{ background: tk.sand, padding: "80px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" as const, marginBottom: 40 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 12px" }}>
                Veelgestelde vragen
              </p>
              <h2 className="ct-serif" style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: 0 }}>
                Snelle antwoorden
              </h2>
            </div>
            <Link to="/faq" className="ct-btn-small-ghost">
              Alle vragen bekijken <ArrowRight size={14} />
            </Link>
          </div>

          <div className="ct-faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px" }}>
            {FAQ_QUICK.map((item) => (
              <div key={item.q} className="ct-faq-item">
                <div style={{ fontSize: 15, fontWeight: 500, color: tk.slate, marginBottom: 8 }}>{item.q}</div>
                <div style={{ fontSize: 14, color: tk.muted, lineHeight: 1.75 }}>{item.a}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 36, fontSize: 13, color: tk.muted }}>
            Meer informatie:{" "}
            <Link to="/algemene-voorwaarden" className="ct-link">Algemene Voorwaarden</Link>
            {" · "}
            <Link to="/privacybeleid" className="ct-link">Privacybeleid</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: tk.cream, padding: "40px 32px 96px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="ct-cta-wrap">
            <p style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
              Nog niet gevonden?
            </p>
            <h2 className="ct-serif" style={{ position: "relative", zIndex: 1, fontSize: "clamp(32px, 4vw, 50px)", fontWeight: 500, color: "#fff", lineHeight: 1.2, margin: "0 auto 20px", maxWidth: 500 }}>
              We helpen je graag verder
            </h2>
            <p style={{ position: "relative", zIndex: 1, fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 380, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Stuur een e-mail of bekijk de volledige FAQ. We reageren gewoonlijk binnen 24 uur op werkdagen.
            </p>
            <div className="ct-cta-btns" style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
              <a href={buildMailto(SUPPORT_EMAIL, "[ALGEMEEN] ")} className="ct-btn-white">
                Stuur een e-mail <ArrowRight size={18} />
              </a>
              <Link to="/faq" className="ct-btn-ghost-light">
                Bekijk FAQ
              </Link>
            </div>
            <p style={{ position: "relative", zIndex: 1, marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              E-mail: {SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}