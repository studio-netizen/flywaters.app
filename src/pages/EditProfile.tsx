import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import SEOHead from '@/components/SEOHead';
import { validateImageFile, compressImage } from '@/lib/image-compression';
import { sanitizeHttpUrl } from '@/lib/sanitize-url';

const FISHING_TYPES = [
  { value: 'fly-fishing', label: '🎣 Pesca a mosca' },
  { value: 'spinning', label: '🔄 Spinning' },
  { value: 'baitcasting', label: '🎯 Baitcasting' },
  { value: 'surfcasting', label: '🌊 Surfcasting' },
  { value: 'ice-fishing', label: '🧊 Pesca sul ghiaccio' },
];

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fishingTypes, setFishingTypes] = useState<string[]>([]);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [compressingAvatar, setCompressingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (data) {
          setDisplayName(data.display_name || '');
          setUsername(data.username || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || '');
          setFishingTypes(data.fishing_types || []);
          setInstagramUrl((data as any).instagram_url || '');
          setWebsiteUrl((data as any).website_url || '');
        }
      } catch (err) {
        console.error('[EditProfile] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) { toast.error(validationError); return; }
    setCompressingAvatar(true);
    try {
      const result = await compressImage(file, 'avatar');
      setAvatarFile(result.file);
      setAvatarPreview(URL.createObjectURL(result.file));
    } catch (e: any) {
      toast.error(e?.message || 'Impossibile elaborare questa immagine.');
    } finally {
      setCompressingAvatar(false);
    }
  };

  const toggleFishingType = (type: string) => {
    setFishingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        const { uploadToR2 } = await import('@/lib/r2');
        const publicUrl = await uploadToR2(avatarFile, 'avatars', { path: 'avatar.webp' });
        newAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          avatar_url: newAvatarUrl,
          fishing_types: fishingTypes,
          instagram_url: sanitizeHttpUrl(instagramUrl),
          website_url: sanitizeHttpUrl(websiteUrl),
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('profile.profileUpdated'));
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
          <div className="w-full space-y-4">
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            <div className="h-20 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const currentAvatar = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${t('profile.editProfile')} | Flywaters`} description={t('seo.defaultDescription')} />
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{t('profile.back')}</span>
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t('profile.editProfile')}</h1>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? t('profile.saving') : t('profile.save')}
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {(displayName || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          {compressingAvatar ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento in corso...
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary font-medium"
            >
              {t('profile.changePhoto')}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">{t('profile.displayName')}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t('profile.yourName')}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
              placeholder="username"
              maxLength={30}
            />
          </div>

          <div>
            <Label htmlFor="bio">{t('profile.bio')}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 150))}
              placeholder={t('profile.bioPlaceholder')}
              maxLength={150}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">{t('profile.bioHelp')}</p>
              <p className={`text-xs tabular-nums ${
                bio.length >= 140 ? 'text-orange-500 font-semibold' : 'text-muted-foreground'
              }`}>
                {bio.length}/150
              </p>
            </div>
          </div>

          <div>
            <Label>{t('profile.fishingType')}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FISHING_TYPES.map(ft => (
                <button
                  key={ft.value}
                  onClick={() => toggleFishingType(ft.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    fishingTypes.includes(ft.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="instagram">{t('profile.instagram')}</Label>
            <Input
              id="instagram"
              type="url"
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/username"
            />
          </div>

          <div>
            <Label htmlFor="website">{t('profile.website')}</Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
