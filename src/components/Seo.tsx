import Head from "next/head";

type SeoProps = {
  title?: string;
  description?: string;
  canonicalPath?: string; // p.ej. "/menu"
  image?: string;         // URL absoluta de imagen OG
  noIndex?: boolean;      // para admin/login/checkout
};

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000";

const DEFAULTS = {
  title: "Masushi — Sushi a domicilio en Puente Alto",
  description: "Sushi fresco y de calidad. Delivery en Puente Alto (sector Ciudad del Este) y retiro en tienda.",
  image: `${ORIGIN}/images/logo-masushi.webp`,
};

export default function Seo({
  title = DEFAULTS.title,
  description = DEFAULTS.description,
  canonicalPath = "/",
  image = DEFAULTS.image,
  noIndex = false,
}: SeoProps) {
  const canonical = `${ORIGIN.replace(/\/$/, "")}${canonicalPath}`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />

      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* PWA & Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* iOS PWA */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Masushi" />
      <link rel="apple-touch-icon" href="/images/logo-masushi.webp" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#ef4444" />
      <meta name="msapplication-TileColor" content="#0a0a0a" />
    </Head>
  );
}
