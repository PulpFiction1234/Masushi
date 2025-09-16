// src/components/LocalBusinessJsonLd.tsx
import Head from "next/head";
import React from "react";

type LocalBusinessJsonLdProps = {
  name: string;
  url: string;
  telephone: string;          // E.164 recomendado: +56227557931
  image: string;              // URL absoluta o relativa
  streetAddress: string;
  addressLocality: string;    // Puente Alto, etc.
  addressRegion: string;      // Región Metropolitana, etc.
  postalCode?: string;
  sameAs?: string[];          // redes, whatsapp…
  alternateNames?: string[];  // “Mazushi”, etc.
  serviceAreas?: string[];    // sectores de cobertura
  menuUrl?: string;           // URL del menú
  priceRange?: string;        // $, $$, $$$
  acceptsReservations?: boolean;
};

function dedupeNonEmpty(arr?: string[]): string[] | undefined {
  if (!arr || arr.length === 0) return undefined;
  const set = new Set<string>();
  for (const v of arr) {
    const s = (v ?? "").trim();
    if (s) set.add(s);
  }
  return set.size ? Array.from(set) : undefined;
}

export default function LocalBusinessJsonLd(props: LocalBusinessJsonLdProps) {
  const {
    name,
    url,
    telephone,
    image,
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode,
    sameAs,
    alternateNames,
    serviceAreas,
    menuUrl,
    priceRange,
    acceptsReservations,
  } = props;

  const sameAsClean = dedupeNonEmpty(sameAs);
  const altNamesClean = dedupeNonEmpty(alternateNames);

  const areaServed =
    serviceAreas && serviceAreas.length
      ? serviceAreas
          .map((area) => (area || "").trim())
          .filter(Boolean)
          .map((area) => ({
            "@type": "AdministrativeArea" as const,
            name: area,
          }))
      : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant", // más específico que LocalBusiness
    name,
    url,
    telephone,
    image,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion,
      ...(postalCode ? { postalCode } : {}),
    },
    ...(sameAsClean ? { sameAs: sameAsClean } : {}),
    ...(altNamesClean ? { alternateName: altNamesClean } : {}),
    ...(areaServed ? { areaServed } : {}),
    ...(menuUrl ? { menu: menuUrl } : {}),
    ...(priceRange ? { priceRange } : {}),
    ...(typeof acceptsReservations === "boolean"
      ? { acceptsReservations }
      : {}),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        // JSON.stringify omite las claves con undefined, así que no hace falta limpiar más.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
