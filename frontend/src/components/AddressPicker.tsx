import { useState } from "react";

interface Suggestion {
  place_name: string;
  center: [number, number];
}

export function AddressPicker({
  address, onAddressChange, lat, lng, onLocationChange,
}: {
  address: string;
  onAddressChange: (v: string) => void;
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  async function handleInput(value: string) {
    onAddressChange(value);
    if (value.length < 3 || !token) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&country=NG&limit=5`
    );
    const data = await res.json();
    setSuggestions(data.features || []);
  }

  function selectSuggestion(s: Suggestion) {
    onAddressChange(s.place_name);
    onLocationChange(s.center[1], s.center[0]);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-2">Address (optional)</label>
      <input
        className="w-full border-2 border-charcoal p-3 bg-paper focus:outline-none focus:ring-2 focus:ring-gold"
        placeholder="Start typing your address..."
        value={address}
        onChange={(e) => handleInput(e.target.value)}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-paper border-2 border-charcoal border-t-0 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => selectSuggestion(s)} className="p-2 text-sm hover:bg-gold/30 cursor-pointer">
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
      {lat && lng && (
        <img
          src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+BE3D2A(${lng},${lat})/${lng},${lat},14,0/500x200@2x?access_token=${token}`}
          alt="Map preview"
          className="mt-3 border-2 border-charcoal w-full"
        />
      )}
    </div>
  );
}