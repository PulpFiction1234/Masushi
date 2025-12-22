"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { zonaRepartoLngLat } from "@/data/zonaReparto";

interface LocalMapProps {
  lat: number;
  lng: number;
}

export default function LocalMap({ lat, lng }: LocalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    if (!mapboxgl.accessToken) {
      // Opcional: ayuda en desarrollo si falta el token
      // console.warn("Falta NEXT_PUBLIC_MAPBOX_TOKEN");
    }

    if (mapRef.current || !mapContainerRef.current) return;

    // Cierra cada anillo (outer + holes) para Mapbox
    const closedRings = zonaRepartoLngLat.map((ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      const isClosed = first[0] === last[0] && first[1] === last[1];
      return isClosed ? ring : [...ring, first];
    });

    // GeoJSON del polígono (con agujero si viene en data)
    const polygonGeoJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: { name: "zona-reparto" },
      geometry: {
        type: "Polygon",
        coordinates: closedRings, // Mapbox espera [ outer, hole1, hole2, ... ]
      },
    };

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [lng, lat],
      zoom: 15,
      cooperativeGestures: true,
      locale: {
    "ScrollZoomBlocker.CtrlMessage": "Usa Ctrl + Scroll para acercar el mapa",
    "ScrollZoomBlocker.CmdMessage":  "Usa ⌘ + Scroll para acercar el mapa",
    "TouchPanBlocker.Message":       "Usa dos dedos para mover el mapa",
    // (opcional) otros textos de controles:
    "NavigationControl.ZoomIn":  "Acercar",
    "NavigationControl.ZoomOut": "Alejar",
    "NavigationControl.ResetBearing": "Reiniciar orientación",
  },
    });

    // Marker del local
    new mapboxgl.Marker({ color: "#ef4444" /* rojo tailwind 500 */ })
      .setLngLat([lng, lat])
      .addTo(map);

    // Agregar fuente + capas cuando cargue el estilo
    const onStyle = () => {
      if (!map.getSource("zona-reparto-src")) {
        map.addSource("zona-reparto-src", {
          type: "geojson",
          data: polygonGeoJSON,
        });

        // Relleno (usa tu acento emerald)
        if (!map.getLayer("zona-reparto-fill")) {
          map.addLayer({
            id: "zona-reparto-fill",
            type: "fill",
            source: "zona-reparto-src",
            paint: {
              "fill-color": "#10b981", // emerald-500
              "fill-opacity": 0.15,
            },
          });
        }

        // Borde
        if (!map.getLayer("zona-reparto-line")) {
          map.addLayer({
            id: "zona-reparto-line",
            type: "line",
            source: "zona-reparto-src",
            paint: {
              "line-color": "#10b981",
              "line-width": 2,
            },
          });
        }
      }

      // Ajusta vista al polígono (padding para que respire)
      // usar outer ring para bounds
      const outer = closedRings[0];
      const bounds = outer.reduce((b, [lngP, latP]) => b.extend([lngP, latP]), new mapboxgl.LngLatBounds(outer[0], outer[0]));
      map.fitBounds(bounds, { padding: 28, duration: 600 });
    };

    map.on("style.load", onStyle);

    // Guarda ref y cleanup
    mapRef.current = map;
    return () => {
      map.off("style.load", onStyle);
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return <div ref={mapContainerRef} className="w-full h-[360px]" />;
}
