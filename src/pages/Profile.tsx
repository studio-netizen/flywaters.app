import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import GuideAvatar, { GoldenFlyInline } from '@/components/GuideAvatar';
import { Button } from '@/components/ui/button';
import { Grid3X3, MapPin, Pencil, Star, ArrowLeft, LogOut, Heart, MessageCircle, Camera, Plus, Sparkles, Instagram, Globe, Bookmark, UserPlus } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import FollowersModal from '@/components/FollowersModal';
import { useTranslation } from 'react-i18next';
import { fetchUserBadges, type UserBadges as UserBadgesType } from '@/lib/badges';
import UserBadges from '@/components/UserBadges';
import ProfileSpotsMiniMap from '@/components/ProfileSpotsMiniMap';
import { sanitizeHttpUrl } from '@/lib/sanitize-url';
import InviteShareDialog from '@/components/InviteShareDialog';

const Profile = () => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userId = paramUserId || user?.id;

  useEffect(() => {
    if (!paramUserId && !user) {
      navigate('/auth', { replace: true });
    }
  }, [paramUserId, user, navigate]);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'spots' | 'saved'>('posts');
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [badges, setBadges] = useState<UserBadgesType | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const isOwnProfile = user?.id === userId;
  const { t } = useTranslation();

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      fetchStats();
      fetchReviews();
      fetchUserBadges(userId).then(setBadges);
      if (user && !isOwnProfile) checkFollowing();
      if (user && isOwnProfile) fetchSavedPosts();
    }
  }, [userId, user]);

  const fetchSavedPosts = async () => {
    if (!user) return;
    const { data: rows } = await supabase
      .from('saved_posts')
      .select('post_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!rows?.length) { setSavedPosts([]); return; }
    const ids = rows.map((r: any) => r.post_id);
    const { data: ps } = await supabase
      .from('posts')
      .select('id, image_url, like_count, comment_count')
      .in('id', ids);
    if (ps) {
      const map = new Map(ps.map((p: any) => [p.id, p]));
      setSavedPosts(ids.map((id) => map.get(id)).filter(Boolean));
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileNotFound(false);
    try {
      const { data, error } = await supabase.from('profiles').select('id, user_id, username, display_name, avatar_url, bio, fishing_types, instagram_url, website_url, is_guide, guide_status, created_at').eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      if (!data) {
        setProfileNotFound(true);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('[Profile] fetchProfile error:', err);
      setProfileNotFound(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('id, user_id, caption, image_url, spot_id, fish_species, fishing_technique, gear_used, location_tag, hatch_activity, like_count, comment_count, created_at').eq('user_id', userId!).order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, spots(name, spot_type)')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
  };

  const fetchStats = async () => {
    const [postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId!),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId!),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId!),
    ]);
    setStats({
      posts: postsRes.count || 0,
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    });
  };

  const checkFollowing = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId!).maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId!);
      setIsFollowing(false);
      setStats(s => ({ ...s, followers: s.followers - 1 }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId! });
      setIsFollowing(true);
      setStats(s => ({ ...s, followers: s.followers + 1 }));
    }
  };

  // Profile not found — show message + logout option instead of infinite skeleton
  if (profileNotFound) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Profilo non trovato</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Il profilo richiesto non esiste o non è più disponibile.
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Button onClick={() => navigate('/')} variant="default">
              Torna al feed
            </Button>
            {isOwnProfile && (
              <Button onClick={signOut} variant="outline" className="gap-2">
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </Button>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (profileLoading || !profile) {

    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center gap-6 py-5">
            <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 flex items-center gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center flex-1 space-y-1.5">
                  <div className="h-5 w-8 mx-auto bg-muted rounded animate-pulse" />
                  <div className="h-3 w-14 mx-auto bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 pb-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-[2px] pb-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title={`${profile?.display_name || profile?.username || t('nav.profile')} | Flywaters`} description={`${profile?.display_name || profile?.username || ''}`} />
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-foreground p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{profile.username || 'pescatore'}</h1>
          <div className="flex items-center gap-1">
            {isOwnProfile && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile/edit')}>
                <Pencil className="w-5 h-5" />
              </Button>
            )}
            {isOwnProfile && (
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Avatar + name + bio (centered, Instagram-like hierarchy) */}
        <div className="flex flex-col items-center text-center pt-6 pb-4">
          <GuideAvatar
            src={profile.avatar_url}
            alt={`Profilo di ${profile.username || profile.display_name || 'utente'} su Flywaters`}
            fallback={profile.display_name || 'U'}
            isGuide={!!profile.is_guide}
            size="2xl"
          />
          <h2 className="mt-3 text-lg font-semibold text-foreground flex items-center gap-1.5">
            {profile.display_name || profile.username}
            {profile.is_guide && <GoldenFlyInline size={16} />}
          </h2>
          {profile.username && profile.display_name && (
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="mt-2 text-sm text-foreground max-w-xs leading-snug whitespace-pre-line">
              {profile.bio}
            </p>
          )}
          {profile.fishing_types && profile.fishing_types.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap justify-center">
              {profile.fishing_types.map((ft: string) => (
                <Badge key={ft} variant={ft === 'fly-fishing' ? 'default' : 'secondary'} className="text-xs">
                  {t(`common.fishingTypes.${ft}` as any) || ft}
                </Badge>
              ))}
            </div>
          )}
          {badges && (badges.explorer || badges.sentinel) && (
            <div className="mt-2"><UserBadges badges={badges} /></div>
          )}
          {(() => {
            const safeInstagram = sanitizeHttpUrl(profile.instagram_url);
            const safeWebsite = sanitizeHttpUrl(profile.website_url);
            if (!safeInstagram && !safeWebsite) return null;
            return (
              <div className="flex gap-3 mt-2 justify-center">
                {safeInstagram && (
                  <a href={safeInstagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {safeWebsite && (
                  <a href={safeWebsite} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Website">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          })()}
        </div>

        {/* Prominent counter cards (visual hierarchy) */}
        <div className="grid grid-cols-3 gap-2 pb-4">
          <StatCard value={stats.posts} label={t('profile.posts')} />
          <StatCard value={stats.followers} label={t('profile.followers')} onClick={() => setModalType('followers')} />
          <StatCard value={stats.following} label={t('profile.following')} onClick={() => setModalType('following')} />
        </div>

        <div className="flex flex-col gap-2 pb-4 items-center">
          {isOwnProfile ? (
            <>
              <Button
                variant="outline"
                className="h-9 text-sm font-semibold rounded-full w-auto"
                style={{ padding: '10px 32px', borderRadius: 9999 }}
                onClick={() => navigate('/profile/edit')}
              >
                {t('profile.editProfile')}
              </Button>
              <Button
                variant="ghost"
                className="h-9 text-sm font-semibold rounded-full w-auto gap-1.5 text-[#242242]"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="w-4 h-4" /> Invita un amico
              </Button>
            </>
          ) : user ? (
            <div className="flex gap-2 w-full justify-center">
              <Button variant={isFollowing ? 'outline' : 'default'} className="flex-1 h-9 text-sm font-semibold" onClick={toggleFollow}>
                {isFollowing ? t('feed.followingBtn') : t('feed.follow')}
              </Button>
              <Button variant="outline" className="flex-1 h-9 text-sm font-semibold" onClick={() => navigate(`/messages/${userId}`)}>
                {t('profile.message')}
              </Button>
            </div>
          ) : null}
        </div>

        {userId && (
          <div className="pb-4">
            <ProfileSpotsMiniMap userId={userId} />
          </div>
        )}

        <div className="border-t border-border flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'posts' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4" /> Post
          </button>
          <button
            onClick={() => setActiveTab('spots')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === 'spots' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted-foreground'
            }`}
          >
            <Star className="w-4 h-4" /> {t('profile.reviewedSpots')}
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs uppercase tracking-wide border-b-2 transition-colors ${
                activeTab === 'saved' ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted-foreground'
              }`}
            >
              <Bookmark className="w-4 h-4" /> Salvati
            </button>
          )}
        </div>

        {activeTab === 'posts' ? (
          <div className="grid grid-cols-3 gap-[2px] pb-4">
            {posts.map(post => (
              <button
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="ig-grid-cell relative aspect-square bg-muted overflow-hidden group focus:outline-none"
                aria-label={`Apri post di ${profile.username || 'pescatore'}`}
              >
                <img
                  src={post.image_url}
                  alt={`Foto di pesca a mosca condivisa da ${profile.username || 'pescatore'} su Flywaters`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="ig-grid-overlay text-white">
                  <span className="flex items-center gap-1.5 font-semibold text-sm">
                    <Heart className="w-5 h-5 fill-white" />
                    {post.like_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-sm">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    {post.comment_count ?? 0}
                  </span>
                </div>
              </button>
            ))}
            {posts.length === 0 && (
              <div className="col-span-3 py-10 px-4">
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {isOwnProfile ? t('profile.emptyPostsTitleOwn') : t('profile.emptyPostsTitleOther')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
                    {isOwnProfile ? t('profile.emptyPostsDescOwn') : t('profile.emptyPostsDescOther')}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/publish')} size="sm" className="rounded-full gap-1.5">
                      <Plus className="w-4 h-4" />
                      {t('profile.shareFirstCatch')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'spots' ? (
          <div className="space-y-3 py-4">
            {reviews.map(r => (
              <div key={r.id} className="flex items-start gap-3 px-1">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{r.spots?.name || 'Spot'}</p>
                  <p className="text-xs text-muted-foreground">{r.spots?.spot_type}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  {r.content && <p className="text-sm text-foreground mt-1">{r.content}</p>}
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="py-10 px-4">
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {isOwnProfile ? t('profile.emptyReviewsTitleOwn') : t('profile.emptyReviewsTitleOther')}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto leading-relaxed">
                    {isOwnProfile ? t('profile.emptyReviewsDescOwn') : t('profile.emptyReviewsDescOther')}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/mappa')} size="sm" variant="outline" className="rounded-full gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {t('profile.exploreSpots')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-[2px] pb-4">
            {savedPosts.map(post => (
              <button
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="ig-grid-cell relative aspect-square bg-muted overflow-hidden group focus:outline-none"
                aria-label="Apri post salvato"
              >
                <img
                  src={post.image_url}
                  alt="Post salvato"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="ig-grid-overlay text-white">
                  <span className="flex items-center gap-1.5 font-semibold text-sm">
                    <Heart className="w-5 h-5 fill-white" />
                    {post.like_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-sm">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    {post.comment_count ?? 0}
                  </span>
                </div>
              </button>
            ))}
            {savedPosts.length === 0 && (
              <div className="col-span-3 py-10 px-4">
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Bookmark className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Nessun post salvato ancora</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Salva i post che ti ispirano!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isOwnProfile && profile?.username && (
        <InviteShareDialog open={inviteOpen} onOpenChange={setInviteOpen} username={profile.username} />
      )}

      {modalType && userId && (
        <FollowersModal open={!!modalType} onClose={() => setModalType(null)} userId={userId} type={modalType} />
      )}
    </AppLayout>
  );
};

const StatCard = ({ value, label, onClick }: { value: number; label: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`rounded-xl bg-muted/40 border border-border/50 px-3 py-3 text-center transition-all duration-200 ${
      onClick ? 'hover:bg-muted hover:shadow-sm cursor-pointer' : 'cursor-default'
    }`}
  >
    <p className="text-2xl font-bold text-foreground leading-tight tabular-nums">{value}</p>
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
  </button>
);

export default Profile;
