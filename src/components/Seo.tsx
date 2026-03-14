// src/components/Seo.tsx
import { Helmet } from "react-helmet-async";

type SeoProps = {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  keywords?: string[];
  jsonLd?: object | object[];
};

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://coparenting.nl";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function Seo({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = "website",
  keywords,
  jsonLd,
}: SeoProps) {
  const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
  const resolvedOgUrl = ogUrl || canonicalUrl;

  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords?.length ? <meta name="keywords" content={keywords.join(", ")} /> : null}

      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:alt" content={ogTitle || title} />
      {resolvedOgUrl ? <meta property="og:url" content={resolvedOgUrl} /> : null}
      <meta property="og:site_name" content="CoParenting" />
      <meta property="og:locale" content="nl_NL" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={resolvedOgImage} />

      {jsonLdArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
