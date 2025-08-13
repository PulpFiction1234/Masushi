/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
import * as turf from "@turf/turf";
import mapboxgl from "mapbox-gl";

interface AddressSearchProps {
  polygonCoords: number[][]; // Coordenadas del polígono
  onValidAddress: (address: string, coords: [number, number]) => void;
}

const AddressSearch: React.FC<AddressSearchProps> = ({
  polygonCoords,
  onValidAddress,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      // Tema oscuro para que se vea bien con tu página
      style: "mapbox://styles/mapbox/dark-v11",
      center: [polygonCoords[0][0], polygonCoords[0][1]] as [number, number],
      zoom: 13,
    });

    map.on("load", () => {
      const polygonFeature = turf.polygon([[...polygonCoords, polygonCoords[0]]]);

      map.addSource("delivery-zone", {
        type: "geojson",
        data: {
          type: "FeatureCollection" as const,
          features: [polygonFeature],
        },
      });

      map.addLayer({
        id: "delivery-zone-fill",
        type: "fill",
        source: "delivery-zone",
        paint: {
          "fill-color": "#22c55e", // verde suave
          "fill-opacity": 0.18,
        },
      });

      map.addLayer({
        id: "delivery-zone-outline",
        type: "line",
        source: "delivery-zone",
        paint: {
          "line-color": "#22c55e",
          "line-width": 2,
        },
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, [MAPBOX_TOKEN, polygonCoords]);

  // Pequeño debounce para no spamear la API
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchSuggestions(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  async function fetchSuggestions(value: string) {
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&country=CL`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch {
      setSuggestions([]);
    }
  }

  const handleSelect = (place: any) => {
    setQuery(place.place_name);
    setSuggestions([]);

    // Validar que coordinates sea exactamente [number, number]
    const rawCoords = place.geometry?.coordinates;
    if (
      !Array.isArray(rawCoords) ||
      rawCoords.length < 2 ||
      typeof rawCoords[0] !== "number" ||
      typeof rawCoords[1] !== "number"
    ) {
      setStatus("⚠️ Dirección inválida");
      return;
    }

    // Solo válido si hay un número después de la calle, antes de la coma
    const regexNumeroCalle = /\s\d{1,5}(?:\s|,|$)/;
    if (!regexNumeroCalle.test(place.place_name)) {
      setStatus("⚠️ Debe ingresar número de domicilio junto a la calle");
      return;
    }

    const coords: [number, number] = [rawCoords[0], rawCoords[1]];
    const point = turf.point(coords);
    const polygon = turf.polygon([[...polygonCoords, polygonCoords[0]]]);
    const isInside = turf.booleanPointInPolygon(point, polygon);

    if (isInside) {
      setStatus("✅ Dentro de la zona de reparto");
      onValidAddress(place.place_name, coords);
    } else {
      setStatus("❌ Fuera de la zona de reparto (solo retiro en tienda)");
    }

    if (mapRef.current) {
      mapRef.current.flyTo({ center: coords, zoom: 15 });
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker().setLngLat(coords).addTo(mapRef.current);
    }
  };

  // Estilo de estado
  const statusClass =
    status.startsWith("✅")
      ? "text-green-400"
      : status.startsWith("❌")
      ? "text-red-400"
      : status.startsWith("⚠️")
      ? "text-yellow-300"
      : "text-neutral-300";

  return (
    <div className="relative">
      {/* INPUT oscuro */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ingresa tu dirección (con número)"
        className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />

      {/* SUGERENCIAS oscuras (dropdown absoluto) */}
      {suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-neutral-900/95 text-neutral-100 shadow-xl backdrop-blur-sm"
          role="listbox"
        >
          {suggestions.map((sug) => (
            <li
              key={sug.id}
              role="option"
              onClick={() => handleSelect(sug)}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-white/10"
            >
              {sug.place_name}
            </li>
          ))}
        </ul>
      )}

      {status && <p className={`mt-2 text-sm ${statusClass}`}>{status}</p>}

      <div
        ref={mapContainerRef}
        className="mt-4"
        style={{ width: "100%", height: "400px", borderRadius: "12px", overflow: "hidden" }}
      />
    </div>
  );
};

export default AddressSearch;
