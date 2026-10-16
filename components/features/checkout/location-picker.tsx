"use client";

import { useState, useRef } from "react";
import { LocateFixed, CheckCircle2, AlertCircle, Move } from "@/components/ui/icons";
import { LeafletMap } from "@/components/ui/leaflet-map";
import { useLanguage } from "@/lib/i18n";

export interface DetectedLocation {
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  detected: DetectedLocation | null;
  onLocationDetected: (location: DetectedLocation) => void;
  onManualOverride: () => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=pk`,
      { headers: { Accept: "application/json" } }
    );
    const data = await res.json();
    return data?.display_name || `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/**
 * Auto-detects location via GPS + free reverse geocoding, then — critically — lets the
 * person DRAG THE PIN to correct it before confirming. Raw device geolocation is often off
 * by tens to hundreds of meters (worse on laptops/desktops without GPS hardware); no amount
 * of code fixes that, but a drag-to-confirm step is exactly how Careem/Foodpanda-style apps
 * solve it in practice, and costs nothing extra to add.
 */
export function LocationPicker({ detected, onLocationDetected, onManualOverride }: LocationPickerProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [reGeocoding, setReGeocoding] = useState(false);
  const dragSeq = useRef(0); // guards against an older reverse-geocode response overwriting a newer drag

  function handleLocate() {
    setErrorMsg("");
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      setErrorMsg(t("location_error"));
      return;
    }

    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await reverseGeocode(latitude, longitude);
        onLocationDetected({ address, lat: latitude, lng: longitude });
        setStatus("idle");
      },
      () => {
        setStatus("error");
        setErrorMsg(t("location_error"));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  async function handlePinDrag(pos: { lat: number; lng: number }) {
    if (!detected) return;
    const seq = ++dragSeq.current;
    // Update the pin position immediately (map already shows it where dropped); the
    // address text catches up a moment later once reverse geocoding responds.
    onLocationDetected({ ...detected, lat: pos.lat, lng: pos.lng });
    setReGeocoding(true);
    const address = await reverseGeocode(pos.lat, pos.lng);
    if (seq === dragSeq.current) {
      onLocationDetected({ address, lat: pos.lat, lng: pos.lng });
      setReGeocoding(false);
    }
  }

  if (detected) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-light)]/20 p-3">
        <div className="flex items-start gap-2 text-xs font-bold text-[var(--color-accent)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("location_detected")}</span>
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <LeafletMap
            center={{ lat: detected.lat, lng: detected.lng }}
            markers={[{ lat: detected.lat, lng: detected.lng, label: "Delivery location" }]}
            height={200}
            zoom={16}
            interactive
            draggableFirstMarker
            onFirstMarkerDrag={handlePinDrag}
          />
        </div>
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
          <Move className="h-3 w-3 shrink-0" />
          {t("drag_pin_hint")}
        </p>
        <p className="text-xs font-medium leading-snug text-[var(--color-text-primary)]">
          {reGeocoding ? t("detecting_location") : detected.address}
        </p>
        <button
          type="button"
          onClick={onManualOverride}
          className="text-xs font-semibold text-[var(--color-text-secondary)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[var(--color-accent)]"
        >
          {t("not_your_location")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLocate}
        disabled={status === "locating"}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-accent)]/50 bg-[var(--color-accent-light)]/30 px-4 py-3 text-sm font-bold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-light)]/60 disabled:opacity-60 sm:w-auto"
      >
        {status === "locating" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("detecting_location")}
          </>
        ) : (
          <>
            <LocateFixed className="h-4 w-4" />
            {t("use_current_location")}
          </>
        )}
      </button>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[var(--color-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}
    </div>
  );
}
