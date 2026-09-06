import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";

type MapInstance = { flyTo: (options: unknown) => void; getZoom: () => number; on: (event: string, listener: (event: { lngLat: { lat: number; lng: number } }) => void) => void; remove: () => void; };
type MarkerInstance = { setLngLat: (point: [number, number]) => MarkerInstance; addTo: (map: MapInstance) => MarkerInstance; };
type MapLibreApi = { Map: new (options: unknown) => MapInstance; Marker: new (options?: unknown) => MarkerInstance; };

declare global { interface Window { maplibregl?: MapLibreApi; } }

let mapLibreLoader: Promise<MapLibreApi> | null = null;
function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (mapLibreLoader) return mapLibreLoader;
  mapLibreLoader = new Promise((resolve, reject) => {
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css"; document.head.appendChild(css);
    const script = document.createElement("script"); script.src = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"; script.async = true;
    script.onload = () => window.maplibregl ? resolve(window.maplibregl) : reject(new Error("MapLibre did not load"));
    script.onerror = () => reject(new Error("MapLibre could not load")); document.head.appendChild(script);
  });
  return mapLibreLoader;
}

export function AddressPicker({ address, onAddressChange, lat, lng, onLocationChange }: {
  address: string;
  onAddressChange: (value: string) => void;
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const [mapError, setMapError] = useState("");
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const marker = useRef<MarkerInstance | null>(null);

  function setPin(nextLat: number, nextLng: number) {
    onLocationChange(nextLat, nextLng);
    if (!map.current || !window.maplibregl) return;
    const point: [number, number] = [nextLng, nextLat];
    if (!marker.current) marker.current = new window.maplibregl.Marker({ color: "#BE3D2A" }).setLngLat(point).addTo(map.current);
    else marker.current.setLngLat(point);
    map.current.flyTo({ center: point, zoom: Math.max(map.current.getZoom(), 14), essential: true });
  }

  useEffect(() => {
    if (!mapNode.current || map.current) return;
    let active = true;
    let instance: MapInstance | null = null;
    loadMapLibre().then((mapLibre) => {
      if (!active || !mapNode.current) return;
      const point: [number, number] = lng !== null && lat !== null ? [lng, lat] : [8.6753, 9.082];
      instance = new mapLibre.Map({ container: mapNode.current, style: "https://tiles.openfreemap.org/styles/liberty", center: point, zoom: lng !== null && lat !== null ? 14 : 5.2 });
      map.current = instance;
      if (lng !== null && lat !== null) marker.current = new mapLibre.Marker({ color: "#BE3D2A" }).setLngLat(point).addTo(instance);
      instance.on("click", (event) => setPin(event.lngLat.lat, event.lngLat.lng));
    }).catch(() => setMapError("The map could not load. Please refresh and try again."));
    return () => { active = false; instance?.remove(); map.current = null; marker.current = null; };
  // The map is created once; later pin changes are handled by setPin.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return setMapError("Location services are not supported by this browser.");
    setMapError("");
    navigator.geolocation.getCurrentPosition(
      (position) => setPin(position.coords.latitude, position.coords.longitude),
      () => setMapError("We could not access your location. Allow location access or place the pin manually."),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return <div>
    <div className="flex items-center justify-between gap-3 mb-2"><label className="block text-sm font-medium">Address & map pin (optional)</label><button type="button" onClick={useMyLocation} className="text-xs font-medium text-signal inline-flex items-center gap-1 hover:text-ink"><Crosshair className="w-3.5 h-3.5" />Use my location</button></div>
    <input className="w-full border-2 border-charcoal p-3 bg-paper focus:outline-none focus:ring-2 focus:ring-gold" placeholder="Enter your address or landmark" value={address} onChange={(event) => onAddressChange(event.target.value)} />
    <div ref={mapNode} className="mt-3 h-56 w-full overflow-hidden rounded-xl border-2 border-charcoal" />
    <p className="text-xs text-ink/40 mt-2 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Use your location or tap the map to place your store pin.</p>
    {mapError && <p className="mt-2 text-xs text-signal">{mapError}</p>}
  </div>;
}
