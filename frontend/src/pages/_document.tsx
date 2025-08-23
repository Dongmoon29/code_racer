import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="ko">
        <Head>
          {/* 폰트 및 기타 head 요소들 */}
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          {/* 메타 태그들 */}
          <meta
            name="description"
            content="Code Racer - 실시간 코딩 경쟁 플랫폼"
          />
          <meta
            name="keywords"
            content="coding, race, competition, programming, algorithm"
          />
          <meta name="author" content="Code Racer Team" />

          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/logo.png" />

          {/* Open Graph */}
          <meta property="og:title" content="Code Racer" />
          <meta property="og:description" content="실시간 코딩 경쟁 플랫폼" />
          <meta property="og:image" content="/code_racer_hero.png" />
          <meta property="og:type" content="website" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Code Racer" />
          <meta name="twitter:description" content="실시간 코딩 경쟁 플랫폼" />
          <meta name="twitter:image" content="/code_racer_hero.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
