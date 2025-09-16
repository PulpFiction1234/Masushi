// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es-CL">
      <Head>
        {/* Color del tema para navegadores móviles */}
        <meta name="theme-color" content="#111827" />

        {/* Favicons / manifest (opcional, coloca los archivos en /public) */}
        {/* <link rel="icon" href="/favicon.ico" /> */}
        {/* <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" /> */}
        {/* <link rel="manifest" href="/site.webmanifest" /> */}
      </Head>
      <body className="bg-neutral-950 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
