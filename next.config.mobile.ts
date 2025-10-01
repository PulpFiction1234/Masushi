// next.config.mobile.ts - Configuración específica para Capacitor
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: { formats: ["image/avif", "image/webp"], qualities: [60] },
  output: 'export', // Exportar como SPA estática para Capacitor
  distDir: 'out',   // Carpeta de salida
  
  // Deshabilitar features que no funcionan en export estático
  async redirects() {
    return [];
  },
};

export default nextConfig;