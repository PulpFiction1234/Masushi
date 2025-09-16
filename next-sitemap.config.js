// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
const SITE =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.masushi.cl';

module.exports = {
  siteUrl: SITE,
  generateRobotsTxt: true,
  generateIndexSitemap: false, // un solo sitemap
  exclude: ['/admin', '/login', '/checkout', '/api/*', '/api/admin/*', '/api/debug/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login', '/checkout', '/api/'],
      },
    ],
  },
  // Opcional: hreflang para Chile/español
  alternateRefs: [
    { href: SITE, hreflang: 'es-cl' },
    { href: SITE, hreflang: 'es' },
  ],
  transform: async (config, path) => {
    let priority = 0.7;
    let changefreq = 'weekly';
    if (path === '/') { priority = 1.0; changefreq = 'daily'; }
    if (path === '/menu' || path === '/local') { priority = 0.8; }
    return {
      loc: `${config.siteUrl}${path}`,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
