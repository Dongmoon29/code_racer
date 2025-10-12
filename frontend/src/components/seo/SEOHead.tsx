import Head from 'next/head';

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
}

const defaultSEO = {
  title: 'CodeRacer - Real-time Coding Competitions',
  description:
    'Improve your coding skills by competing with friends in real-time. Join thousands of coders in fun, competitive coding challenges.',
  keywords:
    'coding, programming, algorithm, competition, race, real-time, coding challenge, programming practice, coding skills',
  image: '/code_racer_hero.webp',
  url: 'https://coderacer.app',
  type: 'website',
  author: 'CodeRacer Team',
};

export default function SEOHead({
  title = defaultSEO.title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  image = defaultSEO.image,
  url = defaultSEO.url,
  type = defaultSEO.type,
  author = defaultSEO.author,
  publishedTime,
  modifiedTime,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title.includes('CodeRacer')
    ? title
    : `${title} | CodeRacer`;
  const fullImageUrl = image.startsWith('http')
    ? image
    : `${defaultSEO.url}${image}`;
  const fullUrl = url.startsWith('http') ? url : `${defaultSEO.url}${url}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="CodeRacer" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@coderacer" />
      <meta name="twitter:creator" content="@coderacer" />

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

      {/* Preload Critical Resources */}
      <link rel="preload" as="image" href="/code_racer_hero.webp" />
      <link rel="preload" as="image" href="/logo.png" />
      <link rel="preload" as="image" href="/track.webp" />
    </Head>
  );
}
