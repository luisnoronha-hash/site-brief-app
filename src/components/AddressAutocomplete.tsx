"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __lanaGoogleMapsLoading?: Promise<void>;
  }
}

// Rough bounding box for Florida, used to bias/restrict autocomplete suggestions.
const FLORIDA_BOUNDS = { north: 31.05, south: 24.4, west: -87.7, east: -79.8 };

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__lanaGoogleMapsLoading) return window.__lanaGoogleMapsLoading;

  window.__lanaGoogleMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return window.__lanaGoogleMapsLoading;
}

type Props = {
  value: string;
  onChange: (address: string, placeId: string | null) => void;
};

export function AddressAutocomplete({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let autocomplete: any;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!inputRef.current || !window.google) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "place_id"],
          componentRestrictions: { country: "us" },
          bounds: FLORIDA_BOUNDS,
          strictBounds: false,
          types: ["address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          onChange(place.formatted_address ?? inputRef.current!.value, place.place_id ?? null);
        });
        setReady(true);
      })
      .catch(() => setReady(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <div>
      <input
        ref={inputRef}
        required
        className="input-field"
        placeholder="123 Main St, Miami, FL"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value, null)}
      />
      {!apiKey && (
        <p className="mt-1 text-xs text-graystone">
          Address autocomplete is unavailable — enter the full property address manually.
        </p>
      )}
      {apiKey && !ready && <p className="mt-1 text-xs text-graystone">Loading address suggestions…</p>}
    </div>
  );
}
