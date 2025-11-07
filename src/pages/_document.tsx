// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es-CL">
      <Head>
        <meta name="theme-color" content="#111827" />
        {/* 👇 meta de verificación Google */}
        <meta
          name="google-site-verification"
          content="AgtxuuLvLTb5rm_EHTSHUCoB4sLrXfzGsAID9NW1cUs"
        />
        {/* 👇 meta de verificación para Meta / Facebook - reemplaza el content por el token exacto que te dio Meta */}
        <meta
          name="facebook-domain-verification"
          content="nnnl291z7l0emfmf1kz7bzdqgy9n6b"
        />
        {/* favicons opcionales... */}
      </Head>
      <body className="bg-neutral-950 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
