import { useParams, Link, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Copy, Check } from 'lucide-react';
import logoDark from '@/assets/flywaters-logo-dark.png';
import logoWhite from '@/assets/flywaters-logo-white.png';

interface BlogPost {
  title: string;
  slug: string;
  seo_title: string | null;
  meta_description: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  body_html: string | null;
  author: string;
  reading_time_minutes: number | null;
  published_at: string | null;
}

interface RelatedPost {
  slug: string;
  title: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  reading_time_minutes: number | null;
}

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setArticle(data as any);

      const { data: others } = await supabase
        .from('blog_posts')
        .select('slug, title, cover_image_url, cover_image_alt, reading_time_minutes')
        .eq('status', 'published')
        .neq('slug', slug)
        .order('published_at', { ascending: false })
        .limit(2);
      setRelated((others as any) || []);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/blog" replace />;
  if (loading || !article) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#242242]" />
    </div>
  );

  const shareUrl = `https://flywaters.app/blog/${article.slug}`;
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead
        title={`${article.seo_title || article.title} | Flywaters`}
        description={article.meta_description || undefined}
        canonical={shareUrl}
        ogImage={article.cover_image_url || undefined}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 px-6 py-5 bg-[#f5f0e8]/95 backdrop-blur-sm border-b border-[#242242]/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoDark} alt="Flywaters — La community italiana per la pesca a mosca" className="h-5" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/blog" className="font-medium text-[#242242]">Blog</Link>
            <Link to="/mappa" className="text-[#8c8c7a] hover:text-[#242242] transition-colors">Mappa</Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="px-6 pt-8">
        <div className="max-w-[780px] mx-auto text-xs text-[#8c8c7a] flex items-center gap-2">
          <Link to="/" className="hover:text-[#242242] transition-colors">Home</Link>
          <span>›</span>
          <Link to="/blog" className="hover:text-[#242242] transition-colors">Blog</Link>
          <span>›</span>
          <span className="text-[#242242]/60 truncate max-w-[200px]">{article.title}</span>
        </div>
      </div>

      {/* Hero image */}
      {article.cover_image_url && (
        <div className="px-6 pt-6">
          <div className="max-w-[780px] mx-auto">
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt || article.title}
              className="w-full aspect-[16/9] object-cover"
              style={{ filter: 'saturate(0.8) contrast(1.05)' }}
            />
          </div>
        </div>
      )}

      {/* Article */}
      <article className="px-6 pt-10 pb-20">
        <div className="max-w-[780px] mx-auto">
          {/* Meta */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-9 h-9 rounded-full bg-[#242242] flex items-center justify-center overflow-hidden">
              <img src={logoDark} alt="Team Flywaters" className="h-4 invert" />
            </div>
            <div>
              <p className="text-sm font-medium">{article.author}</p>
              <div className="flex items-center gap-2 text-xs text-[#8c8c7a]">
                <Clock className="w-3 h-3" />
                <span>{article.reading_time_minutes || 5} min di lettura</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-10">
            {article.title}
          </h1>

          {/* Body HTML */}
          {article.body_html && (
            <div
              className="prose prose-lg max-w-none [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-bold [&_h2]:font-serif [&_h2]:mb-4 [&_h2]:mt-10 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-serif [&_h3]:mb-3 [&_h3]:mt-8 [&_p]:text-[#242242]/80 [&_p]:leading-[1.8] [&_p]:mb-4"
              style={{ fontSize: '18px', lineHeight: '1.8' }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body_html, { USE_PROFILES: { html: true } }) }}
            />
          )}

          {/* Share buttons */}
          <div className="mt-14 pt-8 border-t border-[#242242]/10">
            <p className="text-sm font-medium mb-4">Condividi questo articolo</p>
            <div className="flex items-center gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium tracking-wide bg-[#25D366] text-white hover:opacity-90 transition-opacity">
                WhatsApp
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium tracking-wide bg-[#1877F2] text-white hover:opacity-90 transition-opacity">
                Facebook
              </a>
              <button onClick={copyLink}
                className="px-4 py-2 text-xs font-medium tracking-wide border border-[#242242]/20 text-[#242242] hover:bg-[#242242]/5 transition-colors inline-flex items-center gap-2">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiato!' : 'Copia link'}
              </button>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-14 bg-[#242242] text-[#f5f0e8] p-8 md:p-12 text-center">
            <h3 className="text-2xl font-bold font-serif mb-3">Scopri gli spot su Flywaters</h3>
            <p className="text-sm text-[#f5f0e8]/70 mb-6">Esplora la mappa, condividi le tue catture e connettiti con la community.</p>
            <Link to="/auth"
              className="inline-block px-8 py-3 text-sm tracking-widest uppercase font-medium border border-[#f5f0e8]/60 text-[#f5f0e8] hover:bg-[#f5f0e8]/10 transition-colors">
              Registrati gratis
            </Link>
          </div>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-16">
              <h3 className="text-xl font-bold font-serif mb-8">Articoli correlati</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {related.map((r) => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                    <div className="overflow-hidden mb-3">
                      <img
                        src={r.cover_image_url || 'https://images.unsplash.com/photo-1494564605686-2e931f77a8e2?w=800'}
                        alt={r.cover_image_alt || r.title}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ filter: 'saturate(0.8) contrast(1.05)' }}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8c8c7a] mb-1">
                      <Clock className="w-3 h-3" />
                      <span>{r.reading_time_minutes || 5} min</span>
                    </div>
                    <h4 className="text-base font-semibold font-serif group-hover:text-[#4a7c59] transition-colors leading-snug">
                      {r.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-[#242242] text-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters — La community italiana per la pesca a mosca" className="h-6" />
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <Link to="/blog" className="hover:text-[#f5f0e8] transition-colors">Blog</Link>
            <Link to="/installa-app" className="hover:text-[#f5f0e8] transition-colors">Installa l'app</Link>
            <Link to="/contatti" className="hover:text-[#f5f0e8] transition-colors">Contatti</Link>
            <a href="https://www.iubenda.com/privacy-policy/53958448" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f0e8] transition-colors">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#f5f0e8] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogArticle;
