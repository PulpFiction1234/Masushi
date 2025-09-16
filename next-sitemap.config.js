// next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
const SITE =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.masushi.cl';

module.exports = {
  siteUrl: SITE,
  generateRobotsTxt: false,           // 👈 usas el de /public
  generateIndexSitemap: false,
  exclude: ['/admin', '/login', '/checkout', '/api/*', '/api/admin/*', '/api/debug/*'],
  // robotsTxtOptions eliminado porque no aplica si generateRobotsTxt=false
  alternateRefs: [
    { href: SITE, hreflang: 'es-cl' },
    { href: SITE, hreflang: 'es' },
  ],
  transform: async (config, path) => {
    const isHome = path === '/';
    const isMenu = path === '/menu';
    const isLocal = path === '/local';
    return {
      loc: `${config.siteUrl}${path}`,
      changefreq: isHome || isMenu ? 'daily' : 'weekly',
      priority: isHome ? 1.0 : isMenu ? 0.9 : isLocal ? 0.8 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
