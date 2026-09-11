import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker, { LocationResult } from '@/components/LocationPicker';
import { validateImageFile, compressImage } from '@/lib/image-compression';

const ReportIssueDialog = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'pollution' | 'poaching' | 'other'>('pollution');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    try {
      const r = await compressImage(file, 'default');
      setPhoto(r.file);
      setPreview(URL.createObjectURL(r.file));
    } catch (e: any) {
      toast.error(e?.message || 'Impossibile elaborare questa immagine.');
    }
  };

  const reset = () => {
    setType('pollution');
    setDescription('');
    setLocation(null);
    setPhoto(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!user || !location || !description.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        const { uploadToR2 } = await import('@/lib/r2');
        imageUrl = await uploadToR2(photo, 'reports');
      }
      const { error } = await supabase.from('reports').insert({
        user_id: user.id,
        type,
        description: description.trim(),
        latitude: location.lat,
        longitude: location.lng,
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success(t('map.reportSent'));
      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || t('map.reportError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          className="shadow-xl rounded-full"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          {t('map.reportIssue')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {t('map.reportTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('map.reportType')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pollution">{t('map.reportPollution')}</SelectItem>
                <SelectItem value="poaching">{t('map.reportPoaching')}</SelectItem>
                <SelectItem value="other">{t('map.reportOther')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('map.position')}</Label>
            <LocationPicker
              value={location}
              onChange={setLocation}
              showMapPreview
              placeholder={t('map.searchPlace')}
            />
            <p className="text-xs text-muted-foreground">{t('map.reportLocationHelp')}</p>
          </div>

          <div className="space-y-1">
            <Label>{t('map.reportDescription')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('map.reportDescPlaceholder')}
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <Label>{t('map.reportPhoto')}</Label>
            <div className="flex gap-2 flex-wrap">
              {preview && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setPhoto(null); setPreview(null); }}
                    className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {!preview && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors bg-muted"
                >
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            variant="destructive"
            disabled={submitting || !location || !description.trim()}
          >
            {submitting ? t('map.reportSending') : t('map.reportSubmit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;
