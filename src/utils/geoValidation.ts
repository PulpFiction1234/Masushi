import * as turf from "@turf/turf";

export const createPolygonFeature = (polygonCoords: number[][]) => {
  return turf.polygon([[...polygonCoords, polygonCoords[0]]]);
};

export const isPointInPolygon = (
  coords: [number, number],
  polygonCoords: number[][]
) => {
  const point = turf.point(coords);
  const polygon = createPolygonFeature(polygonCoords);
  return turf.booleanPointInPolygon(point, polygon);
};

