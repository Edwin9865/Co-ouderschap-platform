// src/pages/Blog.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Search, Filter } from "lucide-react";
import { allPosts } from "../data/allBlogPosts";
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

  .bl-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .bl-serif { font-family: 'Lora', Georgia, serif; }

  @keyframes bl-fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .bl-fade-up { animation: bl-fadeUp 0.65s ease both; }
  .bl-delay-1 { animation-delay: 0.10s; }
  .bl-delay-2 { animation-delay: 0.20s; }

  .bl-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  /* Search input */
  .bl-search {
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
  .bl-search::placeholder { color: #a8a09a; }
  .bl-search:focus {
    border-color: #4a6741;
    box-shadow: 0 0 0 3px rgba(74,103,65,0.1);
  }

  /* Category pill */
  .bl-cat {
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
  .bl-cat:hover { border-color: #4a6741; color: #4a6741; }
  .bl-cat.active {
    background: #4a6741;
    border-color: #4a6741;
    color: #ffffff;
  }

  /* Post card */
  .bl-card {
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    overflow: hidden;
    transition: box-shadow 0.25s, transform 0.25s;
    display: flex;
    flex-direction: column;
  }
  .bl-card:hover {
    box-shadow: 0 16px 48px rgba(45,49,66,0.11);
    transform: translateY(-4px);
  }
  .bl-card:hover .bl-card-img {
    transform: scale(1.04);
  }

  .bl-card-img-wrap {
    height: 200px;
    overflow: hidden;
    position: relative;
    background: #ede7d9;
    flex-shrink: 0;
  }
  .bl-card-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
    display: block;
  }
  .bl-card-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(45,49,66,0.3), transparent 60%);
  }
  .bl-cat-tag {
    position: absolute;
    top: 14px; left: 14px;
    background: #4a6741;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 99px;
  }

  .bl-card-body {
    padding: 28px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .bl-card-title {
    font-family: 'Lora', Georgia, serif;
    font-size: 18px;
    font-weight: 500;
    color: #2d3142;
    line-height: 1.45;
    margin: 0 0 10px;
    text-decoration: none;
    display: block;
    transition: color 0.18s;
  }
  .bl-card-title:hover { color: #4a6741; }

  .bl-card-excerpt {
    font-size: 14px;
    color: #6b7080;
    line-height: 1.7;
    margin: 0 0 20px;
    flex: 1;
  }

  .bl-card-footer {
    border-top: 1px solid #f0ece4;
    padding-top: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .bl-card-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 12px;
    color: #a8a09a;
  }

  .bl-card-arrow {
    width: 34px; height: 34px;
    border-radius: 10px;
    border: 1.5px solid #e8e1d6;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    text-decoration: none;
    transition: border-color 0.18s, background 0.18s, transform 0.18s;
  }
  .bl-card-arrow:hover {
    border-color: #4a6741;
    background: #f5f0e8;
    transform: translateX(2px);
  }

  /* Empty state */
  .bl-empty {
    text-align: center;
    padding: 64px 32px;
    background: #ffffff;
    border: 1px dashed #e8e1d6;
    border-radius: 20px;
  }

  /* Buttons */
  .bl-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    background: #4a6741; color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .bl-btn-primary:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(74,103,65,0.28);
  }

  .bl-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    background: transparent; color: #2d3142;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    transition: border-color 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .bl-btn-ghost:hover {
    border-color: #4a506b;
    transform: translateY(-2px);
  }

  .bl-cta-wrap {
    background: #2d3142;
    border-radius: 32px;
    padding: 72px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .bl-cta-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(74,103,65,0.35) 0%, transparent 65%),
                radial-gradient(ellipse at 80% 20%, rgba(176,125,90,0.2) 0%, transparent 55%);
    pointer-events: none;
  }

  .bl-btn-white {
    display: inline-flex; align-items: center; gap: 10px;
    background: #fff; color: #4a6741;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .bl-btn-white:hover {
    background: #f0ece4;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.14);
  }

  .bl-btn-ghost-light {
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08); color: #fff;
    padding: 15px 30px; border-radius: 12px;
    font-weight: 500; font-size: 16px;
    text-decoration: none;
    border: 1.5px solid rgba(255,255,255,0.2);
    transition: background 0.2s, transform 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .bl-btn-ghost-light:hover {
    background: rgba(255,255,255,0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    .bl-grid       { grid-template-columns: 1fr !important; }
    .bl-cta-wrap   { padding: 48px 24px; }
    .bl-cta-btns   { flex-direction: column !important; }
    .bl-card-img-wrap { height: 190px !important; }
  }
  @media (min-width: 641px) and (max-width: 1024px) {
    .bl-grid       { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

function formatDateNlShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

type Category =
  | "Alle"
  | "Communicatie"
  | "Regelingen"
  | "Kinderen"
  | "Planning"
  | "Relaties"
  | "Financiën"
  | "Tools"
  | "Juridisch & hulp"
  | "Welzijn";

export default function Blog() {
  const categories: Category[] = useMemo(
    () => ["Alle", "Communicatie", "Regelingen", "Kinderen", "Planning", "Relaties", "Financiën", "Tools", "Juridisch & hulp", "Welzijn"],
    []
  );

  const [selectedCategory, setSelectedCategory] = useState<Category>("Alle");
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allPosts
      .filter((p) => selectedCategory === "Alle" || p.category === selectedCategory)
      .filter((p) => {
        if (!term) return true;
        const haystack = `${p.title} ${p.excerpt} ${p.category}`.toLowerCase();
        return haystack.includes(term);
      })
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [selectedCategory, search]);

  const hasFilters = search.trim() !== "" || selectedCategory !== "Alle";

  return (
    <div className="bl-page">
      <style>{globalStyles}</style>
      <Seo
        title="Blog co-ouderschap | Tips voor gescheiden ouders – CoParenting"
        description="Praktische artikelen over co-ouderschap: communicatie na scheiding, omgangsregeling, planning, het welzijn van kinderen en financiën. Gericht op rust en duidelijkheid voor beide ouders."
        canonicalUrl="https://coparenting.nl/blog"
        ogTitle="Blog | CoParenting – Tips voor co-ouders"
        ogDescription="Lees praktische artikelen over co-ouderschap, communicatie na scheiding, regelingen en het welzijn van kinderen."
        ogUrl="https://coparenting.nl/blog"
        keywords={[
          "co-ouderschap tips",
          "blog co-ouderschap",
          "samen opvoeden tips",
          "communicatie na scheiding tips",
          "omgangsregeling tips",
          "kinderen na scheiding welzijn",
          "co-parenting artikelen",
          "gescheiden ouders blog",
          "co ouderschap planning",
          "scheiding kinderen advies",
        ]}
      />

      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ background: tk.cream, padding: "80px 0 72px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
          <p className="bl-fade-up" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: tk.moss, margin: "0 0 20px" }}>
            Artikelen & inzichten
          </p>
          <h1 className="bl-serif bl-fade-up bl-delay-1" style={{ fontSize: "clamp(44px, 5vw, 66px)", fontWeight: 500, lineHeight: 1.13, margin: "0 0 24px", color: tk.slate, maxWidth: 640 }}>
            Blog
          </h1>
          <p className="bl-fade-up bl-delay-2" style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, maxWidth: 520, margin: "0 0 40px" }}>
            Praktische artikelen over co-ouderschap: communicatie, regelingen, planning en het
            welzijn van kinderen. Gericht op rust en duidelijkheid.
          </p>

          {/* Search */}
          <div className="bl-fade-up bl-delay-2" style={{ maxWidth: 480, position: "relative" as const, marginBottom: 24 }}>
            <Search size={17} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: tk.warm, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Zoek in artikelen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bl-search"
              aria-label="Zoek in artikelen"
            />
          </div>

          {/* Categories */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: tk.muted, marginRight: 4 }}>
              <Filter size={13} /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`bl-cat${selectedCategory === cat ? " active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div style={{ marginTop: 20, fontSize: 13, color: tk.muted, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
            <span>
              {filteredPosts.length} {filteredPosts.length === 1 ? "artikel" : "artikelen"} gevonden
            </span>
            {selectedCategory !== "Alle" && <span style={{ color: tk.warm }}>· {selectedCategory}</span>}
            {search.trim() && <span style={{ color: tk.warm }}>· "{search.trim()}"</span>}
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSelectedCategory("Alle"); }}
                style={{ color: tk.moss, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </section>

      <hr className="bl-rule" />

      {/* ── GRID ── */}
      <section style={{ background: tk.white, padding: "72px 32px 96px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>

          {filteredPosts.length > 0 ? (
            <div className="bl-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {filteredPosts.map((post) => (
                <article key={post.id} className="bl-card">
                  {/* Image */}
                  <Link to={`/blog/${post.slug}`} style={{ display: "block" }}>
                    <div className="bl-card-img-wrap">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="bl-card-img"
                        loading="lazy"
                      />
                      <div className="bl-card-img-overlay" />
                      <span className="bl-cat-tag">{post.category}</span>
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="bl-card-body">
                    <Link to={`/blog/${post.slug}`} className="bl-card-title">
                      {post.title}
                    </Link>
                    <p className="bl-card-excerpt">{post.excerpt}</p>

                    <div className="bl-card-footer">
                      <div className="bl-card-meta">
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Calendar size={12} />
                          {formatDateNlShort(post.date)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Clock size={12} />
                          {post.readTime}
                        </span>
                      </div>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="bl-card-arrow"
                        aria-label="Lees artikel"
                      >
                        <ArrowRight size={15} color={tk.moss} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bl-empty">
              <p style={{ fontSize: 17, fontWeight: 500, color: tk.slate, margin: "0 0 8px" }}>Geen artikelen gevonden</p>
              <p style={{ fontSize: 14, color: tk.muted, margin: "0 0 24px" }}>Probeer een andere zoekterm of filter.</p>
              <button
                className="bl-btn-ghost"
                style={{ width: "auto", margin: "0 auto" }}
                onClick={() => { setSearch(""); setSelectedCategory("Alle"); }}
              >
                Reset filters
              </button>
            </div>
          )}

          {/* ── CTA ── */}
          <div style={{ marginTop: 72 }}>
            <div className="bl-cta-wrap">
              <p style={{ position: "relative", zIndex: 1, fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                Aan de slag
              </p>
              <h2 className="bl-serif" style={{ position: "relative", zIndex: 1, fontSize: "clamp(32px, 4vw, 50px)", fontWeight: 500, color: "#fff", lineHeight: 1.22, margin: "0 auto 20px", maxWidth: 520 }}>
                Klaar voor meer rust en overzicht?
              </h2>
              <p style={{ position: "relative", zIndex: 1, fontSize: 17, color: "rgba(255,255,255,0.6)", maxWidth: 400, margin: "0 auto 44px", lineHeight: 1.7 }}>
                Start gratis en organiseer afspraken, verzoeken en logboek op één plek.
              </p>
              <div className="bl-cta-btns" style={{ position: "relative", zIndex: 1, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
                <Link to="/register" className="bl-btn-white">
                  Start gratis <ArrowRight size={18} />
                </Link>
                <Link to="/pricing" className="bl-btn-ghost-light">
                  Bekijk prijzen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
