// src/components/AddressSearch.tsx
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
      style: "mapbox://styles/mapbox/streets-v11",
      center: [polygonCoords[0][0], polygonCoords[0][1]] as [number, number],
      zoom: 13,
    });

    map.on("load", () => {
      const polygonFeature = turf.polygon([
        [...polygonCoords, polygonCoords[0]],
      ]);

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
          "fill-color": "#0080ff",
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "delivery-zone-outline",
        type: "line",
        source: "delivery-zone",
        paint: {
          "line-color": "#0070cc",
          "line-width": 2,
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [MAPBOX_TOKEN, polygonCoords]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 3) return;

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        value
      )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&country=CL`
    );
    const data = await res.json();
    setSuggestions(data.features || []);
  };

  const handleSelect = (place: any) => {
    setQuery(place.place_name);
    setSuggestions([]);

    const coords: [number, number] = place.geometry.coordinates;
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

      if (markerRef.current) {
        markerRef.current.remove();
      }

      markerRef.current = new mapboxgl.Marker()
        .setLngLat(coords)
        .addTo(mapRef.current);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Ingresa tu dirección"
        className="border p-2 w-full"
      />
      {suggestions.length > 0 && (
        <ul className="border bg-white">
          {suggestions.map((sug) => (
            <li
              key={sug.id}
              onClick={() => handleSelect(sug)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {sug.place_name}
            </li>
          ))}
        </ul>
      )}
      {status && <p className="mt-2">{status}</p>}

      <div
        ref={mapContainerRef}
        className="mt-4"
        style={{ width: "100%", height: "400px", borderRadius: "8px" }}
      />
    </div>
  );
};

export default AddressSearch;
