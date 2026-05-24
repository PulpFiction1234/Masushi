/**
 * Extrae coordenadas [lng, lat] desde:
 *  - URL de Google Maps:  https://maps.google.com/maps?@-33.5776,-70.5360
 *  - Enlace de "¿Qué hay aquí?": contiene @lat,lng,zoom
 *  - ?q=lat,lng  o  ll=lat,lng
 *  - Coordenadas crudas:  "-33.5776, -70.5360"
 */
export function parseGoogleMapsCoords(input: string): [number, number] | null {
  const s = input.trim();

  // @lat,lng,…z  (el formato más común en URLs de Google Maps)
  const atMatch = s.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return [parseFloat(atMatch[2]), parseFloat(atMatch[1])];

  // ?q=lat,lng  o  &q=lat,lng
  const qMatch = s.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return [parseFloat(qMatch[2]), parseFloat(qMatch[1])];

  // ll=lat,lng
  const llMatch = s.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) return [parseFloat(llMatch[2]), parseFloat(llMatch[1])];

  // Coordenadas crudas: "-33.5776, -70.5360" o "-33.5776 -70.5360"
  const rawMatch = s.match(/^(-?\d{1,3}\.?\d*)[,\s]+(-?\d{1,3}\.?\d*)$/);
  if (rawMatch) {
    const a = parseFloat(rawMatch[1]);
    const b = parseFloat(rawMatch[2]);
    // Verificar rangos válidos: lat -90..90, lng -180..180
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [b, a]; // [lng, lat]
  }

  return null;
}
