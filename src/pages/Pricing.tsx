// src/pages/Pricing.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Lock,
  MessageCircle,
  Users,
  FileText,
  Calendar,
  Download,
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

  .pr-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .pr-serif { font-family: 'Lora', Georgia, serif; }

  @keyframes pr-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .pr-fade-up { animation: pr-fadeUp 0.65s ease both; }
  .pr-delay-1 { animation-delay: 0.10s; }
  .pr-delay-2 { animation-delay: 0.20s; }

  .pr-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  /* Tier cards */
  .pr-tier {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 24px;
    padding: 40px;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .pr-tier:hover {
    box-shadow: 0 16px 48px rgba(45,49,66,0.10);
    transform: translateY(-4px);
  }
  .pr-tier-featured {
    background: #2d3142;
    border-color: #2d3142;
    position: relative;
    overflow: visible;
  }
  .pr-tier-featured:hover {
    box-shadow: 0 20px 56px rgba(45,49,66,0.28);
    transform: translateY(-6px);
  }

  .pr-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: #e2a24a;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding: 5px 18px;
    border-radius: 99px;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pr-icon-badge {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: #f5f0e8;
    border: 1px solid #e0d8cc;
  }

  .pr-feature-item {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 14px; line-height: 1.6;
    padding: 10px 0;
    border-bottom: 1px solid #f0ece4;
  }
  .pr-feature-item:last-child { border-bottom: none; }

  .pr-feature-item-light {
    display: flex; align-items: flex-start; gap: 12px;
    font-size: 14px; line-height: 1.6;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .pr-feature-item-light:last-child { border-bottom: none; }

  .pr-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    background: #4a6741; color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .pr-btn-primary:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(74,103,65,0.28);
  }

  .pr-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s;
    width: 100%;
  }
  .pr-btn-ghost:hover {
    border-color: #4a506b;
    transform: translateY(-2px);
  }

  .pr-btn-white {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; color: #4a6741;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .pr-btn-white:hover {
    background: #f0ece4;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.14);
  }

  /* Inline ghost (not full-width) */
  .pr-btn-ghost-inline {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s;
  }
  .pr-btn-ghost-inline:hover {
    border-color: #4a506b;
    transform: translateY(-2px);
  }

  .pr-btn-primary-inline {
    display: inline-flex; align-items: center; gap: 10px;
    background: #4a6741; color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .pr-btn-primary-inline:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(74,103,65,0.28);
  }

  .pr-cta-wrap {
    background: #2d3142;
    border-radius: 32px;
    padding: 72px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .pr-cta-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(74,103,65,0.35) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 20%, rgba(176,125,90,0.2) 0%, transparent 55%);
    pointer-events: none;
  }

  .pr-faq-item {
    border-top: 1px solid #e5dfd4;
    padding: 28px 0;
  }
  .pr-faq-item:last-child { border-bottom: 1px solid #e5dfd4; }

  .pr-summary-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 28px;
    display: flex;
    align-items: center;
    gap: 18px;
    transition: box-shadow 0.2s;
  }
  .pr-summary-card:hover {
    box-shadow: 0 8px 28px rgba(45,49,66,0.08);
  }

  @media (max-width: 768px) {
    .pr-tiers-grid { grid-template-columns: 1fr !important; }
    .pr-three-col  { grid-template-columns: 1fr !important; }
    .pr-cta-wrap   { padding: 48px 28px; }
    .pr-cta-btns   { flex-direction: column !important; }
  }
