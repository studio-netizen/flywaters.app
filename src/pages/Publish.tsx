import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImagePlus, ArrowLeft, MapPin, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import { validateImageFile, compressImage } from '@/lib/image-compression';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import TagChipSelector from '@/components/TagChipSelector';
import { FISH_SPECIES, FISHING_TECHNIQUES, FISHING_GEAR, HATCH_ACTIVITIES } from '@/lib/fishing-constants';
import { logAudit } from '@/lib/audit';
import { uploadToR2 } from '@/lib/r2';


const Publish = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);


  const [caption, setCaption] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [selectedGear, setSelectedGear] = useState<string[]>([]);
  const [selectedHatch, setSelectedHatch] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) { toast.error(error); return; }
    setCompressing(true);
    try {
      const result = await compressImage(file, 'default');
      setImageFile(result.file);
      setImagePreview(URL.createObjectURL(result.file));
    } catch (err: any) {
      toast.error(err?.message || 'Impossibile elaborare questa immagine.');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !imageFile) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      const publicUrl = await uploadToR2(imageFile, 'posts', {
        onProgress: (pct) => setUploadProgress(pct),
      });

      const { data: inserted, error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption || null,
        location_tag: location?.name || null,
        fish_species: selectedSpecies.length > 0 ? selectedSpecies : null,
        fishing_technique: selectedTechniques.length > 0 ? selectedTechniques : null,
        gear_used: selectedGear.length > 0 ? selectedGear : null,
        hatch_activity: selectedHatch.length > 0 ? selectedHatch : null,
      }).select('id').single();

      if (error) throw error;
      logAudit('post.created', 'post', inserted?.id, { has_location: !!location });
      toast.success('Post pubblicato!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };


  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Accedi per pubblicare</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Nuovo post | Flywaters" description="Pubblica una nuova cattura o uno spot su Flywaters." />
      <header className="sticky top-0 z-40 safe-top bg-background border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground p-2 -ml-2 rounded-full active:bg-muted transition-colors" aria-label="Indietro">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">Nuovo post</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] space-y-5">
        <div
          onClick={() => !loading && fileRef.current?.click()}
          className="relative aspect-[4/5] rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted"
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Anteprima" className="w-full h-full object-cover" />
              {loading && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white gap-2">
                  <div className="text-3xl font-bold tabular-nums">{uploadProgress}%</div>
                  <div className="w-2/3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs opacity-80">{t('upload.uploading')}...</p>
                </div>
              )}
            </>
          ) : compressing ? (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">{t('upload.processing')}</p>
            </div>
          ) : (
            <div className="text-center">
              <ImagePlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Tocca per aggiungere una foto</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileChange} className="hidden" />


        <div>
          <Label className="text-sm font-medium">Posizione</Label>
          {location ? (
            <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-primary/10 rounded-full w-fit">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground">{location.name}</span>
              <button onClick={() => setLocation(null)}>
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : showLocationPicker ? (
            <div className="mt-1.5">
              <LocationPicker value={location} onChange={(loc) => { setLocation(loc); if (loc) setShowLocationPicker(false); }} placeholder="Cerca località..." />
              <button onClick={() => setShowLocationPicker(false)} className="text-xs text-muted-foreground mt-1 hover:underline">
                Annulla
              </button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-1.5 gap-2" onClick={() => setShowLocationPicker(true)}>
              <MapPin className="w-4 h-4" /> Aggiungi posizione
            </Button>
          )}
        </div>

        <div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Scrivi una didascalia..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{caption.length}/300</p>
        </div>

        <TagChipSelector label="Specie ittica" options={FISH_SPECIES} selected={selectedSpecies} onChange={setSelectedSpecies} />
        <TagChipSelector label="Tecnica di pesca" options={FISHING_TECHNIQUES} selected={selectedTechniques} onChange={setSelectedTechniques} />
        <TagChipSelector label="Attrezzatura utilizzata" options={FISHING_GEAR} selected={selectedGear} onChange={setSelectedGear} />
        <TagChipSelector label="Schiuse / Hatch attive" options={HATCH_ACTIVITIES} selected={selectedHatch} onChange={setSelectedHatch} />

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Pubblico</p>
            <p className="text-xs text-muted-foreground">{isPublic ? 'Visibile a tutti' : 'Solo follower'}</p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>
      </div>

      {/* Sticky bottom publish bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <Button
            size="lg"
            onClick={() => { if ('vibrate' in navigator) navigator.vibrate?.(10); handleSubmit(); }}
            disabled={loading || !imageFile}
            className="w-full min-h-12 rounded-full text-base font-semibold"
          >
            {loading ? `${t('upload.uploading')}... ${uploadProgress}%` : 'Pubblica'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Publish;

