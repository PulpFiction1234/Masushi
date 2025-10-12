/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as turf from "@turf/turf";
import mapboxgl from "mapbox-gl";
import addressOverrides from "@/data/addressOverrides";

interface AddressSearchProps {
  polygonCoords: number[][];
  onValidAddress: (address: string, coords: [number, number]) => void;
}

const AddressSearch: React.FC<AddressSearchProps> = ({ polygonCoords, onValidAddress }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // 🔒 Evita fetch inmediatamente después de seleccionar una sugerencia
  const suppressNextFetchRef = useRef(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [polygonCoords[0][0], polygonCoords[0][1]] as [number, number],
      zoom: 13,
    });

    map.on("load", () => {
      const polygonFeature = turf.polygon([[...polygonCoords, polygonCoords[0]]]);
      map.addSource("delivery-zone", {
        type: "geojson",
        data: { type: "FeatureCollection" as const, features: [polygonFeature] },
      });
      map.addLayer({
        id: "delivery-zone-fill",
        type: "fill",
        source: "delivery-zone",
        paint: { "fill-color": "#22c55e", "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: "delivery-zone-outline",
        type: "line",
        source: "delivery-zone",
        paint: { "line-color": "#22c55e", "line-width": 2 },
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, [MAPBOX_TOKEN, polygonCoords]);

  const fetchSuggestions = useCallback(
    async (value: string) => {
      if (value.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      // Check local overrides first (flexible normalize + substring match)
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/[\.,#\-]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const normQuery = normalize(value);
      let matchedKey: string | undefined;
      for (const key of Object.keys(addressOverrides)) {
        const normKey = normalize(key);
        if (normQuery.includes(normKey) || normKey.includes(normQuery)) {
          matchedKey = key;
          break;
        }
      }
      if (matchedKey) {
        const ov = addressOverrides[matchedKey];
        const synthetic = {
          id: `override-${matchedKey}`,
          place_name: ov.label || value,
          geometry: { coordinates: ov.coords, type: "Point" },
          properties: { source: "override" },
        };
        setSuggestions([synthetic]);
        return;
      }
      try {
        // If the user included a number in the query, prefer an exact (non-autocomplete) address lookup
        const hasNumber = /\d/.test(value);
        const centerProximity = polygonCoords && polygonCoords.length > 0
          ? `${polygonCoords[0][0]},${polygonCoords[0][1]}` // Mapbox expects proximity=lng,lat
          : undefined;

        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          country: "CL",
          limit: "5",
          types: "address",
          language: "es",
          autocomplete: hasNumber ? "false" : "true",
        });
        if (centerProximity) params.set("proximity", centerProximity);

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();
        // helpful debug when users report missing numbered addresses
        if (!Array.isArray(data.features) || data.features.length === 0) {
          // keep suggestions empty but surface debug info to console for development
          // eslint-disable-next-line no-console
          console.debug("Mapbox geocode empty result:", { query: value, url, data });
          setSuggestions([]);
          return;
        }
        setSuggestions(data.features || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.debug("Mapbox geocode error:", err);
        setSuggestions([]);
      }
    },
    [MAPBOX_TOKEN, polygonCoords]
  );

  // Debounce + respeto del flag de supresión
  useEffect(() => {
    const t = setTimeout(() => {
      // si venimos de un "select", no pedimos sugerencias
      if (suppressNextFetchRef.current) {
        suppressNextFetchRef.current = false; // consumimos el flag
        return;
      }
      void fetchSuggestions(query);
    }, 200);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  // Opcional: acortar "Calle 1234, Comuna"
  const toShortCLAddress = (full: string) => {
    const parts = full.split(",").map(s => s.trim()).filter(Boolean);
    return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : full.trim();
  };

  const handleSelect = (place: any) => {
    // ⚠️ Importante: marca que la próxima vez NO se busque automáticamente
    suppressNextFetchRef.current = true;

    // Si quieres guardar corto en el input:
    const short = toShortCLAddress(place.place_name);
    setQuery(short);
    setSuggestions([]);

    // Validaciones
    const rawCoords = place.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length < 2 || typeof rawCoords[0] !== "number" || typeof rawCoords[1] !== "number") {
      setStatus("⚠️ Dirección inválida");
      return;
    }
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
      onValidAddress(short, coords); // también pasamos la versión corta
    } else {
      setStatus("❌ Fuera de la zona de reparto (solo retiro en tienda)");
    }

    if (mapRef.current) {
      // zoom a 16 para ver mejor el punto en el recorte del polígono
      mapRef.current.flyTo({ center: coords, zoom: 16 });
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker().setLngLat(coords).addTo(mapRef.current);
    }
  };

  // (Opcional) cerrar dropdown al perder foco del input
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current) return;
      if (!inputRef.current.contains(target)) {
        // Si clickeas fuera del input y del dropdown, oculta
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const statusClass =
    status.startsWith("✅") ? "text-green-400"
    : status.startsWith("❌") ? "text-red-400"
    : status.startsWith("⚠️") ? "text-yellow-300"
    : "text-neutral-300";

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ingresa tu dirección (con número)"
        className="w-full rounded-xl border border-white/10 bg-neutral-800/90 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />

      {suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-neutral-900/95 text-neutral-100 shadow-xl backdrop-blur-sm"
          role="listbox"
        >
          {suggestions.map((sug) => (
                 <li
              key={sug.id}
              role="option"
              aria-selected={false}
              // onMouseDown evita que el blur del input cancele el click (mejor UX)
              onMouseDown={() => handleSelect(sug)}
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

