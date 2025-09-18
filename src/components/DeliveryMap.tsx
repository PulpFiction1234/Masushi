// src/components/DeliveryMap.tsx
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { deliveryZone } from "../data/deliveryZone";

const zone: LatLngExpression[] = deliveryZone;

export default function DeliveryMap() {
  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>
      <MapContainer
        center={zone[0]}
        zoom={13}
        style={{ height: "500px", width: "100%", zIndex: 0 }} // **obligatorio** para verse
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Polygon positions={zone} pathOptions={{ color: "red" }} />
      </MapContainer>
    </div>
  );
}
