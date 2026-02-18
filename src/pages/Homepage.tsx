// src/pages/Homepage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  FileText,
  MessageCircle,
  Shield,
  Clock,
  CheckCircle,
  Heart,
  Baby,
  Scale,
  ArrowRight,
  Star,
  Lock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

/* ─── Design tokens ─── */
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

/* ─── Global styles ─── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .cp-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .cp-serif { font-family: 'Lora', Georgia, serif; }

  @keyframes cp-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cp-fade-up  { animation: cp-fadeUp 0.65s ease both; }
  .cp-delay-1  { animation-delay: 0.10s; }
  .cp-delay-2  { animation-delay: 0.20s; }
  .cp-delay-3  { animation-delay: 0.32s; }

  .cp-carousel-strip {
    display: flex;
    transition: transform 0.55s cubic-bezier(0.45, 0, 0.15, 1);
  }

  .cp-dot {
    width: 8px; height: 8px; border-radius: 99px;
    background: #c8b89a;
    border: none; cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  }
  .cp-dot.active { width: 28px; background: #4a6741; }

  .cp-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  .cp-feature-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 36px;
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .cp-feature-card:hover {
    box-shadow: 0 12px 40px rgba(45,49,66,0.09);
    transform: translateY(-3px);
  }

  .cp-testimonial {
    background: #f5f0e8;
    border-radius: 20px;
    padding: 36px;
  }

  .cp-faq-item {
    border-top: 1px solid #e5dfd4;
    padding: 28px 0;
  }
  .cp-faq-item:last-child { border-bottom: 1px solid #e5dfd4; }

  .cp-step-num {
    font-family: 'Lora', serif;
    font-size: 56px;
    font-weight: 500;
    color: #ede7d9;
    line-height: 1;
    user-select: none;
  }

  .cp-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    background: #4a6741; color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .cp-btn-primary:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(74,103,65,0.28);
  }

  .cp-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .cp-btn-ghost:hover {
    border-color: #4a506b;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(45,49,66,0.08);
  }

  .cp-btn-ghost-light {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08); color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid rgba(255,255,255,0.2);
    transition: background 0.2s, transform 0.2s;
  }
  .cp-btn-ghost-light:hover {
    background: rgba(255,255,255,0.15);
    transform: translateY(-2px);
  }

  .cp-btn-white {
    display: inline-flex; align-items: center; gap: 10px;
    background: #ffffff; color: #4a6741;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .cp-btn-white:hover {
    background: #f0ece4;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.15);
  }

  .cp-cta-wrap {
    background: #2d3142;
    border-radius: 32px;
    padding: 72px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cp-cta-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(74,103,65,0.35) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 20%, rgba(176,125,90,0.2) 0%, transparent 55%);
    pointer-events: none;
  }

  .cp-icon-badge {
    width: 48px; height: 48px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    background: #f5f0e8;
    border: 1px solid #e0d8cc;
  }

  .cp-stat-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 32px 36px;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .cp-stat-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: #faf8f4;
    border: 1px solid #e0d8cc;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .cp-hero-grid  { grid-template-columns: 1fr !important; }
    .cp-two-col    { grid-template-columns: 1fr !important; }
    .cp-three-col  { grid-template-columns: 1fr !important; }
    .cp-cta-wrap   { padding: 48px 28px; }
  }
`;

/* ─── Screenshot data ─── */
const screenshots = [
  { id: 1, title: "Gedeelde Agenda",       description: "Overzicht van alle afspraken, wissels en activiteiten", imageUrl: "/carousel/Agenda.png" },
  { id: 2, title: "Verzoeken",             description: "Duidelijke communicatie zonder eindeloze discussies",    imageUrl: "/carousel/Verzoeken.png" },
  { id: 3, title: "Digitaal Logboek",      description: "Bewaar gezondheids- en schoolinformatie op één plek",   imageUrl: "/carousel/Logboek.png" },
  { id: 4, title: "Hulpverleners Portaal", description: "Veilige toegang voor professionals met juiste rechten",  imageUrl: "/carousel/Hulpverleners.png" },
];

