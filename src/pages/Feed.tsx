import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
const Landing = lazy(() => import('./Landing'));
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Share2, MapPin, Send, Search, Bookmark, BookmarkCheck } from 'lucide-react';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import PostActionsMenu from '@/components/PostActionsMenu';
import PostComments from '@/components/PostComments';
import logoImg from '@/assets/flywaters-logo-dark.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import GuideAvatar from '@/components/GuideAvatar';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import EmptyState from '@/components/EmptyState';
import WelcomeBanner from '@/components/WelcomeBanner';
import ZoomableImage from '@/components/ZoomableImage';

import { toast } from 'sonner';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTranslation } from 'react-i18next';
import OnboardingWizard from '@/components/OnboardingWizard';
import { getOptimizedImageUrl, getImageSrcSet } from '@/lib/image-url';
import { formatTimeIt } from '@/lib/format-time';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { hapticLight, hapticSuccess } from '@/lib/haptic';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location_tag: string | null;
  fish_species: string[] | null;
  fishing_technique: string[] | null;
  gear_used: string[] | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface SuggestedUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_guide?: boolean | null;
  post_count: number;
}

const PAGE_SIZE = 10;

const Feed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [feedMode, setFeedMode] = useState<'forYou' | 'following'>('forYou');
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const unreadMessages = useUnreadMessages();
  const { t } = useTranslation();
  const { saved, toggleSave } = useSavedPosts();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchFollowedUsers();
    fetchLikedPosts();
    fetchSuggestedUsers();
    supabase.from('profiles').select('onboarding_completed').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data && !data.onboarding_completed) setShowOnboarding(true);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setPosts([]);
    setHasMore(true);
    fetchPosts(0, true);
  }, [user, feedMode, followedUsers]);

  const fetchPosts = async (offset: number, replace = false) => {
    if (replace) { setLoading(true); setLoadError(false); } else setLoadingMore(true);

    if (feedMode === 'following' && followedUsers.size === 0) {
      setPosts([]); setHasMore(false); setLoading(false); setLoadingMore(false);
      return;
    }

    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_profiles_fkey(username, display_name, avatar_url, is_guide)')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (feedMode === 'following') {
      query = query.in('user_id', Array.from(followedUsers));
    }

    // Timeout guard: never leave the user staring at an endless skeleton.
    const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 8000)
    );

    const { data, error } = await Promise.race([
      query as unknown as Promise<{ data: unknown; error: { message: string } | null }>,
      timeout,
    ]);

    if (!error && data) {
      const batch = data as unknown as Post[];
      setPosts(prev => replace ? batch : [...prev, ...batch]);
      setHasMore(batch.length === PAGE_SIZE);
    } else if (error) {
      console.error('[Feed] errore caricamento post:', error);
      setHasMore(false);
      if (replace) setLoadError(true);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPosts(posts.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, hasMore, posts.length, feedMode, followedUsers]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '300px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    hapticSuccess();
    setPosts([]);
    setHasMore(true);
    await fetchPosts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMode, followedUsers, user]);

  const ptr = usePullToRefresh<HTMLDivElement>({ onRefresh: handleRefresh, disabled: !user });





  const fetchLikedPosts = async () => {
    if (!user) return;
    const { data } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (data) setLikedPosts(new Set(data.map(l => l.post_id)));
  };

  const fetchFollowedUsers = async () => {
    if (!user) return;
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (data) setFollowedUsers(new Set(data.map(f => f.following_id)));
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url, is_guide')
      .neq('user_id', user.id)
      .limit(10);

    if (!profiles) return;

    // Single batched query instead of N+1 counts (was firing 10 round-trips per Feed load)
    const ids = profiles.map(p => p.user_id);
    const { data: postRows } = await supabase
      .from('posts')
      .select('user_id')
      .in('user_id', ids);

    const counts = new Map<string, number>();
    (postRows || []).forEach(r => counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1));

    const suggestions: SuggestedUser[] = profiles.map(p => ({
      ...p,
      post_count: counts.get(p.user_id) || 0,
    }));
    suggestions.sort((a, b) => b.post_count - a.post_count);
    setSuggestedUsers(suggestions.slice(0, 5));
  };

  const toggleLike = async (postId: string, opts?: { forceLike?: boolean }) => {
    if (!user) return;
    const isLiked = likedPosts.has(postId);
    // If forceLike, only act when currently not liked (double-tap should never unlike).
    if (opts?.forceLike && isLiked) {
      hapticLight();
      return;
    }
    hapticLight();

    // Optimistic update
    setLikedPosts(prev => {
      const n = new Set(prev);
      if (isLiked) n.delete(postId); else n.add(postId);
      return n;
    });
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) } : p
    ));

    const { error } = isLiked
      ? await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId)
      : await supabase.from('likes').insert({ user_id: user.id, post_id: postId });

    if (error) {
      // Rollback
      setLikedPosts(prev => {
        const n = new Set(prev);
        if (isLiked) n.add(postId); else n.delete(postId);
        return n;
      });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, like_count: p.like_count + (isLiked ? 1 : -1) } : p
      ));
      toast.error('Errore. Riprova.');
    }
  };

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    hapticLight();
    if (followedUsers.has(targetId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowedUsers(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowedUsers(prev => new Set(prev).add(targetId));
    }
  };



  const handleShare = async (post: Post) => {
    const url = `https://flywaters.app/post/${post.id}`;
    const username = post.profiles?.username || 'Pescatore';
    if (navigator.share) {
      await navigator.share({
        title: `${username} su Flywaters`,
        text: post.caption || 'Guarda questa cattura su Flywaters!',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast(t('feed.linkCopied'));
    }
  };

  const formatTime = (date: string) => formatTimeIt(date);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!user) return <Suspense fallback={<div className="min-h-screen bg-background" />}><Landing /></Suspense>;

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />;
  }


  return (
    <AppLayout>
      <SEOHead title={`Feed | Flywaters`} description={t('seo.defaultDescription')} />
      <WelcomeBanner />

      {/* Pull-to-refresh indicator */}
      <div
        aria-hidden
        className="ptr-indicator"
        style={{
          height: Math.max(0, ptr.pull),
          opacity: ptr.pull > 4 ? 1 : 0,
        }}
      >
        <div
          className={`w-6 h-6 rounded-full border-2 border-[#242242] border-t-transparent ${ptr.refreshing ? 'animate-spin' : ''}`}
          style={{
            transform: ptr.refreshing ? 'none' : `rotate(${ptr.progress * 360}deg)`,
            transition: 'transform 80ms linear',
          }}
        />
      </div>
      <div
        ref={ptr.ref}
        style={{
          transform: `translateY(${ptr.pull}px)`,
          transition: ptr.refreshing || ptr.pull === 0 ? 'transform 220ms ease' : 'none',
        }}
      >


      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <img src={logoImg} alt="Flywaters — La community italiana per la pesca a mosca" className="h-7" />
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/cerca')} className="p-1" aria-label="Cerca">
              <Search className="w-5 h-5 text-foreground" />
            </button>
            <button onClick={() => navigate('/messages')} className="relative p-1" aria-label="Messaggi">
              <Send className="w-5 h-5 text-foreground" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Feed mode tabs */}
      <div className="sticky top-[calc(53px+env(safe-area-inset-top))] lg:top-0 z-30 bg-background border-b border-border">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setFeedMode('forYou')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              feedMode === 'forYou'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('feed.forYou')}
          </button>
          <button
            onClick={() => setFeedMode('following')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              feedMode === 'following'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('feed.following')}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-lg mx-auto">
        {loadError && !loading ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">Errore nel caricamento. Riprova.</p>
            <button
              onClick={() => fetchPosts(0, true)}
              className="px-6 py-2.5 rounded-full bg-[#242242] text-[#f5f0e8] text-sm font-semibold"
            >
              Riprova
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-card border border-black/[0.08] bg-card shadow-card overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="aspect-[4/5] bg-muted animate-pulse" />
                <div className="px-4 py-3 space-y-2">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-full bg-muted rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <>
            <EmptyState
              icon={MapPin}
              title={feedMode === 'following' ? t('feed.noFollowingPosts') : t('emptyStates.feedTitle')}
              description={feedMode === 'following' ? t('feed.followOthers') : t('emptyStates.feedDesc')}
              actionLabel={t('emptyStates.feedCta')}
              actionTo="/mappa"
              actionIcon={MapPin}
            />

            {suggestedUsers.length > 0 && (
              <div className="mt-2 px-4 pb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium text-center">{t('feed.suggestedAnglers')}</p>
                <div className="space-y-3 max-w-sm mx-auto">
                  {suggestedUsers.map(su => (
                    <SuggestedUserCard
                      key={su.user_id}
                      user={su}
                      isFollowing={followedUsers.has(su.user_id)}
                      onToggleFollow={() => toggleFollow(su.user_id)}
                      onNavigate={() => navigate(`/profile/${su.user_id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>

        ) : (
          <div className="flex flex-col gap-4 p-4">
            {posts.map((post, idx) => (
              <article key={post.id} className="rounded-card border border-black/[0.08] bg-card shadow-card overflow-hidden">
                {/* Post header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => navigate(`/profile/${post.user_id}`)}>
                    <GuideAvatar
                      src={post.profiles?.avatar_url}
                      alt={`Profilo di ${post.profiles?.username || 'pescatore'} su Flywaters`}
                      fallback={post.profiles?.display_name || 'U'}
                      isGuide={!!(post.profiles as any)?.is_guide}
                      size="md"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                        className="text-sm font-semibold text-foreground truncate hover:underline"
                      >
                        {post.profiles?.username || 'pescatore'}
                      </button>
                      {post.user_id !== user?.id && !followedUsers.has(post.user_id) && (
                        <>
                          <span className="text-muted-foreground text-xs">•</span>
                          <button
                            onClick={() => toggleFollow(post.user_id)}
                            className="text-xs font-semibold text-[hsl(var(--forest-accent))] hover:opacity-70 transition-opacity"
                          >
                            {t('feed.follow')}
                          </button>
                        </>
                      )}
                    </div>
                    {post.location_tag && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {post.location_tag}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                  <button
                    onClick={() => toggleSave(post.id)}
                    className="p-1 -mr-1"
                    aria-label={saved.has(post.id) ? 'Rimuovi dai salvati' : 'Salva post'}
                  >
                    {saved.has(post.id)
                      ? <BookmarkCheck className="w-5 h-5 fill-[#242242] text-[#242242]" />
                      : <Bookmark className="w-5 h-5 text-foreground" />}
                  </button>
                  {post.user_id === user?.id && (
                    <PostActionsMenu post={post} onUpdated={() => fetchPosts(0, true)} />
                  )}
                </div>

                <div className="block w-full aspect-[4/5] bg-muted overflow-hidden">
                  <ZoomableImage
                    src={getOptimizedImageUrl(post.image_url, 800, 75)}
                    srcSet={getImageSrcSet(post.image_url, [400, 800, 1200], 75)}
                    sizes="(max-width: 768px) 100vw, 600px"
                    alt={`Foto di pesca a mosca condivisa da ${post.profiles?.username || 'pescatore'} su Flywaters`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    decoding="async"
                    className="rounded-t-card"
                    style={{
                      backgroundImage: `url(${getOptimizedImageUrl(post.image_url, 20, 30)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    onSingleTap={() => navigate(`/post/${post.id}`)}
                    onDoubleTap={() => toggleLike(post.id, { forceLike: true })}
                  />
                </div>

                <div className="px-4 pt-3 pb-1">
                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => toggleLike(post.id)} className="transition-transform active:scale-125">
                      <Heart className={`w-6 h-6 ${likedPosts.has(post.id) ? 'fill-destructive text-destructive' : 'text-foreground hover:text-muted-foreground'}`} />
                    </button>
                    <button className="text-foreground hover:text-muted-foreground">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleShare(post)} className="text-foreground hover:text-muted-foreground">
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-foreground mb-1">
                    {post.like_count} {t('feed.likes')}
                  </p>

                  {post.caption && (
                    <p className="text-sm text-foreground">
                      <span className="font-semibold mr-1">{post.profiles?.username || 'pescatore'}</span>
                      {post.caption}
                    </p>
                  )}

                  <div className="mt-1.5">
                    <Badge variant="secondary" className="text-[11px] py-0.5 px-2 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">🐟 No-Kill</Badge>
                  </div>

                  {((post.fish_species && post.fish_species.length > 0) || (post.fishing_technique && post.fishing_technique.length > 0) || (post.gear_used && post.gear_used.length > 0)) && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {post.fish_species?.map(s => (
                        <Badge key={s} variant="secondary" className="text-[11px] py-0 px-1.5">🐟 {s}</Badge>
                      ))}
                      {post.fishing_technique?.map(t => (
                        <Badge key={t} variant="secondary" className="text-[11px] py-0 px-1.5">🎯 {t}</Badge>
                      ))}
                      {post.gear_used?.map(g => (
                        <Badge key={g} variant="outline" className="text-[11px] py-0 px-1.5">🎣 {g}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <PostComments
                  postId={post.id}
                  commentCount={post.comment_count}
                  onCommentAdded={() => fetchPosts(0, true)}
                />
              </article>
            ))}

            {suggestedUsers.length > 0 && posts.length >= 3 && (
              <div id="suggested-anglers" className="border-b border-border py-6 px-4">
                <p className="text-sm font-semibold text-foreground mb-4">{t('feed.suggestedForYou')}</p>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {suggestedUsers.map(su => (
                    <div
                      key={su.user_id}
                      className="flex flex-col items-center gap-2 min-w-[100px] py-3 px-2 border border-border rounded-xl"
                    >
                      <button onClick={() => navigate(`/profile/${su.user_id}`)}>
                        <GuideAvatar
                          src={su.avatar_url}
                          alt={`Profilo di ${su.username || su.display_name || 'utente'} su Flywaters`}
                          fallback={su.display_name || 'U'}
                          isGuide={!!su.is_guide}
                          size="xl"
                        />
                      </button>
                      <p className="text-xs font-semibold text-foreground text-center truncate w-full">
                        {su.username || su.display_name}
                      </p>
                      <button
                        onClick={() => toggleFollow(su.user_id)}
                        className={`text-xs font-semibold px-4 py-1 rounded-lg transition-colors ${
                          followedUsers.has(su.user_id)
                            ? 'bg-muted text-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {followedUsers.has(su.user_id) ? t('feed.followingBtn') : t('feed.follow')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel + loader / end-of-feed */}
            <div ref={sentinelRef} />
            {loadingMore && (
              <div className="flex justify-center items-center gap-1.5 py-6">
                <span className="w-2 h-2 rounded-full bg-[#242242] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#242242] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#242242] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            {!loadingMore && !hasMore && posts.length > 0 && (
              <div className="text-center py-8 px-4 text-sm text-muted-foreground">
                🎣 Hai visto tutto!{' '}
                <Link to="/mappa" className="font-semibold text-[#242242] underline">
                  Aggiungi il tuo primo spot.
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  );
};


const SuggestedUserCard = ({
  user: su,
  isFollowing,
  onToggleFollow,
  onNavigate,
}: {
  user: SuggestedUser;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onNavigate: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-left">
      <button onClick={onNavigate}>
        <GuideAvatar
          src={su.avatar_url}
          alt={`Profilo di ${su.username || su.display_name || 'utente'} su Flywaters`}
          fallback={su.display_name || 'U'}
          isGuide={!!su.is_guide}
          size="lg"
        />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{su.display_name || su.username}</p>
        <p className="text-xs text-muted-foreground">{su.post_count} posts</p>
      </div>
      <button
        onClick={onToggleFollow}
        className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
          isFollowing
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {isFollowing ? t('feed.followingBtn') : t('feed.follow')}
      </button>
    </div>
  );
};

export default Feed;
