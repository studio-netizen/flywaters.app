import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LocationResult | null;
  onChange: (location: LocationResult | null) => void;
  showMapPreview?: boolean;
  placeholder?: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  // Nominatim fallback carries coords directly to skip a details call
  _nominatim?: { lat: number; lng: number };
}

const LocationPicker = ({ value, onChange, showMapPreview = false, placeholder = "Cerca località..." }: LocationPickerProps) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const mapPreviewRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!showMapPreview || !value || !mapPreviewRef.current) return;
    if (miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
    }
    const map = L.map(mapPreviewRef.current, {
      zoomControl: false, attributionControl: false, dragging: false,
      scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false,
    }).setView([value.lat, value.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([value.lat, value.lng]).addTo(map);
    miniMapRef.current = map;
    return () => { if (miniMapRef.current) { miniMapRef.current.remove(); miniMapRef.current = null; } };
  }, [value, showMapPreview]);

  const searchNominatim = async (input: string): Promise<Prediction[]> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&accept-language=it&q=${encodeURIComponent(input)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : []).map((r: any) => {
        const parts = (r.display_name || '').split(',').map((s: string) => s.trim());
        const main = parts[0] || r.display_name;
        const secondary = parts.slice(1).join(', ');
        return {
          place_id: `nom_${r.place_id}`,
          description: r.display_name,
          structured_formatting: { main_text: main, secondary_text: secondary },
          _nominatim: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
        } as Prediction;
      });
    } catch {
      return [];
    }
  };

  const searchPlaces = async (input: string) => {
    if (input.length < 2) { setPredictions([]); return; }
    setSearching(true);
    try {
      let results: Prediction[] = [];
      try {
        const { data, error } = await supabase.functions.invoke('google-places', {
          body: { action: 'autocomplete', input },
        });
        if (!error && data?.predictions?.length) {
          results = data.predictions;
        }
      } catch {
        // fall through to Nominatim
      }
      if (results.length === 0) {
        results = await searchNominatim(input);
      }
      setPredictions(results);
      setShowDropdown(true);
    } finally { setSearching(false); }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(val), 300);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const selectPlace = async (prediction: Prediction) => {
    setShowDropdown(false);
    // Nominatim results already carry coordinates — no details call needed
    if (prediction._nominatim) {
      onChange({
        name: prediction.structured_formatting.main_text,
        address: prediction.description,
        lat: prediction._nominatim.lat,
        lng: prediction._nominatim.lng,
      });
      setQuery('');
      setPredictions([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { action: 'details', placeId: prediction.place_id },
      });
      if (!error && data?.result) {
        onChange({
          name: data.result.name || prediction.structured_formatting.main_text,
          address: data.result.formatted_address || prediction.description,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        });
        setQuery('');
        setPredictions([]);
      } else {
        toast.error('Impossibile recuperare i dettagli della località');
      }
    } catch {
      toast.error('Errore nel recupero della località');
    } finally { setSearching(false); }
  };

  const useGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non supportata dal browser');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('La geolocalizzazione richiede una connessione sicura (HTTPS)');
      return;
    }
    setGpsLoading(true);
    setShowDropdown(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { data, error } = await supabase.functions.invoke('google-places', {
            body: { action: 'reverse_geocode', lat: latitude, lng: longitude },
          });
          if (!error && data?.results?.[0]) {
            const result = data.results[0];
            onChange({
              name: result.formatted_address,
              address: result.formatted_address,
              lat: latitude,
              lng: longitude,
            });
          } else {
            onChange({
              name: 'Posizione attuale',
              address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
              lat: latitude,
              lng: longitude,
            });
          }
          toast.success('Posizione rilevata');
        } catch {
          onChange({
            name: 'Posizione attuale',
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            lat: latitude,
            lng: longitude,
          });
        } finally { setGpsLoading(false); }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Consenti l\'accesso alla posizione nelle impostazioni del browser per usare questa funzione');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error('Posizione non disponibile. Verifica GPS o connessione');
        } else if (err.code === err.TIMEOUT) {
          toast.error('Tempo scaduto nel rilevare la posizione. Riprova');
        } else {
          toast.error('Impossibile ottenere la posizione');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{value.name}</p>
            <p className="text-xs text-muted-foreground truncate">{value.address}</p>
          </div>
          <button onClick={() => onChange(null)} className="shrink-0">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        {showMapPreview && (
          <div ref={mapPreviewRef} className="h-32 rounded-lg overflow-hidden border border-border" />
        )}
      </div>
    );
  }

  const showGpsOption = query.length < 2;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">📍</span>
        <Input
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pl-9 pr-10"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-lg mt-1 shadow-lg z-50 max-h-56 overflow-y-auto">
          {/* GPS option */}
          <button
            onClick={useGPS}
            disabled={gpsLoading}
            className="w-full text-left px-3 py-2.5 hover:bg-muted text-sm flex items-center gap-2 border-b border-border"
          >
            {gpsLoading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            ) : (
              <Navigation className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className="font-medium text-primary">Usa posizione attuale</span>
          </button>

          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => selectPlace(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-muted text-sm flex items-start gap-2 border-b border-border last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{p.structured_formatting.main_text}</p>
                <p className="text-xs text-muted-foreground truncate">{p.structured_formatting.secondary_text}</p>
              </div>
            </button>
          ))}

          {query.length >= 2 && predictions.length === 0 && !searching && (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center">
              Nessun risultato trovato
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
