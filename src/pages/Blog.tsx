// src/pages/Blog.tsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, Search, Sparkles, Filter } from "lucide-react";
import { posts } from "../data/blogPosts";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import Seo from "../components/Seo";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
  | "Financiën";

export default function Blog() {
  const categories: Category[] = useMemo(
    () => ["Alle", "Communicatie", "Regelingen", "Kinderen", "Planning", "Relaties", "Financiën"],
    []
  );

  const [selectedCategory, setSelectedCategory] = useState<Category>("Alle");
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return posts
      .filter((p) => selectedCategory === "Alle" || p.category === selectedCategory)
      .filter((p) => {
        if (!term) return true;
        const haystack = `${p.title} ${p.excerpt} ${p.category}`.toLowerCase();
        return haystack.includes(term);
      })
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [selectedCategory, search]);

  const featured = filteredPosts[0];
  const rest = featured ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Blog | CoParenting"
        description="Tips, inzichten en praktische handvatten voor co-ouderschap: communicatie, regelingen, planning, kinderen en financiën."
        canonicalUrl={(import.meta as any).env?.VITE_SITE_URL ? `${(import.meta as any).env.VITE_SITE_URL}/blog` : undefined}
        ogTitle="Blog | CoParenting"
        ogDescription="Lees artikelen over co-ouderschap, communicatie en structuur voor rust in gezinnen."
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
              Praktische tips & inzichten
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900">
              Blog
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Artikelen over co-ouderschap: communicatie, regelingen, kinderen, planning, relaties en financiën.
              Gericht op rust, duidelijkheid en voorspelbaarheid.
            </p>

            {/* Search */}
            <div className="mt-7">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Zoek in artikelen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none text-slate-900 placeholder-slate-400 bg-white"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mt-6 flex flex-wrap gap-2.5 items-center">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter className="w-4 h-4" />
                Filter:
              </span>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cx(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                    selectedCategory === cat
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results info */}
            <div className="mt-5 text-sm text-slate-600">
              {filteredPosts.length} {filteredPosts.length === 1 ? "artikel" : "artikelen"} gevonden
              {selectedCategory !== "Alle" ? <span className="text-slate-400"> • {selectedCategory}</span> : null}
              {search.trim() ? <span className="text-slate-400"> • zoekterm: “{search.trim()}”</span> : null}
              {(search.trim() || selectedCategory !== "Alle") ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("Alle");
                  }}
                  className="ml-3 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {featured ? (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition">
              <div className="grid lg:grid-cols-2">
                <Link to={`/blog/${featured.slug}`} className="block relative h-64 lg:h-full overflow-hidden">
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      {featured.category}
                    </span>
                  </div>
                </Link>

                <div className="p-7 sm:p-10">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Uitgelicht
                  </div>

                  <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                    <Link to={`/blog/${featured.slug}`} className="hover:text-blue-600 transition-colors">
                      {featured.title}
                    </Link>
                  </h2>

                  <p className="mt-4 text-slate-600 leading-relaxed">
                    {featured.excerpt}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateNlShort(featured.date)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featured.readTime}
                    </span>
                  </div>

                  <div className="mt-7">
                    <Link
                      to={`/blog/${featured.slug}`}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition"
                    >
                      Lees artikel
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Grid */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {rest.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <Link to={`/blog/${post.slug}`} className="block relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>
                </Link>

                <div className="p-6">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 leading-snug">
                    <Link to={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateNlShort(post.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                      aria-label="Lees artikel"
                      title="Lees artikel"
                    >
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Empty state */}
          {filteredPosts.length === 0 ? (
            <div className="mt-10 text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-700 font-semibold">Geen artikelen gevonden</p>
              <p className="text-sm text-slate-500 mt-1">Probeer een andere zoekterm of filter.</p>
              <button
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("Alle");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : null}

          {/* Bottom CTA */}
          <div className="mt-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-10 text-center text-white shadow-xl shadow-blue-200/50">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Klaar voor meer rust en overzicht?</h2>
            <p className="mt-3 text-blue-100 max-w-2xl mx-auto">
              Start gratis en organiseer afspraken, verzoeken en logboek op één plek.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-2xl font-semibold hover:bg-blue-50 transition shadow-lg"
              >
                Start gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-blue-700/30 text-white px-7 py-3.5 rounded-2xl font-semibold border border-blue-200/20 hover:bg-blue-700/40 transition"
              >
                Bekijk prijzen
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
