// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: { formats: ["image/avif", "image/webp"], qualities: [60] },

  async redirects() {
    return [
      // Redirecciona la variante de marca "Mazushi" → home (SEO-friendly 301)
      { source: "/:alias(mazushi|Mazushi|MAZUSHI)", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
