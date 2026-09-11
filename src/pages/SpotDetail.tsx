import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Star, MapPin, Fish, Info, Send, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

const SPOT_TYPE_LABELS: Record<string, string> = {
  lake: 'Lago',
  river: 'Fiume',
  sea: 'Mare',
  stream: 'Torrente',
};

interface Spot {
  id: string;
  name: string;
  description: string | null;
  spot_type: string;
  latitude: number;
  longitude: number;
  fish_species: string[] | null;
  access_info: string | null;
  photos: string[] | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  content: string | null;
  photo_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const StarRating = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [hover, setHover] = useState(0);
  const px = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
        >
          <Star
            className={`${px} ${
              star <= (hover || value)
                ? 'fill-[#d4a017] text-[#d4a017]'
                : 'text-[#242242]/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const SpotDetail = () => {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const shareUrl = spot ? `https://flywaters.app/spot/${spotId}` : '';
  const shareText = spot ? `Check out this fly fishing spot: ${spot.name} on Flywaters` : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: spot?.name, text: shareText, url: shareUrl });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copiato!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  useEffect(() => {
    if (spotId) {
      fetchSpot();
      fetchReviews();
    }
  }, [spotId]);

  const fetchSpot = async () => {
    const { data } = await supabase
      .from('spots')
      .select('id, name, description, spot_type, latitude, longitude, fish_species, access_info, photos, avg_rating, review_count, created_by, created_at, hatch_activity')
      .eq('id', spotId!)
      .single();
    if (data) setSpot(data as Spot);
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('id, spot_id, user_id, rating, content, photo_url, created_at')
      .eq('spot_id', spotId!)
      .order('created_at', { ascending: false });
    
    if (error || !reviewsData) {
      console.error('Error fetching reviews:', error);
      return;
    }

    // Fetch profiles for review authors
    const userIds = [...new Set(reviewsData.map((r) => r.user_id))];
    let profilesMap: Record<string, { username: string | null; display_name: string | null; avatar_url: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesData) {
        profilesData.forEach((p) => {
          profilesMap[p.user_id] = { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url };
        });
      }
    }

    const enrichedReviews: Review[] = reviewsData.map((r) => ({
      ...r,
      profiles: profilesMap[r.user_id] || null,
    }));

    setReviews(enrichedReviews);
    if (user) {
      setHasReviewed(reviewsData.some((r) => r.user_id === user.id));
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !spotId || rating === 0) {
      toast.error('Seleziona una valutazione');
      return;
    }
    setSubmitting(true);
    try {
      const { data: insertedData, error } = await supabase.from('reviews').insert({
        user_id: user.id,
        spot_id: spotId,
        rating,
        content: reviewText || null,
      }).select('*, profiles:user_id(username, display_name, avatar_url)').single();
      if (error) throw error;
      
      // Optimistic UI: add review to top of list immediately
      if (insertedData) {
        setReviews(prev => [insertedData as unknown as Review, ...prev]);
        const { logAudit } = await import('@/lib/audit');
        logAudit('review.created', 'review', (insertedData as any).id, { spot_id: spotId, rating });
      }
      setHasReviewed(true);
      toast.success('Recensione pubblicata!');
      setRating(0);
      setReviewText('');
      fetchSpot(); // refresh avg rating
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="max-w-3xl mx-auto px-4 pt-16 space-y-4">
          <div className="h-6 w-48 bg-[#242242]/10 rounded animate-pulse" />
          <div className="h-3 w-24 bg-[#242242]/10 rounded animate-pulse" />
          <div className="aspect-[4/3] bg-[#242242]/10 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-[#242242]/10 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-[#242242]/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
        <p className="text-lg">Spot non trovato</p>
        <Button variant="outline" onClick={() => navigate('/mappa')}>Torna alla mappa</Button>
      </div>
    );
  }

  const photos = spot.photos?.filter(Boolean) || [];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead
        title={`${spot.name} | Flywaters`}
        description={spot.description || `Scopri lo spot di pesca a mosca ${spot.name} su Flywaters: recensioni, specie ittiche e accesso.`}
        canonical={`https://flywaters.app/spot/${spot.id}`}
        ogImage={photos[0] || undefined}
        ogType="place"
      />

      <header className="sticky top-0 z-40 border-b border-[#242242]/10 px-4 py-3" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/mappa')} className="hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold font-serif truncate">{spot.name}</h1>
            <p className="text-xs tracking-wide uppercase text-[#8c8c7a]">{SPOT_TYPE_LABELS[spot.spot_type] || spot.spot_type}</p>
          </div>
          {spot.avg_rating > 0 && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-[#d4a017] text-[#d4a017]" />
              <span className="text-sm font-semibold">{Number(spot.avg_rating).toFixed(1)}</span>
              <span className="text-xs text-[#8c8c7a]">({spot.review_count})</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto">

        {photos.length > 0 && (
          <div className="px-4 pt-6">
            <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {photos.map((url, i) => (
                <button key={i} onClick={() => setSelectedPhoto(url)} className="overflow-hidden">
                  <img src={url} alt={`Foto dello spot ${spot.name} su Flywaters`} className="w-full aspect-[4/3] object-cover hover:opacity-90 transition-opacity" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-8 space-y-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-2">Posizione</p>
            <p className="text-sm text-[#8c8c7a] flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {spot.latitude.toFixed(4)}°N, {spot.longitude.toFixed(4)}°E
            </p>
          </div>

          {spot.description && (
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-2">Descrizione</p>
              <p className="text-sm leading-relaxed">{spot.description}</p>
            </div>
          )}

          {spot.fish_species && spot.fish_species.length > 0 && (
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-2">Specie ittiche</p>
              <div className="flex flex-wrap gap-2">
                {spot.fish_species.map((f) => (
                  <span key={f} className="text-xs px-3 py-1 border border-[#242242]/15 text-[#242242]">{f}</span>
                ))}
              </div>
            </div>
          )}

          {spot.access_info && (
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-2">Accesso</p>
              <p className="text-sm leading-relaxed text-[#8c8c7a] flex items-start gap-1.5">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                {spot.access_info}
              </p>
            </div>
          )}
        </div>

        {/* Share section */}
        <div className="px-4 py-6">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3">Condividi questo spot</p>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#242242] text-[#f5f0e8] rounded-full hover:opacity-85 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              Condividi
            </button>
            <button
              onClick={shareToWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-[#242242]/15 rounded-full hover:border-[#242242]/30 transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={shareToFacebook}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-[#242242]/15 rounded-full hover:border-[#242242]/30 transition-colors"
            >
              Facebook
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-[#242242]/15 rounded-full hover:border-[#242242]/30 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#4a7c59]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mx-4 border-t border-[#242242]/10" />

        {user && !hasReviewed && (
          <div className="px-4 py-8">
            <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">Scrivi una recensione</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">La tua valutazione</p>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Condividi la tua esperienza in questo spot..."
                rows={3}
                className="bg-transparent border-[#242242]/15 rounded-none resize-none focus-visible:ring-[#4a7c59] placeholder:text-[#8c8c7a]/60"
              />
              <button
                onClick={handleSubmitReview}
                disabled={submitting || rating === 0}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm tracking-wide uppercase font-medium bg-[#242242] text-[#f5f0e8] hover:bg-[#242242]/85 transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Invio in corso...' : 'Invia recensione'}
              </button>
            </div>
          </div>
        )}

        {user && hasReviewed && (
          <div className="px-4 py-8">
            <p className="text-sm text-[#8c8c7a] italic">Hai già recensito questo spot.</p>
          </div>
        )}

        {!user && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#8c8c7a] mb-3">Accedi per lasciare una recensione</p>
            <button
              onClick={() => navigate('/auth')}
              className="text-sm font-medium text-[#242242] hover:text-[#4a7c59] transition-colors"
            >
              Accedi →
            </button>
          </div>
        )}

        <div className="mx-4 border-t border-[#242242]/10" />

        <div className="px-4 py-8">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-6">
            Recensioni {reviews.length > 0 && `(${reviews.length})`}
          </p>

          {reviews.length === 0 ? (
            <p className="text-sm text-[#8c8c7a]">Nessuna recensione ancora. Sii il primo a condividere la tua esperienza.</p>
          ) : (
            <div className="divide-y divide-[#242242]/10">
              {reviews.map((review) => (
                <div key={review.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.profiles?.avatar_url || ''} alt={`Profilo di ${review.profiles?.username || review.profiles?.display_name || 'pescatore'} su Flywaters`} />
                      <AvatarFallback className="bg-[#242242]/10 text-[#242242] text-sm">
                        {(review.profiles?.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {review.profiles?.display_name || review.profiles?.username || 'Pescatore'}
                      </p>
                      <p className="text-xs text-[#8c8c7a]">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="pl-[52px]">
                    <StarRating value={review.rating} readonly size="sm" />
                    {review.content && (
                      <p className="text-sm leading-relaxed text-[#8c8c7a] mt-2">{review.content}</p>
                    )}
                    {review.photo_url && (
                      <img src={review.photo_url} alt="Foto della recensione" className="mt-2 w-48 aspect-[4/3] object-cover" loading="lazy" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="Dimensione originale" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default SpotDetail;
