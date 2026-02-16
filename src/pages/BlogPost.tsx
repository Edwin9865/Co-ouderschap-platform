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

function joinUrl(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function formatDateNl(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BlogPost() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const sortedPosts = useMemo(
    () => posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)),
    []
  );

  const postIndex = useMemo(() => sortedPosts.findIndex((p) => p.slug === slug), [sortedPosts, slug]);
  const post = postIndex >= 0 ? sortedPosts[postIndex] : undefined;

  const prevPost = postIndex >= 0 ? sortedPosts[postIndex + 1] : undefined;
  const nextPost = postIndex >= 0 ? sortedPosts[postIndex - 1] : undefined;

  // Website base url (optioneel). Zet in .env: VITE_SITE_URL=https://jouwdomein.nl
  const siteUrl = (import.meta as any).env?.VITE_SITE_URL || "";
  const canonicalUrl = post ? joinUrl(siteUrl, post.seo.canonicalPath) : joinUrl(siteUrl, "/blog");
  const shareUrl = canonicalUrl || (post ? post.seo.canonicalPath : "/blog");

  // Markdown styling (Tailwind Typography)
  // Belangrijk: je krijgt geen “lijnen tussen alinea's” meer zolang je géén prose-p:border… classes gebruikt.
  const proseClass =
    "prose prose-slate max-w-none " +
    "prose-headings:scroll-mt-24 " +
    "prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-2xl prose-h2:font-extrabold " +
    "prose-h3:mt-8 prose-h3:mb-2 prose-h3:text-xl prose-h3:font-bold " +
    "prose-p:leading-relaxed prose-p:my-4 " +
    "prose-ul:my-4 prose-ol:my-4 prose-li:my-1 " +
    "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-2 " +
    "prose-strong:text-slate-900 " +
    "prose-hr:my-10 prose-hr:border-slate-200 " +
    "prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-slate-100 prose-code:text-slate-800 " +
    "prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-pre:p-4 prose-pre:overflow-x-auto";

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Heel klein, geen toast lib: simpele UX
      alert("Link gekopieerd!");
    } catch {
      // fallback
      prompt("Kopieer deze link:", shareUrl);
    }
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Seo
          title="Artikel niet gevonden | CoParenting"
          description="Dit artikel bestaat niet (meer) of de link is onjuist."
          canonicalUrl={joinUrl(siteUrl, "/blog")}
        />
        <SiteHeader />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Artikel niet gevonden</h1>
            <p className="mt-3 text-slate-600">
              Dit artikel bestaat niet (meer) of de link is onjuist.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug naar blog
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Naar home
              </Link>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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

      {/* Breadcrumb / top bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                title="Vorige pagina"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug
              </button>

              <span className="text-slate-300">/</span>

              <Link to="/blog" className="text-slate-600 hover:text-slate-900 font-semibold">
                Blog
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 line-clamp-1">{post.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                title="Kopieer link"
              >
                <LinkIcon className="w-4 h-4" />
                Link
              </button>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
                title="Home"
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative h-64 sm:h-80">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  {post.category}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {post.title}
              </h1>

              <p className="mt-4 text-slate-600 leading-relaxed text-lg">
                {post.excerpt}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDateNl(post.date)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>

                <span className="text-slate-300">•</span>

                <span className="text-slate-600">
                  Door <span className="font-semibold text-slate-800">{post.author}</span>
                </span>
              </div>

              {/* Quick actions */}
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  <Share2 className="w-4 h-4" />
                  Deel / kopieer link
                </button>

                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-slate-800 font-semibold border border-slate-200 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar overzicht
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
            {/* Meta chips */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Categorie:</span> {post.category}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">Leestijd:</span> {post.readTime}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
              >
                <LinkIcon className="w-4 h-4" />
                Kopieer link
              </button>
            </div>

            {/* Markdown */}
            <div className={proseClass}>
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
                    <blockquote className="border-l-4 border-blue-200 bg-blue-50/40 rounded-r-2xl px-4 py-3 my-6">
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
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900">Bronnen</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Gebruikt als achtergrondinformatie en verwijzing.
                </p>

                <ul className="mt-5 space-y-3">
                  {post.sources.map((s) => (
                    <li key={s.url} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <a
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span>{s.title}</span>
                      </a>
                      <div className="text-xs text-slate-500 break-all mt-1">{s.url}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Prev / Next */}
            <div className="mt-12 pt-8 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
              {prevPost ? (
                <Link
                  to={`/blog/${prevPost.slug}`}
                  className="group rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 transition p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Vorige</div>
                    <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <div className="mt-2 font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {prevPost.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {prevPost.excerpt}
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500 text-sm">
                  Geen vorig artikel.
                </div>
              )}

              {nextPost ? (
                <Link
                  to={`/blog/${nextPost.slug}`}
                  className="group rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 transition p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Volgende</div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <div className="mt-2 font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {nextPost.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {nextPost.excerpt}
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-500 text-sm">
                  Geen volgend artikel.
                </div>
              )}
            </div>

            {/* Bottom nav */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug naar overzicht
              </Link>

              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Naar home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
