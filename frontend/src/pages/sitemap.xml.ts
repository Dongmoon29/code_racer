import { GetServerSideProps } from 'next';

interface SitemapProps {
  pages: Array<{
    url: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }>;
}

function generateSiteMap(pages: SitemapProps['pages']) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${pages
       .map((page) => {
         return `
       <url>
           <loc>${page.url}</loc>
           <lastmod>${page.lastmod}</lastmod>
           <changefreq>${page.changefreq}</changefreq>
           <priority>${page.priority}</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://coderacer.app';
  const currentDate = new Date().toISOString().split('T')[0];

  // Define all static pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      url: `${baseUrl}/login`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.8',
    },
    {
      url: `${baseUrl}/register`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.8',
    },
  ];

  // Generate the XML sitemap
  const sitemap = generateSiteMap(staticPages);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default SiteMap;
