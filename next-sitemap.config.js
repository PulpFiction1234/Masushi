/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  generateIndexSitemap: false, // un solo sitemap
  exclude: ['/admin', '/login', '/checkout', '/api/*', '/api/admin/*', '/api/debug/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/login', '/checkout', '/api/'] },
    ],
  },
  transform: async (config, path) => {
    const isHome = path === '/';
    return {
      loc: `${config.siteUrl}${path}`,
      changefreq: isHome ? 'daily' : 'weekly',
      priority: isHome ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
    };
  },
};
