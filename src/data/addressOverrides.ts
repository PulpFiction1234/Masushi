// Local overrides for addresses that Mapbox doesn't have numeration for.
// Key is a normalized address (lowercase, punctuation removed). Fill coords with [lng, lat].
export const addressOverrides: Record<string, { coords: [number, number]; label?: string }> = {
  // Ejemplo: la dirección que reportaste
  "avenida paseo pie andino 3286": {
    coords: [-70.53602853176628, -33.577623371698856], // [lng, lat]
    label: "Avenida Paseo Pie Andino 3286, Puente Alto",
  },
  "av diego portales 6577": {
    coords: [-70.54831321642476, -33.56056698565852], // [lng, lat]
    label: "Av. Diego Portales 6577, Puente Alto",
  },
  "avenida diego portales 6577": {
    coords: [-70.54831321642476, -33.56056698565852],
    label: "Av. Diego Portales 6577, Puente Alto",
  },
  "av diego portales 6537": {
    coords: [-70.54821010293149, -33.560136525062454], // [lng, lat]
    label: "Av. Diego Portales 6537, Puente Alto",
  },
  "avenida diego portales 6537": {
    coords: [-70.54821010293149, -33.560136525062454],
    label: "Av. Diego Portales 6537, Puente Alto",
  },
  "av diego portales 07072": {
    coords: [-70.53717216114084, -33.561839439351495], // [lng, lat]
    label: "Av. Diego Portales 07072, Puente Alto",
  },
  "avenida diego portales 07072": {
    coords: [-70.53717216114084, -33.561839439351495],
    label: "Av. Diego Portales 07072, Puente Alto",
  },
  "av diego portales 7072": {
    coords: [-70.53717216114084, -33.561839439351495],
    label: "Av. Diego Portales 7072, Puente Alto",
  },
  "avenida diego portales 7072": {
    coords: [-70.53717216114084, -33.561839439351495],
    label: "Av. Diego Portales 7072, Puente Alto",
  },
};

export default addressOverrides;
