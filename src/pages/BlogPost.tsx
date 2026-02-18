// src/pages/BlogPost.tsx
import React, { useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Home,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
import Seo from "../components/Seo";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { posts } from "../data/blogPosts";

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

  .bp-page {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #2d3142;
    -webkit-font-smoothing: antialiased;
  }
  .bp-serif { font-family: 'Lora', Georgia, serif; }

  .bp-rule { border: none; border-top: 1px solid #e5dfd4; margin: 0; }

  /* Breadcrumb bar */
  .bp-topbar {
    background: #ffffff;
    border-bottom: 1px solid #e5dfd4;
    padding: 14px 0;
  }

  /* Breadcrumb items */
  .bp-breadcrumb-link {
    font-size: 13px;
    color: #6b7080;
    text-decoration: none;
    transition: color 0.18s;
  }
  .bp-breadcrumb-link:hover { color: #4a6741; }

  /* Pill button */
  .bp-btn-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 99px;
    font-size: 13px; font-weight: 500;
    border: 1.5px solid #e8e1d6;
    background: #fff;
    color: #2d3142;
    text-decoration: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.18s, background 0.18s, transform 0.18s;
  }
  .bp-btn-pill:hover { border-color: #4a6741; background: #f5f0e8; transform: translateY(-1px); }

  /* Primary btn */
  .bp-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    font-size: 15px; font-weight: 500;
    background: #4a6741; color: #fff;
    text-decoration: none;
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .bp-btn-primary:hover {
    background: #6b9467;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(74,103,65,0.25);
  }

  /* Ghost btn */
  .bp-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 12px;
    font-size: 15px; font-weight: 500;
    background: transparent; color: #2d3142;
    text-decoration: none;
    border: 1.5px solid #d4ccc0;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, transform 0.2s;
  }
  .bp-btn-ghost:hover { border-color: #4a506b; transform: translateY(-2px); }

  /* Hero image */
  .bp-hero-img-wrap {
    border-radius: 20px;
    overflow: hidden;
    aspect-ratio: 16/7;
    position: relative;
    background: #ede7d9;
  }
  .bp-hero-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .bp-hero-img-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(45,49,66,0.45), transparent 55%);
  }

  /* Cat tag */
  .bp-cat-tag {
    display: inline-block;
    background: #4a6741;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 99px;
  }

  /* Article body — editorial prose */
  .bp-prose {
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    line-height: 1.85;
    color: #4a506b;
  }
  .bp-prose h2 {
    font-family: 'Lora', Georgia, serif;
    font-size: 26px;
    font-weight: 500;
    color: #2d3142;
    margin: 2.2em 0 0.6em;
    line-height: 1.3;
  }
  .bp-prose h3 {
    font-family: 'Lora', Georgia, serif;
    font-size: 20px;
    font-weight: 500;
    color: #2d3142;
    margin: 1.8em 0 0.5em;
    line-height: 1.35;
  }
  .bp-prose p { margin: 0 0 1.4em; }
  .bp-prose ul { margin: 0 0 1.4em; padding-left: 1.6em; list-style-type: disc; }
  .bp-prose ol { margin: 0 0 1.4em; padding-left: 1.6em; list-style-type: decimal; }
  .bp-prose ul ul { list-style-type: circle; margin-top: 0.4em; margin-bottom: 0.4em; }
  .bp-prose ul ul ul { list-style-type: square; }
  .bp-prose ol ol { list-style-type: lower-alpha; margin-top: 0.4em; margin-bottom: 0.4em; }
  .bp-prose li { margin-bottom: 0.5em; padding-left: 0.25em; display: list-item; }
  .bp-prose li > p { margin: 0.4em 0; }
  .bp-prose li::marker { color: #4a6741; }
  .bp-prose table { width: 100%; border-collapse: collapse; margin: 1.6em 0; font-size: 15px; }
  .bp-prose th { background: #f5f0e8; color: #2d3142; font-weight: 600; text-align: left; padding: 10px 14px; border: 1px solid #e5dfd4; }
  .bp-prose td { padding: 10px 14px; border: 1px solid #e5dfd4; color: #6b7080; vertical-align: top; }
  .bp-prose tr:nth-child(even) td { background: #faf8f4; }
  .bp-prose img { max-width: 100%; border-radius: 12px; margin: 1.6em 0; }
  .bp-prose del { color: #a8a09a; text-decoration: line-through; }
  .bp-prose a { color: #4a6741; text-decoration: underline; text-underline-offset: 3px; }
  .bp-prose a:hover { color: #6b9467; }
  .bp-prose strong { color: #2d3142; font-weight: 600; }
  .bp-prose hr { border: none; border-top: 1px solid #e5dfd4; margin: 2.5em 0; }
  .bp-prose blockquote {
    border-left: 3px solid #4a6741;
    background: #f5f0e8;
    border-radius: 0 12px 12px 0;
    padding: 18px 24px;
    margin: 1.8em 0;
    font-style: italic;
    color: #2d3142;
  }
  .bp-prose code {
    background: #f0ece4;
    color: #2d3142;
    padding: 2px 6px;
    border-radius: 5px;
    font-size: 0.9em;
  }
  .bp-prose pre {
    background: #2d3142;
    color: #f5f0e8;
    padding: 20px 24px;
    border-radius: 14px;
    overflow-x: auto;
    margin: 1.8em 0;
  }
  .bp-prose pre code { background: none; color: inherit; padding: 0; }

  /* Prev/next nav */
  .bp-nav-card {
    display: block;
    text-decoration: none;
    background: #ffffff;
    border: 1px solid #e8e1d6;
    border-radius: 16px;
    padding: 24px;
    transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
  }
  .bp-nav-card:hover {
    box-shadow: 0 8px 28px rgba(45,49,66,0.09);
    transform: translateY(-3px);
    border-color: #4a6741;
  }

  /* Sources */
  .bp-source {
    background: #f5f0e8;
    border: 1px solid #e8e1d6;
    border-radius: 12px;
    padding: 16px 20px;
  }

  /* Not found */
  .bp-notfound {
    background: #fff;
    border: 1px solid #e8e1d6;
    border-radius: 20px;
    padding: 48px;
    text-align: center;
    max-width: 480px;
    margin: 64px auto;
  }

  @media (max-width: 768px) {
    .bp-nav-grid    { grid-template-columns: 1fr !important; }
    .bp-hero-img-wrap { aspect-ratio: 16/9; }
    .bp-prose       { font-size: 16px; }
    .bp-prose h2    { font-size: 22px; }
    .bp-prose h3    { font-size: 18px; }
  }
`;

function joinUrl(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function formatDateNl(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogPost() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const sortedPosts = useMemo(
    () => posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
    []
  );

  const postIndex = useMemo(() => sortedPosts.findIndex((p) => p.slug === slug), [sortedPosts, slug]);
  const post      = postIndex >= 0 ? sortedPosts[postIndex]     : undefined;
  const prevPost  = postIndex >= 0 ? sortedPosts[postIndex + 1] : undefined;
  const nextPost  = postIndex >= 0 ? sortedPosts[postIndex - 1] : undefined;

  const siteUrl      = (import.meta as any).env?.VITE_SITE_URL || "";
  const canonicalUrl = post ? joinUrl(siteUrl, post.seo.canonicalPath) : joinUrl(siteUrl, "/blog");
  const shareUrl     = canonicalUrl || (post ? post.seo.canonicalPath : "/blog");

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link gekopieerd!");
    } catch {
      prompt("Kopieer deze link:", shareUrl);
    }
  }

  /* ── NOT FOUND ── */
  if (!post) {
    return (
      <div className="bp-page">
        <style>{globalStyles}</style>
        <Seo
          title="Artikel niet gevonden | CoParenting"
          description="Dit artikel bestaat niet (meer) of de link is onjuist."
          canonicalUrl={joinUrl(siteUrl, "/blog")}
        />
        <SiteHeader />
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px" }}>
          <div className="bp-notfound">
            <p className="bp-serif" style={{ fontSize: 24, fontWeight: 500, color: tk.slate, margin: "0 0 12px" }}>
              Artikel niet gevonden
            </p>
            <p style={{ fontSize: 15, color: tk.muted, margin: "0 0 32px" }}>
              Dit artikel bestaat niet (meer) of de link is onjuist.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
              <Link to="/blog" className="bp-btn-primary">
                <ArrowLeft size={16} /> Terug naar blog
              </Link>
              <Link to="/" className="bp-btn-ghost">
                <Home size={16} /> Naar home
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="bp-page">
      <style>{globalStyles}</style>
      <Seo
        title={post.seo.title}
        description={post.seo.description}
        canonicalUrl={canonicalUrl}
        ogTitle={post.seo.ogTitle}
        ogDescription={post.seo.ogDescription}
        ogImage={post.seo.ogImage}
        keywords={post.seo.keywords}
      />

      <SiteHeader />

      {/* ── BREADCRUMB BAR ── */}
      <div className="bp-topbar">
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={() => navigate(-1)} className="bp-btn-pill">
              <ArrowLeft size={13} /> Terug
            </button>
            <span style={{ color: tk.borderLight, fontSize: 13 }}>/</span>
            <Link to="/blog" className="bp-breadcrumb-link">Blog</Link>
            <span style={{ color: tk.borderLight, fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: tk.warm, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {post.title}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={handleCopyLink} className="bp-btn-pill">
              <LinkIcon size={13} /> Link kopiëren
            </button>
            <Link to="/" className="bp-btn-pill">
              <Home size={13} /> Home
            </Link>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section style={{ background: tk.cream, padding: "48px 0 0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px" }}>

          {/* Category + meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" as const }}>
            <span className="bp-cat-tag">{post.category}</span>
            <span style={{ fontSize: 13, color: tk.muted, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={13} />{formatDateNl(post.date)}
            </span>
            <span style={{ fontSize: 13, color: tk.muted, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={13} />{post.readTime}
            </span>
            <span style={{ fontSize: 13, color: tk.muted }}>
              Door <strong style={{ color: tk.slate, fontWeight: 500 }}>{post.author}</strong>
            </span>
          </div>

          {/* Title */}
          <h1 className="bp-serif" style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 500, lineHeight: 1.18, color: tk.slate, margin: "0 0 20px" }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          <p style={{ fontSize: 18, lineHeight: 1.75, color: tk.muted, margin: "0 0 36px" }}>
            {post.excerpt}
          </p>

          {/* Share */}
          <div style={{ display: "flex", gap: 10, marginBottom: 40, flexWrap: "wrap" as const }}>
            <button type="button" onClick={handleCopyLink} className="bp-btn-primary">
              <Share2 size={16} /> Deel artikel
            </button>
            <Link to="/blog" className="bp-btn-ghost">
              <ArrowLeft size={16} /> Terug naar overzicht
            </Link>
          </div>

          {/* Hero image */}
          <div className="bp-hero-img-wrap">
            <img src={post.image} alt={post.title} className="bp-hero-img" loading="eager" />
            <div className="bp-hero-img-overlay" />
          </div>
        </div>
      </section>

      <hr className="bp-rule" style={{ marginTop: 0 }} />

      {/* ── ARTICLE BODY ── */}
      <section style={{ background: tk.white, padding: "64px 32px 96px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Article content */}
          <div className="bp-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => {
                  const isExternal =
                    typeof href === "string" &&
                    (href.startsWith("http://") || href.startsWith("https://"));
                  return (
                    <a
                      href={href}
                      {...props}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noreferrer" : undefined}
                    >
                      {children}
                    </a>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: `3px solid ${tk.moss}`, background: tk.sand, borderRadius: "0 12px 12px 0", padding: "18px 24px", margin: "1.8em 0", fontStyle: "italic", color: tk.slate }}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {post.contentMd}
            </ReactMarkdown>
          </div>

          {/* Sources */}
          {post.sources?.length ? (
            <div style={{ marginTop: 56, paddingTop: 40, borderTop: `1px solid ${tk.borderLight}` }}>
              <h2 className="bp-serif" style={{ fontSize: 20, fontWeight: 500, color: tk.slate, margin: "0 0 6px" }}>Bronnen</h2>
              <p style={{ fontSize: 13, color: tk.muted, margin: "0 0 20px" }}>Gebruikt als achtergrondinformatie en verwijzing.</p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {post.sources.map((s) => (
                  <div key={s.url} className="bp-source">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, color: tk.moss, fontWeight: 500, fontSize: 14, textDecoration: "underline", textUnderlineOffset: 3 }}
                    >
                      <LinkIcon size={13} /> {s.title}
                    </a>
                    <div style={{ fontSize: 11, color: tk.warm, marginTop: 4, wordBreak: "break-all" as const }}>{s.url}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Prev / Next */}
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: `1px solid ${tk.borderLight}` }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase" as const, color: tk.warm, margin: "0 0 20px" }}>
              Meer artikelen
            </p>
            <div className="bp-nav-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {prevPost ? (
                <Link to={`/blog/${prevPost.slug}`} className="bp-nav-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <ChevronLeft size={14} color={tk.warm} />
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: tk.warm }}>Vorige</span>
                  </div>
                  <div className="bp-serif" style={{ fontSize: 15, fontWeight: 500, color: tk.slate, lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                    {prevPost.title}
                  </div>
                  <div style={{ fontSize: 13, color: tk.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                    {prevPost.excerpt}
                  </div>
                </Link>
              ) : (
                <div style={{ background: tk.sand, border: `1px solid ${tk.borderLight}`, borderRadius: 16, padding: 24, fontSize: 13, color: tk.warm }}>
                  Geen vorig artikel.
                </div>
              )}

              {nextPost ? (
                <Link to={`/blog/${nextPost.slug}`} className="bp-nav-card" style={{ textAlign: "right" as const }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: tk.warm }}>Volgende</span>
                    <ChevronRight size={14} color={tk.warm} />
                  </div>
                  <div className="bp-serif" style={{ fontSize: 15, fontWeight: 500, color: tk.slate, lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                    {nextPost.title}
                  </div>
                  <div style={{ fontSize: 13, color: tk.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                    {nextPost.excerpt}
                  </div>
                </Link>
              ) : (
                <div style={{ background: tk.sand, border: `1px solid ${tk.borderLight}`, borderRadius: 16, padding: 24, fontSize: 13, color: tk.warm, textAlign: "right" as const }}>
                  Geen volgend artikel.
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
            <Link to="/blog" className="bp-btn-ghost">
              <ArrowLeft size={16} /> Terug naar overzicht
            </Link>
            <Link to="/" className="bp-btn-primary">
              <Home size={16} /> Naar home
            </Link>
          </div>

        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
