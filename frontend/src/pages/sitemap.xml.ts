import { GetServerSideProps } from "next";

interface SitemapProps {
  pages: Array<{
    url: string;
    changefreq: string;
    priority: string;
  }>;
}

function generateSiteMap(pages: SitemapProps["pages"], baseUrl: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
     ${pages
       .map((page) => {
         return `
       <url>
           <loc>${page.url}</loc>
           <xhtml:link rel="alternate" hreflang="en" href="${page.url.replace('/ko', '')}" />
           <xhtml:link rel="alternate" hreflang="ko" href="${page.url.includes('/ko') ? page.url : page.url.replace(baseUrl, `${baseUrl}/ko`)}" />
           <changefreq>${page.changefreq}</changefreq>
           <priority>${page.priority}</priority>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coderacer.codes";
  // Only include canonical, public pages that are useful search destinations.
  const staticPages = [
    {
      url: `${baseUrl}`,
      changefreq: "weekly",
      priority: "1.0",
    },
    {
      url: `${baseUrl}/leaderboard`,
      changefreq: "daily",
      priority: "0.8",
    },
    {
      url: `${baseUrl}/community`,
      changefreq: "daily",
      priority: "0.7",
    },
  ];

  const localizedPages = staticPages.flatMap((page) => [
    page,
    { ...page, url: page.url.replace(baseUrl, `${baseUrl}/ko`) },
  ]);

  // Generate the XML sitemap
  const sitemap = generateSiteMap(localizedPages, baseUrl);

  res.setHeader("Content-Type", "text/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=604800",
  );
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
