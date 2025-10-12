// Local overrides for addresses that Mapbox doesn't have numeration for.
// Key is a normalized address (lowercase, punctuation removed). Fill coords with [lng, lat].
export const addressOverrides: Record<string, { coords: [number, number]; label?: string }> = {
  // Ejemplo: la dirección que reportaste
  "avenida paseo pie andino 3286": {
    // Coordenadas actualizadas desde Google Maps (user provided): lat -33.577623371698856, lng -70.53602853176628
    coords: [-70.53602853176628, -33.577623371698856], // [lng, lat]
    label: "Avenida Paseo Pie Andino 3286, Puente Alto",
  },
};

export default addressOverrides;
