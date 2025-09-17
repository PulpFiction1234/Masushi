import { HORARIO_SEMANAL, Intervalo } from "./horarios";
import type { OpeningHoursSchema } from "@/components/LocalBusinessJsonLd";

// Mapeo de claves a nombres completos de días en inglés para Schema.org
const DAY_MAPPING: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export function getOpeningHoursSchema(): OpeningHoursSchema[] {
  const openingHours: OpeningHoursSchema[] = [];

  // Recorre tu objeto de horarios semanal
  for (const [dayKey, intervals] of Object.entries(HORARIO_SEMANAL)) {
    // Si el día no tiene horarios, lo ignora
    if (!intervals || intervals.length === 0) continue;

    const dayName = DAY_MAPPING[dayKey];
    if (!dayName) continue; // Por si hay una clave inesperada

    // Por cada intervalo de un día, crea un objeto de Schema.org
    for (const [opens, closes] of intervals as Intervalo[]) {
      const spec: OpeningHoursSchema = {
        "@type": "OpeningHoursSpecification" as const,
        dayOfWeek: dayName,
        opens,
        closes,
      };
      openingHours.push(spec);
    }
  }

  return openingHours;
}