import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Plus, Filter, X, ImagePlus, Loader2, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BottomNav from '@/components/BottomNav';
import DesktopSidebar from '@/components/DesktopSidebar';
import { toast } from 'sonner';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import TagChipSelector from '@/components/TagChipSelector';
import { FISH_SPECIES, HATCH_ACTIVITIES } from '@/lib/fishing-constants';
import { validateImageFile, compressImage } from '@/lib/image-compression';
import MapAuthGate from '@/components/MapAuthGate';
import SpotDetailDrawer from '@/components/SpotDetailDrawer';
import MapLegend from '@/components/MapLegend';
import ReportIssueDialog from '@/components/ReportIssueDialog';
import { sanitizeHttpUrl } from '@/lib/sanitize-url';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SPOT_COLORS: Record<string, string> = {
  lake: '#3b82f6',
  river: '#06b6d4',
  sea: '#1e40af',
  stream: '#14b8a6',
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  lake: 'Lago',
  river: 'Fiume',
  sea: 'Mare',
  stream: 'Torrente',
};

const createSpotIcon = (type: string, rating: number) => {
  const color = SPOT_COLORS[type] || '#3b82f6';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${rating > 0 ? rating.toFixed(1) : '•'}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createReportIcon = () => L.divIcon({
  className: 'report-marker',
  html: `<div style="background:#dc2626;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(220,38,38,0.5);font-size:16px;font-weight:700;">!</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface ReportPin {
  id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
}

interface Spot {
  id: string;
  name: string;
  description: string | null;
  spot_type: string;
  latitude: number;
  longitude: number;
  fish_species: string[] | null;
  hatch_activity: string[] | null;
  photos: string[] | null;
  access_info: string | null;
  avg_rating: number;
  review_count: number;
}

const SpotMap = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const spotMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const reportMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const [spots, setSpots] = useState<Spot[]>([]);
  const [reports, setReports] = useState<ReportPin[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [spotType, setSpotType] = useState('river');
  const [spotDesc, setSpotDesc] = useState('');
  const [selectedSpotFish, setSelectedSpotFish] = useState<string[]>([]);
  const [selectedSpotHatch, setSelectedSpotHatch] = useState<string[]>([]);
  const [spotAccess, setSpotAccess] = useState('');
  const [spotLocation, setSpotLocation] = useState<LocationResult | null>(null);
  const [spotPhotos, setSpotPhotos] = useState<File[]>([]);
  const [spotPhotosPreviews, setSpotPhotosPreviews] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [filterHatch, setFilterHatch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [loading, setLoading] = useState(false);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const photosRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([41.9028, 12.4964], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Gated content: only authenticated users get spot coordinates
    if (user) {
      fetchSpots();
      fetchReports();
    } else {
      setSpots([]);
      setReports([]);
    }
  }, [user]);

  const fetchSpots = async () => {
    // Trimmed column list — avoid pulling oversized JSON/text fields not used on map
    const { data } = await supabase
      .from('spots')
      .select('id, name, description, spot_type, latitude, longitude, fish_species, hatch_activity, photos, access_info, avg_rating, review_count')
      .order('created_at', { ascending: false });
    if (data) setSpots(data as Spot[]);
  };

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, type, description, latitude, longitude, image_url')
      .eq('status', 'approved');
    if (data) setReports(data as ReportPin[]);
  };

  useEffect(() => {
    if (spotLocation && mapRef.current) {
      mapRef.current.setView([spotLocation.lat, spotLocation.lng], 13, { animate: true });
    }
  }, [spotLocation]);

  // Memoize filtered+sorted spots so identity is stable across unrelated re-renders
  const visibleSpots = useMemo(() => {
    let out = filterType && filterType !== 'all' ? spots.filter(s => s.spot_type === filterType) : spots;
    if (filterHatch && filterHatch !== 'all') {
      out = out.filter(s => s.hatch_activity?.includes(filterHatch));
    }
    if (sortBy === 'rating') {
      out = [...out].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    } else if (sortBy === 'reviews') {
      out = [...out].sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }
    return out;
  }, [spots, filterType, filterHatch, sortBy]);

  // Stable click handler so memoized children don't re-render
  const handleSpotClick = useCallback((spot: Spot) => {
    setActiveSpot(spot);
    setDrawerOpen(true);
  }, []);

  // Diff spot markers in place instead of clearing & recreating every render
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    const existing = spotMarkersRef.current;
    const nextIds = new Set(visibleSpots.map(s => s.id));

    // Remove markers that no longer pass the filter
    for (const [id, marker] of existing) {
      if (!nextIds.has(id)) {
        group.removeLayer(marker);
        existing.delete(id);
      }
    }

    // Add new / update position when needed
    visibleSpots.forEach(spot => {
      let marker = existing.get(spot.id);
      if (!marker) {
        marker = L.marker([spot.latitude, spot.longitude], {
          icon: createSpotIcon(spot.spot_type, spot.avg_rating),
        });
        marker.addTo(group);
        existing.set(spot.id, marker);
      } else {
        const ll = marker.getLatLng();
        if (ll.lat !== spot.latitude || ll.lng !== spot.longitude) {
          marker.setLatLng([spot.latitude, spot.longitude]);
        }
      }
      // Always rebind click to the freshest spot snapshot
      marker.off('click');
      marker.on('click', () => handleSpotClick(spot));
    });
  }, [visibleSpots, handleSpotClick]);

  // Diff report markers separately so spot updates don't touch them
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    const existing = reportMarkersRef.current;
    const nextIds = new Set(reports.map(r => r.id));

    for (const [id, marker] of existing) {
      if (!nextIds.has(id)) {
        group.removeLayer(marker);
        existing.delete(id);
      }
    }

    reports.forEach(rep => {
      if (existing.has(rep.id)) return;
      const marker = L.marker([rep.latitude, rep.longitude], { icon: createReportIcon() });
      const container = document.createElement('div');
      container.style.minWidth = '200px';
      container.style.fontFamily = 'inherit';

      const title = document.createElement('strong');
      title.style.color = '#dc2626';
      title.style.textTransform = 'uppercase';
      title.style.fontSize = '11px';
      title.textContent = rep.type;
      container.appendChild(title);

      const desc = document.createElement('p');
      desc.style.margin = '4px 0 0 0';
      desc.style.fontSize = '13px';
      desc.style.lineHeight = '1.4';
      desc.textContent = rep.description;
      container.appendChild(desc);

      const safeImg = sanitizeHttpUrl(rep.image_url);
      if (safeImg) {
        const img = document.createElement('img');
        img.src = safeImg;
        img.alt = 'report';
        img.style.marginTop = '6px';
        img.style.width = '100%';
        img.style.borderRadius = '6px';
        container.appendChild(img);
      }

      marker.bindPopup(container);

      marker.addTo(group);
      existing.set(rep.id, marker);
    });
  }, [reports]);

  const handleDrawerOpenChange = useCallback((open: boolean) => setDrawerOpen(open), []);

  const handlePhotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) { toast.error(`${file.name}: ${validationError}`); continue; }
      try {
        const result = await compressImage(file, 'default');
        setSpotPhotos(prev => [...prev, result.file]);
        setSpotPhotosPreviews(prev => [...prev, URL.createObjectURL(result.file)]);
      } catch (e: any) {
        toast.error(e?.message || 'Impossibile elaborare questa immagine.');
      }
    }
  };

  const removePhoto = (idx: number) => {
    setSpotPhotos(prev => prev.filter((_, i) => i !== idx));
    setSpotPhotosPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSpot = async () => {
    if (!user || !spotLocation || !spotName) return;
    setLoading(true);
    try {
      const { uploadToR2 } = await import('@/lib/r2');
      const photoUrls: string[] = [];
      for (const file of spotPhotos) {
        const publicUrl = await uploadToR2(file, 'spots');
        photoUrls.push(publicUrl);
      }

      const { data: inserted, error } = await supabase.from('spots').insert({
        created_by: user.id,
        name: spotName,
        description: spotDesc || null,
        spot_type: spotType,
        latitude: spotLocation.lat,
        longitude: spotLocation.lng,
        fish_species: selectedSpotFish.length > 0 ? selectedSpotFish : null,
        hatch_activity: selectedSpotHatch.length > 0 ? selectedSpotHatch : null,
        access_info: spotAccess || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
      }).select('id').single();
      if (error) throw error;
      const { logAudit } = await import('@/lib/audit');
      logAudit('spot.created', 'spot', inserted?.id, { spot_type: spotType });
      toast.success('Spot aggiunto!');
      setShowAddDialog(false);
      resetForm();
      fetchSpots();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSpotName('');
    setSpotDesc('');
    setSelectedSpotFish([]);
    setSelectedSpotHatch([]);
    setSpotAccess('');
    setSpotType('river');
    setSpotLocation(null);
    setSpotPhotos([]);
    setSpotPhotosPreviews([]);
  };

  return (
    <div className="h-screen flex">
      <SEOHead title="Mappa Spot | Flywaters" description="Esplora la mappa dei migliori spot di pesca a mosca in Italia." />
      <DesktopSidebar />
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2 flex-wrap">
          {user && (
            <>
              <Button
                onClick={() => { resetForm(); setShowAddDialog(true); }}
                size="sm"
                className="shadow-xl rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" /> Aggiungi spot
              </Button>
              <ReportIssueDialog />
            </>
          )}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger
              className="w-36 shadow-xl border-white/40 rounded-full"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue placeholder="Tutti i tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="lake">Lago</SelectItem>
              <SelectItem value="river">Fiume</SelectItem>
              <SelectItem value="sea">Mare</SelectItem>
              <SelectItem value="stream">Torrente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterHatch} onValueChange={setFilterHatch}>
            <SelectTrigger
              className="w-40 shadow-xl border-white/40 rounded-full"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue placeholder="Schiuse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le schiuse</SelectItem>
              {HATCH_ACTIVITIES.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger
              className="w-40 shadow-xl border-white/40 rounded-full"
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              <SelectValue placeholder={t('map.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('map.sortRecent')}</SelectItem>
              <SelectItem value="rating">{t('map.sortMostLiked')}</SelectItem>
              <SelectItem value="reviews">{t('map.sortMostReviewed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div ref={mapContainerRef} className="flex-1 z-0" />

        <MapLegend />
        <SpotDetailDrawer spot={activeSpot} open={drawerOpen} onOpenChange={handleDrawerOpenChange} />

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aggiungi nuovo spot di pesca</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Posizione</Label>
                <LocationPicker
                  value={spotLocation}
                  onChange={setSpotLocation}
                  showMapPreview
                  placeholder="Cerca località, fiume, lago..."
                />
              </div>

              <div className="space-y-1">
                <Label>Nome dello spot</Label>
                <Input value={spotName} onChange={e => setSpotName(e.target.value)} placeholder="Nome dello spot" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={spotType} onValueChange={setSpotType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lake">Lago</SelectItem>
                    <SelectItem value="river">Fiume</SelectItem>
                    <SelectItem value="sea">Mare</SelectItem>
                    <SelectItem value="stream">Torrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Descrizione</Label>
                <Textarea value={spotDesc} onChange={e => setSpotDesc(e.target.value)} placeholder="Descrivi lo spot..." rows={2} />
              </div>

              <TagChipSelector label="Specie presenti" options={FISH_SPECIES} selected={selectedSpotFish} onChange={setSelectedSpotFish} />
              <TagChipSelector label="Schiuse / Hatch attive" options={HATCH_ACTIVITIES} selected={selectedSpotHatch} onChange={setSelectedSpotHatch} />

              <div className="space-y-1">
                <Label>Informazioni di accesso</Label>
                <Textarea value={spotAccess} onChange={e => setSpotAccess(e.target.value)} placeholder="Come raggiungere lo spot, parcheggio, permessi..." rows={2} />
              </div>

              <div className="space-y-1">
                <Label>Foto (opzionale)</Label>
                <div className="flex gap-2 flex-wrap">
                  {spotPhotosPreviews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => photosRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors bg-muted"
                  >
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
                <input ref={photosRef} type="file" accept="image/*" multiple onChange={handlePhotosChange} className="hidden" />
              </div>

              <Button onClick={handleCreateSpot} className="w-full" disabled={loading || !spotName || !spotLocation}>
                {loading ? 'Salvataggio...' : 'Aggiungi spot'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
      {!user && <MapAuthGate />}
    </div>
  );
};

export default SpotMap;
