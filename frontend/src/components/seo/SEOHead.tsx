import Head from "next/head";
import { useRouter } from "next/router";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object | object[];
  robots?: string;
}

const defaultSEO = {
  title: "CodeRacer - Real-Time Algorithm Coding Races",
  description:
    "Race developers in real time, solve algorithm challenges, and improve your competitive programming skills with instant judging.",
  keywords:
    "coding, programming, algorithm, competition, race, real-time, coding challenge, programming practice, coding skills",
  image: "/code_racer_hero2.webp",
  url: "https://coderacer.codes",
  type: "website",
  author: "CodeRacer Team",
};

export default function SEOHead({
  title = defaultSEO.title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  image = defaultSEO.image,
  url,
  type = defaultSEO.type,
  author = defaultSEO.author,
  publishedTime,
  modifiedTime,
  structuredData,
  robots = "index, follow",
}: SEOHeadProps) {
  const router = useRouter();
  const locale = router.locale === "ko" ? "ko" : "en";
  const path = router.asPath.split(/[?#]/)[0] || "/";
  const localizedPath = path === "/" ? "" : path;
  const canonicalPath = locale === "ko" ? `/ko${localizedPath}` : localizedPath;
  const fullTitle = title.includes("CodeRacer")
    ? title
    : `${title} | CodeRacer`;
  const fullImageUrl = image.startsWith("http")
    ? image
    : `${defaultSEO.url}${image}`;
  const fullUrl = url
    ? url.startsWith("http")
      ? url
      : `${defaultSEO.url}${locale === "ko" ? "/ko" : ""}${url === "/" ? "" : url}`
    : `${defaultSEO.url}${canonicalPath}`;
  const englishUrl = `${defaultSEO.url}${localizedPath}`;
  const koreanUrl = `${defaultSEO.url}/ko${localizedPath}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content={robots} key="robots" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      <link rel="alternate" hrefLang="en" href={englishUrl} />
      <link rel="alternate" hrefLang="ko" href={koreanUrl} />
      <link rel="alternate" hrefLang="x-default" href={englishUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="CodeRacer" />
      <meta property="og:locale" content={locale === "ko" ? "ko_KR" : "en_US"} />
      <meta property="og:locale:alternate" content={locale === "ko" ? "en_US" : "ko_KR"} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional Meta Tags */}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />

      {/* Structured Data */}
      {structuredData && (
        <>
          {Array.isArray(structuredData) ? (
            structuredData.map((data, index) => (
              <script
                key={index}
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(data),
                }}
              />
            ))
          ) : (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData),
              }}
            />
          )}
        </>
      )}
    </Head>
  );
}
