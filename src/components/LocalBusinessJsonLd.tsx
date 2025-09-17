// src/components/LocalBusinessJsonLd.tsx
import Head from "next/head";
import React from "react";

// Tipo para el esquema de horarios
export type OpeningHoursSchema = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
};

// Tipo para el esquema de calificaciones
export type AggregateRatingSchema = {
  "@type": "AggregateRating";
  ratingValue: string;
  reviewCount: string;
};

type LocalBusinessJsonLdProps = {
  name: string;
  url: string;
  telephone: string;
  image: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  sameAs?: string[];
  alternateNames?: string[];
  serviceAreas?: string[];
  menuUrl?: string;
  priceRange?: string;
  acceptsReservations?: boolean;
  openingHoursSpecification?: OpeningHoursSchema[];
  aggregateRating?: AggregateRatingSchema;
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
    openingHoursSpecification,
    aggregateRating,
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
    "@type": "Restaurant",
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
    ...(openingHoursSpecification?.length
      ? { openingHoursSpecification }
      : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