/* ─── Carousel component ─── */
function ScreenshotCarousel() {
  const [idx, setIdx]   = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => setIdx(p => (p + 1) % screenshots.length), 4200);
    return () => clearInterval(timer);
  }, [auto]);

  const go   = (i: number) => { setIdx(i); setAuto(false); };
  const prev = () => { setIdx(p => (p - 1 + screenshots.length) % screenshots.length); setAuto(false); };
  const next = () => { setIdx(p => (p + 1) % screenshots.length); setAuto(false); };

  const frameStyle: React.CSSProperties = {
    background: tk.slate,
    borderRadius: 24,
    padding: "10px 10px 0",
    boxShadow: "0 32px 80px rgba(45,49,66,0.25)",
  };

  const slideAreaStyle: React.CSSProperties = {
    borderRadius: "14px 14px 0 0",
    overflow: "hidden",
    background: "#f0ece4",
    aspectRatio: "4/3",
    position: "relative",
  };

  const arrowStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    [side]: 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.92)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  });

  return (
    <div>
      <div style={frameStyle}>
        {/* Traffic lights */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px 12px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff6058", display: "block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#29c941", display: "block" }} />
          <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 22, marginLeft: 8 }} />
        </div>

        {/* Slides */}
        <div style={slideAreaStyle}>
          <div className="cp-carousel-strip" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {screenshots.map(s => {
              const hasImage = !!s.imageUrl && !s.imageUrl.startsWith("/api/");
              return (
                <div key={s.id} style={{ width: "100%", flexShrink: 0, aspectRatio: "4/3", background: "#e8e1d6" }}>
                  {hasImage ? (
                    <img
                      src={s.imageUrl}
                      alt={s.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = "none";
                        const parent = el.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#9a9080"><div style="font-size:40px">📸</div><span style="font-size:14px;font-weight:500">${s.title}</span></div>`;
                        }
                      }}
                    />
                  ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#9a9080" }}>
                      <Calendar size={36} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{s.title}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={prev} aria-label="Vorige" style={arrowStyle("left")}>
            <ChevronLeft size={18} color={tk.slate} />
          </button>
          <button onClick={next} aria-label="Volgende" style={arrowStyle("right")}>
            <ChevronRight size={18} color={tk.slate} />
          </button>
        </div>
      </div>

      {/* Caption + dots */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 500, color: tk.text, fontSize: 15 }}>{screenshots[idx].title}</div>
          <div style={{ color: tk.muted, fontSize: 13, marginTop: 2 }}>{screenshots[idx].description}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {screenshots.map((_, i) => (
            <button key={i} className={`cp-dot${i === idx ? " active" : ""}`} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export function Homepage() {
  return (
    <div className="cp-page">
      <style>{globalStyles}</style>
      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ padding: "80px 0 96px", background: tk.cream }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
          <div className="cp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <p className="cp-fade-up" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
                Co-ouderschap · Structuur · Rust
              </p>
              <h1 className="cp-serif cp-fade-up cp-delay-1" style={{ fontSize: "clamp(44px, 5vw, 66px)", fontWeight: 500, lineHeight: 1.13, margin: "0 0 28px", color: tk.slate }}>
                Rust en overzicht,{" "}
                <em style={{ color: tk.moss, fontStyle: "italic" }}>voor de kinderen</em>
              </h1>
              <p className="cp-fade-up cp-delay-2" style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, maxWidth: 480, margin: "0 0 40px" }}>
                CoParenting helpt ouders om duidelijk te communiceren, afspraken te bewaren
                en samen te werken — ook als dat soms moeilijk is.
              </p>
              <div className="cp-fade-up cp-delay-3" style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, alignItems: "center" }}>
                <Link to="/register" className="cp-btn-primary">
                  Gratis beginnen <ArrowRight size={18} />
                </Link>
                <Link to="/pricing" className="cp-btn-ghost">
                  Bekijk prijzen
                </Link>
              </div>
              <p style={{ marginTop: 20, fontSize: 13, color: tk.muted, display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={14} style={{ color: tk.moss }} />
                Geen creditcard nodig · Altijd opzegbaar
              </p>
            </div>

            <div className="cp-fade-up cp-delay-2">
              <ScreenshotCarousel />
            </div>
          </div>
        </div>
      </section>

      <hr className="cp-rule" />

      {/* ── TRUST BAR ── */}
      <section style={{ background: tk.white, padding: "44px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap" as const }}>
          {[
            { icon: <Shield size={16} color={tk.moss} />,         text: "Jij bepaalt wie wat ziet" },
            { icon: <MessageCircle size={16} color={tk.moss} />,  text: "Minder misverstanden" },
            { icon: <Clock size={16} color={tk.moss} />,          text: "Web & mobiel, altijd gesynchroniseerd" },
            { icon: <Heart size={16} color={tk.terra} />,         text: "Gemiddelde waardering 4.8 / 5" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 9, color: tk.muted, fontSize: 14 }}>
              {icon}
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <hr className="cp-rule" />

      {/* ── FEATURES ── */}
      <section style={{ background: tk.cream, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ maxWidth: 580 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
              Wat je krijgt
            </p>
            <h2 className="cp-serif" style={{ fontSize: "clamp(34px, 4vw, 50px)", fontWeight: 500, lineHeight: 1.18, color: tk.slate, margin: "0 0 20px" }}>
              Alles op één plek,<br />zonder ruis
            </h2>
            <p style={{ fontSize: 17, color: tk.muted, lineHeight: 1.75, margin: 0 }}>
              Ontworpen voor ouders in een co-ouderschapssituatie. Niet als app met duizend functies,
              maar als rustige plek waar afspraken kloppen.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18, marginTop: 52 }}>
            {[
              { icon: <Calendar size={20} color={tk.moss} />,      title: "Gedeelde agenda",       desc: "Plan activiteiten, opvang en wisselmomenten. Met herinneringen en duidelijke afspraken die voor iedereen zichtbaar zijn." },
              { icon: <FileText size={20} color={tk.moss} />,      title: "Digitaal logboek",      desc: "Leg gezondheid, school en bijzonderheden vast. Met notities en foto's, altijd terug te vinden." },
              { icon: <MessageCircle size={20} color={tk.moss} />, title: "Verzoeken-systeem",     desc: "Afwijkingen en wijzigingen bespreekbaar maken zonder eindeloze appgesprekken." },
              { icon: <Shield size={20} color={tk.moss} />,        title: "Privacy & rechten",     desc: "Jij bepaalt wat je deelt en met wie. Elk account heeft precieze toegangsrechten." },
              { icon: <Clock size={20} color={tk.moss} />,         title: "Web & mobiel",          desc: "Altijd bereikbaar, automatisch gesynchroniseerd. Of je nu op je telefoon of laptop werkt." },
              { icon: <Users size={20} color={tk.moss} />,         title: "Hulpverleners-portaal", desc: "Geef veilig toegang aan mediator of therapeut, zonder dat zij alles kunnen wijzigen." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="cp-feature-card">
                <div className="cp-icon-badge" style={{ marginBottom: 20 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 10px", color: tk.slate }}>{title}</h3>
                <p style={{ fontSize: 15, color: tk.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="cp-rule" />

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: tk.white, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
            Hoe het werkt
          </p>
          <h2 className="cp-serif" style={{ fontSize: "clamp(34px, 4vw, 50px)", fontWeight: 500, lineHeight: 1.18, color: tk.slate, margin: "0 0 60px" }}>
            Binnen een paar minuten opgezet
          </h2>

          <div className="cp-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {[
              { n: "01", icon: <Users size={20} color={tk.moss} />,         title: "Maak een account",      desc: "Start gratis en voeg je gezin toe. Je kunt altijd later upgraden als je meer nodig hebt." },
              { n: "02", icon: <MessageCircle size={20} color={tk.moss} />, title: "Nodig de co-ouder uit", desc: "Stuur een uitnodiging en stel samen de rechten in. Communicatie en planning komen samen." },
              { n: "03", icon: <Calendar size={20} color={tk.moss} />,      title: "Plan en leg vast",      desc: "Gebruik de agenda, het logboek en verzoeken. Alles blijft bewaard en terug te vinden." },
            ].map(({ n, icon, title, desc }) => (
              <div key={n}>
                <div className="cp-step-num">{n}</div>
                <div style={{ height: 1, background: tk.borderLight, margin: "16px 0 24px" }} />
                <div className="cp-icon-badge" style={{ marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 10px", color: tk.slate }}>{title}</h3>
                <p style={{ fontSize: 15, color: tk.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="cp-rule" />

      {/* ── BENEFITS + STATS ── */}
      <section style={{ background: tk.sand, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="cp-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
                Waarom het werkt
              </p>
              <h2 className="cp-serif" style={{ fontSize: "clamp(32px, 3.5vw, 46px)", fontWeight: 500, lineHeight: 1.22, color: tk.slate, margin: "0 0 22px" }}>
                Structuur geeft kinderen<br />voorspelbaarheid
              </h2>
              <p style={{ fontSize: 17, color: tk.muted, lineHeight: 1.75, margin: "0 0 36px" }}>
                Co-ouderschap vraagt veel van beide ouders. Hoe minder energie er gaat naar planningschaos
                en miscommunicatie, hoe meer er overblijft voor de kinderen. CoParenting neemt die ruis weg.
              </p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 18 }}>
                {[
                  "Verminder stress met duidelijke communicatie en vaste formats",
                  "Voorkom misverstanden met één gedeelde agenda en heldere wissels",
                  "Bewaar gezondheids- en schoolinformatie op één vertrouwde plek",
                  "Betrek hulpverleners veilig met rollen en rechten",
                ].map(text => (
                  <div key={text} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <CheckCircle size={17} style={{ color: tk.moss, flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 15, color: tk.muted, lineHeight: 1.65 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 44, display: "flex", gap: 14, flexWrap: "wrap" as const }}>
                <Link to="/register" className="cp-btn-primary">
                  Gratis starten <ArrowRight size={18} />
                </Link>
                <Link to="/faq" className="cp-btn-ghost">
                  Bekijk FAQ
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {[
                { icon: <Baby size={26} color={tk.moss} />,   stat: "10.000+", label: "Gezinnen gebruiken CoParenting" },
                { icon: <Scale size={26} color={tk.terra} />, stat: "95%",     label: "Ervaart minder conflict over planning" },
                { icon: <Star size={26} color="#e2a24a" />,   stat: "4.8 / 5", label: "Gemiddelde waardering door ouders" },
              ].map(({ icon, stat, label }) => (
                <div key={label} className="cp-stat-card">
                  <div className="cp-stat-icon">{icon}</div>
                  <div>
                    <div className="cp-serif" style={{ fontSize: 34, fontWeight: 500, color: tk.slate, lineHeight: 1 }}>{stat}</div>
                    <div style={{ fontSize: 13, color: tk.muted, marginTop: 5 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="cp-rule" />

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: tk.cream, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
            Ervaringen
          </p>
          <h2 className="cp-serif" style={{ fontSize: "clamp(34px, 4vw, 50px)", fontWeight: 500, lineHeight: 1.18, color: tk.slate, margin: "0 0 48px" }}>
            Wat anderen zeggen
          </h2>
          <div className="cp-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {[
              { quote: "We hebben eindelijk minder discussie over afspraken. Alles staat op één plek en is terug te vinden.", author: "Linda", role: "Moeder van 2" },
              { quote: "De gedeelde agenda voorkomt frustratie. Onze zoon merkt vooral dat er meer rust is in ons gezin.", author: "Mark", role: "Vader van 1" },
              { quote: "Als mediator vind ik het fijn dat afspraken en verzoeken zo overzichtelijk zijn. Dat helpt gezinnen echt vooruit.", author: "Dr. Peters", role: "Gezinstherapeut" },
            ].map(({ quote, author, role }) => (
              <div key={author} className="cp-testimonial">
                <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                  {[0,1,2,3,4].map(i => <Star key={i} size={13} fill="#e2a24a" color="#e2a24a" />)}
                </div>
                <p className="cp-serif" style={{ fontSize: 16, fontStyle: "italic", color: tk.slate, lineHeight: 1.7, margin: "0 0 24px" }}>
                  "{quote}"
                </p>
                <div style={{ fontSize: 14, fontWeight: 500, color: tk.slate }}>{author}</div>
                <div style={{ fontSize: 13, color: tk.muted, marginTop: 3 }}>{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="cp-rule" />

      {/* ── FAQ ── */}
      <section style={{ background: tk.white, padding: "96px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 16px" }}>
            Vragen
          </p>
          <h2 className="cp-serif" style={{ fontSize: "clamp(34px, 4vw, 50px)", fontWeight: 500, lineHeight: 1.18, color: tk.slate, margin: "0 0 44px" }}>
            Veelgestelde vragen
          </h2>
          {[
            { q: "Is er een gratis plan?",           a: "Ja. Je kunt gratis starten zonder creditcard. De meeste functies zijn direct beschikbaar. Upgraden kan altijd later als je meer nodig hebt." },
            { q: "Werkt dit ook bij veel conflict?", a: "Ja. Je kunt directe communicatie beperken en via verzoeken werken, zodat alles via het platform loopt. Dat helpt misverstanden te verminderen." },
            { q: "Kan een hulpverlener meekijken?",  a: "Ja. Je kunt veilige toegang geven met duidelijke rechten. Een hulpverlener kan meelezen of beperkt beheren — jij bepaalt wat." },
            { q: "Is mijn data veilig?",             a: "Privacy staat centraal. Jij bepaalt wie toegang heeft. Gegevens worden veilig opgeslagen en nooit gedeeld met derden." },
          ].map(({ q, a }) => (
            <div key={q} className="cp-faq-item">
              <div style={{ fontSize: 16, fontWeight: 500, color: tk.slate, marginBottom: 10 }}>{q}</div>
              <div style={{ fontSize: 15, color: tk.muted, lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
          <div style={{ marginTop: 40 }}>
            <Link to="/faq" className="cp-btn-ghost">
              Bekijk alle vragen <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: tk.cream, padding: "40px 32px 96px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="cp-cta-wrap">
            <p style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
              Begin vandaag
            </p>
            <h2 className="cp-serif" style={{ position: "relative", zIndex: 1, fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 500, color: "#fff", lineHeight: 1.2, margin: "0 auto 20px", maxWidth: 580 }}>
              Klaar voor meer rust in co-ouderschap?
            </h2>
            <p style={{ position: "relative", zIndex: 1, fontSize: 17, color: "rgba(255,255,255,0.6)", maxWidth: 420, margin: "0 auto 44px", lineHeight: 1.7 }}>
              Geen creditcard nodig. Gratis te starten. Altijd opzegbaar.
            </p>
            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
              <Link to="/register" className="cp-btn-white">
                Maak een gratis account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="cp-btn-ghost-light">
                Ik heb al een account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
