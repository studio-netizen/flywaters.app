import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';

interface Props {
  variant?: 'sidebar' | 'inline';
  onPick?: () => void;
}

const UserSearch = ({ variant = 'sidebar', onPick }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const handle = setTimeout(async () => {
      const q = query.trim();
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, is_guide')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(8);
      setResults(data || []);
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className={`relative ${variant === 'sidebar' ? 'mb-3 px-2' : ''}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { navigate(`/cerca?q=${encodeURIComponent(query.trim())}`); setOpen(false); onPick?.(); } }}
          placeholder={t('common.searchUsers') || 'Cerca pescatori, spot...'}
          className="w-full h-9 pl-9 pr-8 text-sm rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-[#242242] outline-none transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:bg-muted"
            aria-label="clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && query.trim().length >= 1 && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl bg-background border border-border shadow-lg overflow-hidden">
          {results.map((u) => (
            <button
              key={u.user_id}
              onClick={() => {
                navigate(`/profile/${u.user_id}`);
                setQuery(''); setResults([]); setOpen(false);
                onPick?.();
              }}
              className="flex items-center gap-2.5 px-3 py-2 w-full text-left hover:bg-muted/60"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={u.avatar_url || ''} />
                <AvatarFallback className="text-xs">{(u.display_name || u.username || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{u.display_name || u.username}</p>
                {u.username && <p className="text-xs text-muted-foreground truncate">@{u.username}</p>}
              </div>
            </button>
          ))}
          <button
            onClick={() => { navigate(`/cerca?q=${encodeURIComponent(query.trim())}`); setOpen(false); onPick?.(); }}
            className="block w-full text-left px-3 py-2 text-xs font-semibold text-[#242242] hover:bg-muted/60 border-t border-border"
          >
            Cerca "{query.trim()}" in pescatori, spot e post →
          </button>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
