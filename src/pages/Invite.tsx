import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import logoImg from '@/assets/flywaters-logo-dark.png';
import heroImg from '@/assets/hero-fullbleed.webp';

const Invite = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviter, setInviter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) { setLoading(false); return; }
    supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .eq('username', username)
      .maybeSingle()
      .then(({ data }) => { setInviter(data); setLoading(false); });
  }, [username]);

  const handleAccept = () => {
    if (username) {
      try { localStorage.setItem('flywaters_referred_by', username); } catch {}
    }
    navigate('/auth');
  };

  const inviterName = inviter?.display_name || inviter?.username || username || '';

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <SEOHead
        title={`${inviterName} ti invita su Flywaters`}
        description="Unisciti alla community italiana di pesca a mosca: scopri spot, condividi catture e connettiti con altri pescatori."
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px) brightness(0.4)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-background shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <img src={logoImg} alt="Flywaters" className="h-9 mx-auto mb-6" />

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 w-20 mx-auto rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-2/3 mx-auto bg-muted rounded animate-pulse" />
          </div>
        ) : user ? (
          <>
            <h1 className="text-xl font-semibold text-foreground mb-2">Sei già su Flywaters!</h1>
            <p className="text-sm text-muted-foreground mb-6">Vai al feed e scopri le ultime catture.</p>
            <Button onClick={() => navigate('/')} className="w-full rounded-full bg-[#242242] hover:bg-[#1a1834] text-white">
              Vai al feed →
            </Button>
          </>
        ) : (
          <>
            {inviter && (
              <div className="flex flex-col items-center mb-5">
                <Avatar className="h-20 w-20 mb-3 ring-4 ring-[#242242]/10">
                  <AvatarImage src={inviter.avatar_url || ''} />
                  <AvatarFallback className="text-xl">{inviterName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">@{inviter.username}</p>
              </div>
            )}
            <h1 className="text-xl font-semibold text-foreground mb-3">
              {inviterName} ti ha invitato su Flywaters 🎣
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-7">
              La community italiana per la pesca a mosca. Scopri spot, condividi catture e connettiti con altri pescatori.
            </p>
            <Button
              onClick={handleAccept}
              className="w-full rounded-full bg-[#242242] hover:bg-[#1a1834] text-white h-12 text-base font-semibold"
            >
              Accetta l'invito — è gratis
            </Button>
            <Link
              to="/"
              className="block mt-4 text-sm text-muted-foreground hover:text-foreground underline"
            >
              Scopri di più
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Invite;
