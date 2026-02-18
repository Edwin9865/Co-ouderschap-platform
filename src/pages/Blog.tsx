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
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full bg-white border-2 border-teal-200 text-teal-700 shadow-sm">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Praktische tips & inzichten
            </div>

            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Blog
            </h1>
            <p className="mt-6 text-xl text-gray-700 leading-relaxed">
              Artikelen over co-ouderschap: communicatie, regelingen, kinderen, planning, relaties en financiën.
              Gericht op rust, duidelijkheid en voorspelbaarheid.
            </p>

            {/* Search */}
            <div className="mt-10">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek in artikelen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 focus:outline-none text-gray-900 placeholder-gray-400 bg-white font-medium text-lg"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mt-8 flex flex-wrap gap-3 items-center">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-600">
                <Filter className="w-5 h-5" />
                Filter:
              </span>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cx(
                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all border-2",
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-600 shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results info */}
            <div className="mt-6 text-base text-gray-600 font-medium">
              {filteredPosts.length} {filteredPosts.length === 1 ? "artikel" : "artikelen"} gevonden
              {selectedCategory !== "Alle" ? <span className="text-gray-400"> • {selectedCategory}</span> : null}
              {search.trim() ? <span className="text-gray-400"> • zoekterm: "{search.trim()}"</span> : null}
              {(search.trim() || selectedCategory !== "Alle") ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("Alle");
                  }}
                  className="ml-4 text-teal-600 hover:text-teal-700 font-bold"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Grid - Featured section removed as requested */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <Link to={`/blog/${post.slug}`} className="block relative h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent" />
                  <div className="absolute top-5 left-5">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg">
                      {post.category}
                    </span>
                  </div>
                </Link>

                <div className="p-7">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3 leading-snug">
                    <Link to={`/blog/${post.slug}`} className="hover:text-teal-600 transition-colors">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-gray-600 text-base leading-relaxed mb-5">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-5 border-t-2 border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDateNlShort(post.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-2xl border-2 border-gray-200 bg-white hover:bg-teal-50 hover:border-teal-200 transition-all group-hover:translate-x-1"
                      aria-label="Lees artikel"
                      title="Lees artikel"
                    >
                      <ArrowRight className="w-5 h-5 text-teal-600" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Empty state */}
          {filteredPosts.length === 0 ? (
            <div className="mt-10 text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-900 font-bold text-xl">Geen artikelen gevonden</p>
              <p className="text-base text-gray-600 mt-2">Probeer een andere zoekterm of filter.</p>
              <button
                className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white border-2 border-gray-200 hover:bg-gray-50 hover:shadow-lg font-bold transition-all"
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
          <div className="mt-20 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 rounded-3xl p-10 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold">Klaar voor meer rust en overzicht?</h2>
              <p className="mt-4 text-xl text-teal-50 max-w-2xl mx-auto leading-relaxed">
                Start gratis en organiseer afspraken, verzoeken en logboek op één plek.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 bg-white text-teal-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                >
                  Start gratis
                  <ArrowRight className="w-6 h-6" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-3 bg-teal-700/30 text-white px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-teal-700/50 hover:-translate-y-0.5 transition-all backdrop-blur-sm"
                >
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
