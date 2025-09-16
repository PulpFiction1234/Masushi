import Head from "next/head";
import { HORARIO_SEMANAL } from "@/utils/horarios";

type Props = {
  name: string;
  url: string;                // absoluto
  telephone: string;          // +56...
  image?: string;             // logo/fachada absoluto
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry?: string;    // "CL"
  sameAs?: string[];
  alternateNames?: string[] | string;
  serviceAreas?: string[];
  /** 👇 Nuevos opcionales */
  menuUrl?: string;           // URL absoluta de /menu
  priceRange?: string;        // "$" | "$$"
  acceptsReservations?: boolean;
};

const mapDay: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export default function LocalBusinessJsonLd({
  name, url, telephone, image,
  streetAddress, addressLocality, addressRegion, postalCode,
  addressCountry = "CL", sameAs = [],
  alternateNames, serviceAreas,
  menuUrl, priceRange, acceptsReservations,
}: Props) {
  const openingHoursSpecification = Object.entries(HORARIO_SEMANAL).flatMap(([k, intervals]) => {
    const dayOfWeek = mapDay[k] || "Monday";
    if (!intervals || intervals.length === 0) return [];
    return intervals.map(([open, close]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: `${open}:00`,
      closes: `${close}:00`,
    }));
  });

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    url,
    telephone,
    image,
    servesCuisine: ["Sushi", "Japonesa"],
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry,
    },
    openingHoursSpecification,
    sameAs,
  };

  if (alternateNames && (Array.isArray(alternateNames) ? alternateNames.length : true)) {
    jsonLd.alternateName = Array.isArray(alternateNames) ? alternateNames : [alternateNames];
  }

  if (serviceAreas && serviceAreas.length) {
    jsonLd.areaServed = serviceAreas.map((n) => ({
      "@type": "Place",
      name: n,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Puente Alto",
        addressRegion: "Región Metropolitana",
        addressCountry: "CL",
      },
    }));
  }

  if (menuUrl) jsonLd.menu = menuUrl;
  if (priceRange) jsonLd.priceRange = priceRange;
  if (typeof acceptsReservations === "boolean") jsonLd.acceptsReservations = acceptsReservations;

  return (
    <Head>
      <script
        type="application/ld+json"
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
