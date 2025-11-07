import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Preconnect to external domains for faster loading */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />

          {/* Fonts with optimized loading */}
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          {/* Meta tags */}
          <meta
            name="description"
            content="Code Racer - Real-time Coding Competition Platform"
          />
          <meta
            name="keywords"
            content="coding, race, competition, programming, algorithm"
          />
          <meta name="author" content="Code Racer Team" />

          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/logo.png" />

          {/* Preload critical images with proper attributes */}
          <link
            rel="preload"
            as="image"
            href="/logo.png"
            type="image/png"
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            href="/code_racer_hero.webp"
            type="image/webp"
            fetchPriority="high"
          />
          <link
            rel="preload"
            as="image"
            href="/track.webp"
            type="image/webp"
          />

          {/* Open Graph */}
          <meta property="og:title" content="Code Racer" />
          <meta
            property="og:description"
            content="Real-time Coding Competition Platform"
          />
          <meta property="og:image" content="/code_racer_hero.png" />
          <meta property="og:type" content="website" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Code Racer" />
          <meta
            name="twitter:description"
            content="Real-time Coding Competition Platform"
          />
          <meta name="twitter:image" content="/code_racer_hero.webp" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
