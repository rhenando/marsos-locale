/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://marsos.sa",
  generateRobotsTxt: false,
  cleanup: true,
  changefreq: "daily",
  priority: 0.7,

  exclude: [
    "/404",
    "/cart",
    "/checkout",
    "/checkout/*",
    "/payment-details",
    "/payment-failed",
    "/orders",
    "/orders/*",
    "/buyer-messages",
    "/buyer-dashboard",
    "/buyer-dashboard/*",
    "/admin-login",
    "/admin-dashboard",
    "/admin-dashboard/*",
    "/supplier-dashboard",
    "/supplier-dashboard/*",
    "/user-*",
    "/api/**",
    "/sentry-example-page",
    "/sentry-example-page/*",
  ],

  i18n: {
    locales: ["en", "ar"],
    defaultLocale: "en",
  },

  additionalPaths: async (config) => [
    {
      loc: "https://marsos.sa",
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: "https://marsos.sa/ar",
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: "https://marsos.sa/en",
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: 1.0,
    },
  ],
};
