"use client";

import { useEffect, useRef } from "react";
import type * as LeafletTypes from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarkerSpec {
  lat: number;
  lng: number;
  label?: string;
  /** "accent" (restaurant / brand) or "default" (customer pin) — controls marker color. */
  variant?: "default" | "accent";
}

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarkerSpec[];
  /** Draws a dashed line between the first two markers — used to visualize delivery distance. */
  drawLineBetweenFirstTwo?: boolean;
  height?: number | string;
  className?: string;
  /** false = static preview (no pan/zoom/scroll-to-zoom), true = fully interactive picker map. */
  interactive?: boolean;
  /** Makes the FIRST marker draggable — used for the "adjust your exact location" step. */
  draggableFirstMarker?: boolean;
  /** Fires with the new lat/lng whenever the draggable first marker is dropped. */
  onFirstMarkerDrag?: (pos: { lat: number; lng: number }) => void;
}

// Loaded once per page — Leaflet's default marker icon paths break under bundlers, so we
// point them at the CDN instead of trying to resolve local bundled assets.
let iconsPatched = false;
function patchDefaultIcon(L: typeof LeafletTypes) {
  if (iconsPatched) return;
  iconsPatched = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export function LeafletMap({
  center,
  zoom = 15,
  markers = [],
  drawLineBetweenFirstTwo = false,
  height = 220,
  className = "",
  interactive = true,
  draggableFirstMarker = false,
  onFirstMarkerDrag,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const markersKey = JSON.stringify(markers);
  // Keep the latest callback in a ref so the map-init effect doesn't need it as a dependency
  // (an inline arrow function would otherwise recreate the whole map on every render).
  const onDragRef = useRef(onFirstMarkerDrag);
  useEffect(() => {
    onDragRef.current = onFirstMarkerDrag;
  }, [onFirstMarkerDrag]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      patchDefaultIcon(L);

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        scrollWheelZoom: interactive,
        dragging: interactive,
        zoomControl: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(map);

      const accentIcon = L.divIcon({
        className: "",
        html: `<div style="background:#2B4231;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const latLngs: [number, number][] = [];
      markers.forEach((m, i) => {
        const isDraggableFirst = i === 0 && draggableFirstMarker;
        const marker =
          m.variant === "accent"
            ? L.marker([m.lat, m.lng], { icon: accentIcon, draggable: isDraggableFirst })
            : L.marker([m.lat, m.lng], { draggable: isDraggableFirst });
        marker.addTo(map);
        if (m.label) marker.bindPopup(m.label);
        if (isDraggableFirst) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onDragRef.current?.({ lat: pos.lat, lng: pos.lng });
          });
        }
        latLngs.push([m.lat, m.lng]);
      });

      if (drawLineBetweenFirstTwo && latLngs.length >= 2) {
        L.polyline(latLngs.slice(0, 2), { color: "#2B4231", weight: 2, dashArray: "6 8", opacity: 0.7 }).addTo(map);
      }

      if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32] });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, markersKey, drawLineBetweenFirstTwo, interactive, draggableFirstMarker]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%", borderRadius: "inherit" }}
    />
  );
}
