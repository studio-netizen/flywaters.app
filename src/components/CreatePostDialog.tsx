import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ImagePlus, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import { validateImageFile, compressImage, formatFileSize } from '@/lib/image-compression';
import TagChipSelector from '@/components/TagChipSelector';
import { FISH_SPECIES, FISHING_TECHNIQUES, FISHING_GEAR } from '@/lib/fishing-constants';
import { logAudit } from '@/lib/audit';
import { uploadToR2 } from '@/lib/r2';

interface Props {
  onPostCreated: () => void;
}

const CreatePostDialog = ({ onPostCreated }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [selectedGear, setSelectedGear] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) { toast.error(error); return; }
    setCompressing(true);
    setProgress(15);
    setProgressLabel('Ottimizzazione foto...');
    try {
      const result = await compressImage(file, 'default');
      setImageFile(result.file);
      setImagePreview(URL.createObjectURL(result.file));
      setSizeInfo({ before: result.originalSize, after: result.compressedSize });
      setProgress(100);
    } catch (err: any) {
      toast.error(err?.message || 'Impossibile elaborare questa immagine.');
    } finally {
      setCompressing(false);
      setTimeout(() => { setProgress(0); setProgressLabel(''); }, 600);
    }
  };

  const handleSubmit = async () => {
    if (!user || !imageFile) return;

    // Snapshot form data and close dialog immediately for background upload
    const snapshot = {
      file: imageFile,
      caption,
      location,
      species: selectedSpecies,
      techniques: selectedTechniques,
      gear: selectedGear,
    };

    setOpen(false);
    setCaption('');
    setLocation(null);
    setSelectedSpecies([]);
    setSelectedTechniques([]);
    setSelectedGear([]);
    setImageFile(null);
    setImagePreview(null);
    setSizeInfo(null);

    const uploadPromise = (async () => {
      const publicUrl = await uploadToR2(snapshot.file, 'posts', {
        onProgress: () => {},
      });
      const { data: inserted, error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: snapshot.caption || null,
        location_tag: snapshot.location?.name || null,
        fish_species: snapshot.species.length > 0 ? snapshot.species : null,
        fishing_technique: snapshot.techniques.length > 0 ? snapshot.techniques : null,
        gear_used: snapshot.gear.length > 0 ? snapshot.gear : null,
      }).select('id').single();
      if (error) throw error;
      logAudit('post.created', 'post', inserted?.id);
      onPostCreated();
    })();

    toast.promise(uploadPromise, {
      loading: 'Caricamento post in corso...',
      success: 'Post pubblicato!',
      error: 'Errore nel caricamento. Riprova.',
    });
  };


  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Condividi la tua cattura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Anteprima" className="w-full h-full object-cover" />
            ) : (
          compressing ? (
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImagePlus className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tocca per aggiungere una foto</p>
              </div>
            )
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFileChange} className="hidden" />

          {(progress > 0 || progressLabel) && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progressLabel}</span>
                {sizeInfo && (
                  <span className="tabular-nums">
                    {formatFileSize(sizeInfo.before)} → {formatFileSize(sizeInfo.after)}
                  </span>
                )}
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Didascalia</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Descrivi la tua cattura..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Località</Label>
            <LocationPicker value={location} onChange={setLocation} placeholder="Cerca località..." />
          </div>

          <TagChipSelector label="Specie ittica" options={FISH_SPECIES} selected={selectedSpecies} onChange={setSelectedSpecies} />
          <TagChipSelector label="Tecnica di pesca" options={FISHING_TECHNIQUES} selected={selectedTechniques} onChange={setSelectedTechniques} />
          <TagChipSelector label="Attrezzatura utilizzata" options={FISHING_GEAR} selected={selectedGear} onChange={setSelectedGear} />

          <Button onClick={handleSubmit} className="w-full" disabled={loading || !imageFile}>
            {loading ? 'Caricamento...' : 'Pubblica'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