`;

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  subtext: string;
}

export default function Pricing() {
  const tiers: PricingTier[] = useMemo(() => [
    {
      name: "Basis",
      price: "0",
      period: "gratis",
      description: "Perfect om te starten met overzicht en structuur.",
      features: [
        "Agenda voor 1 kind",
        "Basis logboek",
        "Verzoeken versturen",
        "Mobiele app + web",
        "Notificaties",
        "Tot 2 gezinsleden",
      ],
      highlighted: false,
      cta: "Start gratis",
      subtext: "Upgrade wanneer jij er klaar voor bent.",
    },
    {
      name: "Pro",
      price: "9,99",
      period: "per maand",
      description: "Voor gezinnen die alles goed willen organiseren.",
      features: [
        "Onbeperkt aantal kinderen",
        "Uitgebreid logboek",
        "Verzoeken & voorstellen",
        "Gedeelde documenten",
        "Export (PDF)",
        "Onbeperkt gezinsleden",
        "Prioriteitsondersteuning",
        "Extra opslagruimte",
      ],
      highlighted: true,
      cta: "Start met Pro",
      subtext: "Maandelijks opzegbaar.",
    },
    {
      name: "Familie",
      price: "14,99",
      period: "per maand",
      description: "Voor gezinnen met hulpverleners of extra ondersteuning.",
      features: [
        "Alles van Pro",
        "Toegang voor hulpverleners",
        "Hulpverlenerscommunicatie",
        "Veiligheidsmeldingen",
        "Geavanceerde rapportages",
        "Teamondersteuning",
        "Persoonlijke onboarding",
        "Maandelijkse check-in",
      ],
      highlighted: false,
      cta: "Kies Familie",
      subtext: "Maandelijks opzegbaar.",
    },
  ], []);

  return (
    <div className="pr-page">
      <style>{globalStyles}</style>
      <Seo
        title="Prijzen | CoParenting"
        description="Transparante prijzen voor CoParenting. Start gratis en upgrade wanneer je meer functies nodig hebt. Maandelijks opzegbaar."
        canonicalUrl={(import.meta as any).env?.VITE_SITE_URL ? `${(import.meta as any).env.VITE_SITE_URL}/pricing` : undefined}
        ogTitle="Prijzen | CoParenting"
        ogDescription="Start gratis, upgrade wanneer nodig. Transparante abonnementen zonder verrassingen."
      />
      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ background: tk.cream, padding: "80px 0 96px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
          <p className="pr-fade-up" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
            Abonnementen
          </p>
          <h1 className="pr-serif pr-fade-up pr-delay-1" style={{ fontSize: "clamp(44px, 5vw, 66px)", fontWeight: 500, lineHeight: 1.13, margin: "0 0 28px", color: tk.slate, maxWidth: 680 }}>
            Transparante prijzen,{" "}
            <em style={{ color: tk.moss, fontStyle: "italic" }}>geen verrassingen</em>
          </h1>
          <p className="pr-fade-up pr-delay-2" style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, maxWidth: 520, margin: "0 0 40px" }}>
            Begin gratis en upgrade wanneer je meer functionaliteit nodig hebt.
            Alle betaalde abonnementen zijn maandelijks opzegbaar.
          </p>
          <div className="pr-fade-up pr-delay-2" style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, alignItems: "center" }}>
            <Link to="/register" className="pr-btn-primary-inline">
              Start vandaag gratis <ArrowRight size={18} />
            </Link>
            <Link to="/faq" className="pr-btn-ghost-inline">
              Bekijk FAQ
            </Link>
          </div>
          <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap" as const, gap: 20 }}>
            {[
              { icon: <Lock size={14} color={tk.moss} />, text: "Geen creditcard nodig" },
              { icon: <Shield size={14} color={tk.moss} />, text: "Privacy-first" },
              { icon: <MessageCircle size={14} color={tk.moss} />, text: "Altijd opzegbaar" },
            ].map(({ icon, text }) => (
              <span key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: tk.muted }}>
                {icon}{text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <hr className="pr-rule" />

      {/* ── PRICING TIERS ── */}
      <section style={{ background: tk.white, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>

          {/* Grid */}
          <div className="pr-tiers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
            {tiers.map((tier) => {
              const isFeatured = tier.highlighted;
              return (
                <div
                  key={tier.name}
                  className={isFeatured ? "pr-tier pr-tier-featured" : "pr-tier"}
                  style={isFeatured ? { marginTop: -16, marginBottom: 0 } : {}}
                >
                  {isFeatured && (
                    <div className="pr-badge">
                      <Sparkles size={12} /> Meest gekozen
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                        background: isFeatured ? "rgba(255,255,255,0.12)" : tk.sand,
                        border: `1px solid ${isFeatured ? "rgba(255,255,255,0.18)" : tk.border}`,
                      }}>
                        {tier.name === "Basis"   && <Users size={18} color={isFeatured ? "#fff" : tk.moss} />}
                        {tier.name === "Pro"     && <Sparkles size={18} color={isFeatured ? "#fff" : tk.moss} />}
                        {tier.name === "Familie" && <Shield size={18} color={isFeatured ? "#fff" : tk.moss} />}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: isFeatured ? "rgba(255,255,255,0.9)" : tk.slateLight, letterSpacing: "0.02em" }}>
                        {tier.name}
                      </span>
                      {tier.name === "Familie" && (
                        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: isFeatured ? "rgba(255,255,255,0.55)" : tk.muted, background: isFeatured ? "rgba(255,255,255,0.1)" : tk.sand, padding: "3px 10px", borderRadius: 99, border: `1px solid ${isFeatured ? "rgba(255,255,255,0.15)" : tk.borderLight}` }}>
                          + Hulpverleners
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                      <span className="pr-serif" style={{ fontSize: 52, fontWeight: 500, color: isFeatured ? "#fff" : tk.slate, lineHeight: 1 }}>
                        {tier.price === "0" ? "Gratis" : `€${tier.price}`}
                      </span>
                      {tier.price !== "0" && (
                        <span style={{ fontSize: 14, color: isFeatured ? "rgba(255,255,255,0.5)" : tk.muted }}>
                          {tier.period}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: isFeatured ? "rgba(255,255,255,0.6)" : tk.muted, lineHeight: 1.6, margin: 0 }}>
                      {tier.description}
                    </p>
                  </div>

                  {/* CTA */}
                  {isFeatured
                    ? <Link to="/register" className="pr-btn-white" style={{ marginBottom: 28 }}>{tier.cta} <ArrowRight size={16} /></Link>
                    : tier.price === "0"
                      ? <Link to="/register" className="pr-btn-ghost" style={{ marginBottom: 28 }}>{tier.cta}</Link>
                      : <Link to="/register" className="pr-btn-primary" style={{ marginBottom: 28 }}>{tier.cta} <ArrowRight size={16} /></Link>
                  }

                  {/* Features */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: isFeatured ? "rgba(255,255,255,0.4)" : tk.warm, marginBottom: 4 }}>
                      Inbegrepen
                    </div>
                    <div>
                      {tier.features.map((f) => (
                        <div key={f} className={isFeatured ? "pr-feature-item-light" : "pr-feature-item"}>
                          <Check size={15} style={{ color: isFeatured ? "#a7c89a" : tk.moss, flexShrink: 0, marginTop: 2 }} />
                          <span style={{ color: isFeatured ? "rgba(255,255,255,0.8)" : tk.muted }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p style={{ marginTop: 20, fontSize: 12, color: isFeatured ? "rgba(255,255,255,0.35)" : tk.warm, textAlign: "center" as const }}>
                    {tier.subtext}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          <div style={{ marginTop: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
              Wat je in elk plan krijgt
            </p>
            <div className="pr-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { icon: <Calendar size={20} color={tk.moss} />, title: "Planning zonder ruis", desc: "Wissels, school, sport en afspraken op één plek." },
                { icon: <FileText size={20} color={tk.moss} />, title: "Logboek & documentatie", desc: "Alles terugvindbaar en chronologisch geordend." },
                { icon: <Download size={20} color={tk.moss} />, title: "Exports (PDF)", desc: "Handig voor administratie, overleg of juridische context." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="pr-summary-card">
                  <div className="pr-icon-badge">{icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: tk.slate }}>{title}</div>
                    <div style={{ fontSize: 13, color: tk.muted, marginTop: 3 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="pr-rule" />

      {/* ── FAQ ── */}
      <section style={{ background: tk.sand, padding: "96px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
            Vragen over prijzen
          </p>
          <h2 className="pr-serif" style={{ fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 500, lineHeight: 1.2, color: tk.slate, margin: "0 0 44px" }}>
            Veelgestelde vragen
          </h2>

          {[
            { q: "Kan ik mijn abonnement opzeggen?",            a: "Ja. Alle betaalde abonnementen zijn maandelijks opzegbaar. Je behoudt toegang tot het einde van je lopende periode." },
            { q: "Wat gebeurt er met mijn data als ik stop?",   a: "Je kunt altijd exporteren (bij Pro en Familie). Bij stoppen ga je terug naar het gratis plan. We raden aan om vóór downgrade je gewenste exports te maken." },
            { q: "Betalen beide ouders apart?",                 a: "Nee. Eén abonnement is bedoeld voor het gezin en geeft toegang aan beide ouders (en eventueel extra gezinsleden)." },
            { q: "Is er korting voor jaarabonnementen?",        a: "Vaak wel. Als je dit wilt, stuur even een bericht via contact — dan regelen we het voor je." },
          ].map(({ q, a }) => (
            <div key={q} className="pr-faq-item">
              <div style={{ fontSize: 16, fontWeight: 500, color: tk.slate, marginBottom: 10 }}>{q}</div>
              <div style={{ fontSize: 15, color: tk.muted, lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}

          <div style={{ marginTop: 36 }}>
            <Link to="/faq" className="pr-btn-ghost-inline">
              Meer vragen? Bekijk de FAQ <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: tk.cream, padding: "40px 32px 96px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="pr-cta-wrap">
            <p style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
              Nog vragen?
            </p>
            <h2 className="pr-serif" style={{ position: "relative", zIndex: 1, fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 500, color: "#fff", lineHeight: 1.2, margin: "0 auto 20px", maxWidth: 540 }}>
              We helpen je graag op weg
            </h2>
            <p style={{ position: "relative", zIndex: 1, fontSize: 17, color: "rgba(255,255,255,0.6)", maxWidth: 400, margin: "0 auto 44px", lineHeight: 1.7 }}>
              Twijfel je welk abonnement bij je past? Neem contact op en we kijken het samen door.
            </p>
            <div className="pr-cta-btns" style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
              <Link to="/register" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#fff", color: tk.moss,
                padding: "15px 30px", borderRadius: 12,
                fontWeight: 500, fontSize: 16, textDecoration: "none",
                transition: "background 0.2s, transform 0.2s",
              }}>
                Start gratis <ArrowRight size={18} />
              </Link>
              <Link to="/contact" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,0.08)", color: "#fff",
                padding: "15px 30px", borderRadius: 12,
                fontWeight: 500, fontSize: 16, textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.2)",
                transition: "background 0.2s, transform 0.2s",
              }}>
                Neem contact op
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
