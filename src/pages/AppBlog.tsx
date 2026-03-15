// src/pages/AppBlog.tsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Calendar, Clock, Search, BookOpen, ChevronRight } from 'lucide-react';
import { allPosts } from '../data/allBlogPosts';

const CATEGORY_COLORS: Record<string, string> = {
  Communicatie: 'bg-blue-100 text-blue-700',
  Regelingen: 'bg-emerald-100 text-emerald-700',
  Kinderen: 'bg-purple-100 text-purple-700',
  Feestdagen: 'bg-amber-100 text-amber-700',
  Financieel: 'bg-rose-100 text-rose-700',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700';
}

/* ─── List view ─── */
function BlogList() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = allPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Artikelen</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Praktische informatie over co-ouderschap
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek artikelen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">Geen artikelen gevonden.</p>
        )}
        {filtered.map((post) => (
          <button
            key={post.slug}
            onClick={() => navigate(`/artikelen/${post.slug}`)}
            className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor(post.category)}`}>
                  {post.category}
                </span>
              </div>
              <h2 className="font-semibold text-gray-900 mb-1 leading-snug">{post.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Detail view ─── */
function BlogDetail({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-gray-500 mb-4">Artikel niet gevonden.</p>
        <button
          onClick={() => navigate('/artikelen')}
          className="text-emerald-600 font-medium hover:underline"
        >
          Terug naar overzicht
        </button>
      </div>
    );
  }

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/artikelen')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Alle artikelen
      </button>

      {/* Hero image */}
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-52 object-cover rounded-2xl mb-6"
        />
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColor(post.category)}`}>
          {post.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" /> {post.date}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" /> {post.readTime}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{post.title}</h1>
      <p className="text-gray-500 text-sm mb-1">Door {post.author}</p>

      <hr className="my-5 border-gray-100" />

      {/* Content */}
      <div className="prose prose-sm prose-gray max-w-none
        prose-headings:font-semibold prose-headings:text-gray-900
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-li:text-gray-700
        prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900
        prose-blockquote:border-l-emerald-400 prose-blockquote:text-gray-500
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMd}</ReactMarkdown>
      </div>

      {/* Sources */}
      {post.sources && post.sources.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bronnen</p>
          <ul className="space-y-1">
            {post.sources.map((s, i) => (
              <li key={i} className="text-sm text-emerald-600">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prev / Next */}
      {(prev || next) && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {prev ? (
            <Link
              to={`/artikelen/${prev.slug}`}
              className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:shadow-sm transition-shadow"
            >
              <p className="text-xs text-gray-400 mb-1">Vorig artikel</p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{prev.title}</p>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              to={`/artikelen/${next.slug}`}
              className="bg-white border border-gray-100 rounded-xl p-3 text-right hover:shadow-sm transition-shadow"
            >
              <p className="text-xs text-gray-400 mb-1">Volgend artikel</p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{next.title}</p>
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
}

/* ─── Router wrapper ─── */
export function AppBlog() {
  const { slug } = useParams<{ slug?: string }>();
  return slug ? <BlogDetail slug={slug} /> : <BlogList />;
}
