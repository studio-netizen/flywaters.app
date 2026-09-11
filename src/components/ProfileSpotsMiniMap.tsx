import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';

interface Props { userId: string }

const SPOT_COLORS: Record<string, string> = {
  lake: '#3b82f6', river: '#06b6d4', sea: '#1e40af', stream: '#14b8a6',
};

const ProfileSpotsMiniMap = ({ userId }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    supabase
      .from('spots')
      .select('id,name,spot_type,latitude,longitude')
      .eq('created_by', userId)
      .then(({ data }) => {
        if (!mounted) return;
        setSpots(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    if (loading || !containerRef.current || mapRef.current || spots.length === 0) return;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    const group = L.featureGroup();
    spots.forEach(s => {
      const color = SPOT_COLORS[s.spot_type] || '#3b82f6';
      const icon = L.divIcon({
        className: 'mini-marker',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      const m = L.marker([s.latitude, s.longitude], { icon });
      m.on('click', () => navigate(`/spot/${s.id}`));
      m.bindTooltip(s.name);
      m.addTo(group);
    });
    group.addTo(map);
    map.fitBounds(group.getBounds().pad(0.3));
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [loading, spots, navigate]);

  if (loading) {
    return <div className="w-full h-40 rounded-xl bg-muted animate-pulse" />;
  }
  if (spots.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <MapPin className="w-3.5 h-3.5" /> {t('profile.userSpots')} · {spots.length}
      </div>
      <div ref={containerRef} className="w-full h-40 rounded-xl overflow-hidden border border-border" />
    </div>
  );
};

export default ProfileSpotsMiniMap;
