// next.config.ts
import type { NextConfig } from "next";

const isMobileBuild = process.env.NEXT_CONFIG === 'mobile';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: { formats: ["image/avif", "image/webp"], qualities: [60] },
  
  // Para build móvil, exportar como SPA estática
  ...(isMobileBuild && {
    output: 'export',
    distDir: 'out',
    trailingSlash: true,
    images: { 
      ...{ formats: ["image/avif", "image/webp"], qualities: [60] },
      unoptimized: true 
    },
  }),

  async redirects() {
    // No redirects en mobile build
    if (isMobileBuild) return [];
    
    return [
      // Redirecciona la variante de marca "Mazushi" → home (SEO-friendly 301)
      { source: "/:alias(mazushi|Mazushi|MAZUSHI)", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
