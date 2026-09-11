import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, MapPin, Image as ImageIcon, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateImageFile, compressImage } from '@/lib/image-compression';
import L from 'leaflet';
import { useEffect } from 'react';
import ConsentGate from '@/components/ConsentGate';

const FISHING_TAGS = [
  'Mosca Secca', 'Ninfa', 'Emerger', 'Streamer', 'Tenkara',
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [fishingTypes, setFishingTypes] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  useEffect(() => {
    if (step === 1 && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([42.5, 12.5], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map);
      mapRef.current = map;
      return () => {
        map.remove();
        mapRef.current = null;
      };
    }
  }, [step]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) { toast.error(validationError); return; }
    try {
      const result = await compressImage(file, 'avatar');
      setAvatarFile(result.file);
      setAvatarPreview(URL.createObjectURL(result.file));
    } catch (e: any) {
      toast.error(e?.message || 'Impossibile elaborare questa immagine.');
    }
  };

  const toggleTag = (tag: string) => {
    setFishingTypes(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalizzazione non supportata dal browser');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      toast.error('La geolocalizzazione richiede una connessione sicura (HTTPS)');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapRef.current) {
          mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 10, { animate: true });
          L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(mapRef.current);
        }
        toast.success('Posizione rilevata');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Consenti l\'accesso alla posizione nelle impostazioni del browser per usare questa funzione');
        } else {
          toast.error('Impossibile ottenere la posizione');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = '';
      if (avatarFile) {
        const { uploadToR2 } = await import('@/lib/r2');
        const publicUrl = await uploadToR2(avatarFile, 'avatars', { path: 'avatar.webp' });
        avatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      const updates: Record<string, any> = {
        onboarding_completed: true,
      };
      if (username.trim()) updates.username = username.trim().toLowerCase();
      if (bio.trim()) updates.bio = bio.trim();
      if (fishingTypes.length > 0) updates.fishing_types = fishingTypes;
      if (avatarUrl) updates.avatar_url = avatarUrl;

      await supabase.from('profiles').update(updates).eq('user_id', user.id);
      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <ConsentGate />
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-colors"
            style={{ backgroundColor: i === step ? '#242242' : '#242242' + '30' }}
          />
        ))}
      </div>

      {/* Skip button */}
      {step < 2 && (
        <button
          onClick={skip}
          className="absolute top-8 right-6 text-sm text-[#8c8c7a] hover:text-[#242242] transition-colors"
        >
          Salta
        </button>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-md mx-auto py-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2">
                  Ciao {firstName}! Completa il tuo profilo 🎣
                </h1>
                <p className="text-sm text-[#8c8c7a]">Fatti conoscere dalla community</p>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview} alt="Foto profilo" />
                    <AvatarFallback className="bg-[#242242]/10 text-[#242242] text-2xl">
                      {firstName[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[#242242] text-[#f5f0e8] rounded-full p-1.5"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-sm text-[#4a7c59] font-medium"
                >
                  Aggiungi foto
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Username *</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                  placeholder="il_tuo_username"
                  maxLength={30}
                  className="bg-white border-[#242242]/15"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Bio (opzionale)</label>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Racconta di te in poche parole..."
                  maxLength={160}
                  rows={2}
                  className="bg-white border-[#242242]/15 resize-none"
                />
                <p className="text-xs text-[#8c8c7a] mt-1">{bio.length}/160</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Che tipo di pesca pratichi? (almeno 1)</label>
                <div className="flex flex-wrap gap-2">
                  {FISHING_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        fishingTypes.includes(tag)
                          ? 'bg-[#242242] text-[#f5f0e8] border-[#242242]'
                          : 'bg-white text-[#242242] border-[#242242]/15 hover:border-[#242242]/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(1)}
                disabled={!username.trim() || fishingTypes.length === 0}
                className="w-full h-12 rounded-full text-sm font-semibold bg-[#242242] text-[#f5f0e8] hover:opacity-90"
              >
                Continua →
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2">
                  Scopri gli spot vicino a te 🗺️
                </h1>
                <p className="text-sm text-[#8c8c7a]">Attiva la geolocalizzazione per trovare gli spot nella tua zona</p>
              </div>

              <div
                ref={mapContainerRef}
                className="w-full h-[300px] rounded-xl overflow-hidden border border-[#242242]/10"
              />

              <Button
                onClick={handleGeolocation}
                variant="outline"
                className="w-full h-12 rounded-full gap-2 border-[#242242]/20"
              >
                <MapPin className="w-4 h-4" />
                Attiva la posizione
              </Button>

              <button
                onClick={() => setStep(2)}
                className="block text-center w-full text-sm text-[#8c8c7a] hover:text-[#242242] transition-colors"
              >
                Salta per ora
              </button>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-full text-sm font-semibold bg-[#242242] text-[#f5f0e8] hover:opacity-90"
              >
                Continua →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 text-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-serif mb-2">
                  Sei pronto! Benvenuto nella community 🎉
                </h1>
                <p className="text-sm text-[#8c8c7a]">Ecco 3 cose che puoi fare subito</p>
              </div>

              <div className="space-y-4 text-left">
                {[
                  { icon: Camera, emoji: '📸', text: 'Pubblica la tua prima foto di pesca' },
                  { icon: MapPin, emoji: '🗺️', text: 'Aggiungi uno spot che conosci' },
                  { icon: MessageCircle, emoji: '💬', text: 'Segui altri pescatori a mosca' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#242242]/10">
                    <span className="text-2xl">{tip.emoji}</span>
                    <p className="text-sm font-medium">{tip.text}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleComplete}
                disabled={saving}
                className="w-full h-12 rounded-full text-sm font-semibold bg-[#242242] text-[#f5f0e8] hover:opacity-90"
              >
                {saving ? 'Salvataggio...' : 'Inizia ad esplorare →'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
