import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, X, Star, Waves, Mountain, Fish } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/AppLayout';
import SEOHead from '@/components/SEOHead';
import { formatTimeIt } from '@/lib/format-time';

type Tab = 'users' | 'spots' | 'posts';
const RECENT_KEY = 'flywaters_recent_searches';

const escapeLike = (s: string) => s.replace(/[%_,]/g, (m) => '\\' + m);

const SpotTypeIcon = ({ type }: { type: string }) => {
  if (type === 'lake') return <Waves className="w-4 h-4 text-blue-600" />;
  if (type === 'river' || type === 'stream') return <Mountain className="w-4 h-4 text-emerald-700" />;
  return <Fish className="w-4 h-4 text-cyan-700" />;
};

const SearchPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [tab, setTab] = useState<Tab>('users');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [spots, setSpots] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ users: number; spots: number }>({ users: 0, spots: 0 });
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      if (Array.isArray(stored)) setRecent(stored.slice(0, 5));
    } catch {}
    (async () => {
      const [u, s] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('spots').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({ users: u.count || 0, spots: s.count || 0 });
    })();
  }, []);

  useEffect(() => {
    const h = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(h);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      setUsers([]); setSpots([]); setPosts([]); setLoading(false);
      return;
    }
    setLoading(true);
    const q = `%${escapeLike(debounced)}%`;
    let cancelled = false;
    (async () => {
      const [uRes, sRes, pRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url, fishing_types, is_guide')
          .or(`username.ilike.${q},display_name.ilike.${q}`)
          .limit(5),
        supabase
          .from('spots')
          .select('id, name, spot_type, description, avg_rating, review_count, fish_species')
          .or(`name.ilike.${q},description.ilike.${q}`)
          .limit(5),
        supabase
          .from('posts')
          .select('id, image_url, caption, location_tag, created_at, user_id, profiles:profiles!posts_user_id_profiles_fkey(username, display_name, avatar_url)')
          .or(`caption.ilike.${q},location_tag.ilike.${q}`)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      if (cancelled) return;
      setUsers(uRes.data || []);
      setSpots(sRes.data || []);
      setPosts(pRes.data || []);
      setLoading(false);

      // Check follow status for results
      if (user && uRes.data?.length) {
        const ids = uRes.data.map((p: any) => p.user_id).filter((id: string) => id !== user.id);
        if (ids.length) {
          const { data: f } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .in('following_id', ids);
          const map: Record<string, boolean> = {};
          (f || []).forEach((r: any) => { map[r.following_id] = true; });
          setFollowing(map);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [debounced, user]);

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const removeRecent = (term: string) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const handleFollow = async (targetId: string) => {
    if (!user) { navigate('/auth'); return; }
    if (targetId === user.id) return;
    if (following[targetId]) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowing((m) => ({ ...m, [targetId]: false }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      setFollowing((m) => ({ ...m, [targetId]: true }));
    }
  };

  const showInitial = debounced.length < 2;
  const totalResults = users.length + spots.length + posts.length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'users', label: '👤 Pescatori', count: users.length },
    { id: 'spots', label: '📍 Spot', count: spots.length },
    { id: 'posts', label: '📸 Post', count: posts.length },
  ];

  return (
    <AppLayout>
      <SEOHead title="Cerca | Flywaters" description="Cerca pescatori, spot e catture nella community Flywaters." />
      <div className="max-w-[600px] mx-auto px-4 py-4 lg:py-8 min-h-screen">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setParams(e.target.value ? { q: e.target.value } : {}, { replace: true }); }}
              onKeyDown={(e) => { if (e.key === 'Enter') saveRecent(query); }}
              placeholder="Cerca pescatori, spot, catture..."
              className="w-full h-12 pl-11 pr-10 text-base rounded-full bg-muted/60 border border-transparent focus:bg-background focus:border-[#242242] outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); setParams({}, { replace: true }); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => navigate(-1)} className="lg:hidden p-2 rounded-full hover:bg-muted" aria-label="Chiudi">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showInitial && (
          <div className="animate-in fade-in duration-200">
            {recent.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ricerche recenti</p>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-muted text-sm">
                      <button onClick={() => setQuery(r)} className="hover:underline">{r}</button>
                      <button onClick={() => removeRecent(r)} className="p-0.5 rounded-full hover:bg-background" aria-label="Rimuovi">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center text-muted-foreground py-12">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">🔍 Cerca tra <span className="font-semibold text-foreground">{counts.users}</span> pescatori e <span className="font-semibold text-foreground">{counts.spots}</span> spot</p>
            </div>
          </div>
        )}

        {!showInitial && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              {tabs.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === tb.id ? 'bg-[#242242] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tb.label}{tb.count > 0 ? ` (${tb.count})` : ''}
                </button>
              ))}
            </div>

            {loading && (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && totalResults === 0 && (
              <div className="text-center py-12 animate-in fade-in duration-200">
                <p className="text-foreground font-medium mb-1">Nessun risultato per "{debounced}"</p>
                <p className="text-sm text-muted-foreground">Prova con un termine diverso</p>
              </div>
            )}

            {!loading && tab === 'users' && users.length > 0 && (
              <ul className="space-y-1 animate-in fade-in duration-200">
                {users.map((u) => (
                  <li key={u.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                    <Link to={`/profile/${u.user_id}`} onClick={() => saveRecent(query)} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback>{(u.display_name || u.username || 'U')[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{u.display_name || u.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}{u.fishing_types?.length ? ` · ${u.fishing_types.slice(0,2).join(', ')}` : ''}</p>
                      </div>
                    </Link>
                    {user && user.id !== u.user_id && (
                      <button
                        onClick={() => handleFollow(u.user_id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          following[u.user_id] ? 'bg-muted text-foreground' : 'bg-[#242242] text-white hover:bg-[#1a1834]'
                        }`}
                      >
                        {following[u.user_id] ? 'Seguito' : 'Segui'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {!loading && tab === 'spots' && spots.length > 0 && (
              <ul className="space-y-1 animate-in fade-in duration-200">
                {spots.map((s) => (
                  <li key={s.id}>
                    <Link to={`/spot/${s.id}`} onClick={() => saveRecent(query)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                      <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center">
                        <SpotTypeIcon type={s.spot_type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {s.spot_type}
                          {s.review_count > 0 && (
                            <span className="inline-flex items-center gap-0.5">· <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {Number(s.avg_rating).toFixed(1)} ({s.review_count})</span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {!loading && tab === 'posts' && posts.length > 0 && (
              <ul className="space-y-1 animate-in fade-in duration-200">
                {posts.map((p) => (
                  <li key={p.id}>
                    <Link to={`/post/${p.id}`} onClick={() => saveRecent(query)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                      <img src={p.image_url} alt="" loading="lazy" className="w-[60px] h-[60px] rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">@{p.profiles?.username || 'utente'}</p>
                        {p.caption && <p className="text-xs text-muted-foreground line-clamp-1">{p.caption}</p>}
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatTimeIt(p.created_at)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SearchPage;
