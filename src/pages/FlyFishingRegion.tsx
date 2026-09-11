import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const REGIONS_DATA: Record<string, { name: string; description: string; descriptionEn: string }> = {
  'lombardia': {
    name: 'Lombardia',
    description: 'La Lombardia offre alcuni dei migliori spot di pesca a mosca d\'Italia, con torrenti alpini come il Mella, il Serio e l\'Oglio. Le acque cristalline delle Prealpi e le risorgive della pianura padana ospitano trote fario, temoli e salmerini. Dai laghi prealpini ai torrenti della Valtellina, ogni bacino ha caratteristiche uniche che lo rendono ideale per diverse tecniche di pesca a mosca.',
    descriptionEn: 'Lombardy offers some of Italy\'s best fly fishing spots, with alpine streams like the Mella, Serio and Oglio. The crystal-clear waters of the Prealps and the spring creeks of the Po Valley are home to brown trout, grayling and char.',
  },
  'trentino-alto-adige': {
    name: 'Trentino-Alto Adige',
    description: 'Il Trentino-Alto Adige è il paradiso della pesca a mosca in Italia. L\'Adige, il Noce, l\'Avisio e i torrenti delle Dolomiti offrono acque fredde e ossigenate perfette per trota marmorata, fario e temolo. I laghi alpini come il Lago di Tovel regalano scenari mozzafiato e pesci di taglia. La regione è famosa per le schiuse abbondanti di effimere e tricotteri.',
    descriptionEn: 'Trentino-Alto Adige is Italy\'s fly fishing paradise. The Adige, Noce, Avisio and Dolomite streams offer cold, oxygenated waters perfect for marble trout, brown trout and grayling.',
  },
  'friuli-venezia-giulia': {
    name: 'Friuli Venezia Giulia',
    description: 'Il Friuli Venezia Giulia ospita alcuni dei fiumi più rinomati per la pesca a mosca: il Natisone, il Tagliamento e il Torre. Le acque di risorgiva della pianura friulana sono habitat ideale per la trota marmorata, specie endemica delle Alpi orientali. Il Carso offre torrenti unici con acque turchesi e fondali calcarei.',
    descriptionEn: 'Friuli Venezia Giulia hosts some of Italy\'s most renowned fly fishing rivers: the Natisone, Tagliamento and Torre.',
  },
  'veneto': {
    name: 'Veneto',
    description: 'Il Veneto è ricco di acque pregiate per la pesca a mosca. Il Brenta, il Piave e il Bacchiglione offrono habitat diversificati per trote e temoli. Le risorgive del Sile e le acque delle Prealpi vicentine sono tra le più apprezzate dai fly fisher italiani. Il lago di Garda offre opportunità uniche per la trota lacustre.',
    descriptionEn: 'Veneto is rich in premium fly fishing waters. The Brenta, Piave and Bacchiglione offer diverse habitats for trout and grayling.',
  },
  'piemonte': {
    name: 'Piemonte',
    description: 'Il Piemonte è terra di grandi fiumi e torrenti alpini. Il Sesia, la Stura di Demonte, il Toce e la Dora Baltea sono mete classiche per la pesca a mosca. Le trote marmorate del Sesia sono tra le più grandi d\'Italia. La regione offre anche laghi prealpini e risorgive di pianura ricche di fauna ittica.',
    descriptionEn: 'Piedmont is a land of great rivers and alpine streams. The Sesia, Stura di Demonte, Toce and Dora Baltea are classic fly fishing destinations.',
  },
  'emilia-romagna': {
    name: 'Emilia Romagna',
    description: 'L\'Emilia Romagna offre un\'eccellente pesca a mosca nell\'Appennino tosco-emiliano. Il Taro, il Trebbia, il Secchia e il Reno ospitano popolazioni di trote fario autoctone. I torrenti appenninici, con le loro acque fresche e ombrose, sono ideali per la pesca a ninfa e a secca nei mesi primaverili e autunnali.',
    descriptionEn: 'Emilia Romagna offers excellent fly fishing in the Tuscan-Emilian Apennines. The Taro, Trebbia, Secchia and Reno host native brown trout populations.',
  },
  'toscana': {
    name: 'Toscana',
    description: 'La Toscana offre pesca a mosca in contesti paesaggistici unici. I torrenti dell\'Appennino come il Serchio, il Lima e il Corsalone ospitano trote fario e macrostigma. Le acque del Casentino e della Garfagnana sono tra le più pescose dell\'Italia centrale, con schiuse abbondanti da aprile a ottobre.',
    descriptionEn: 'Tuscany offers fly fishing in unique landscapes. Apennine streams like the Serchio, Lima and Corsalone host brown and Mediterranean trout.',
  },
  'umbria': {
    name: 'Umbria',
    description: 'L\'Umbria, cuore verde d\'Italia, offre torrenti di montagna e fiumi di fondovalle ideali per la pesca a mosca. Il Nera, il Clitunno e il Topino sono tra i corsi d\'acqua più rinomati. Le sorgenti carsiche garantiscono acque limpide e temperature costanti, perfette per la trota fario.',
    descriptionEn: 'Umbria, the green heart of Italy, offers mountain streams and valley rivers ideal for fly fishing.',
  },
  'valle-d-aosta': {
    name: 'Valle d\'Aosta',
    description: 'La Valle d\'Aosta è una gemma per la pesca a mosca alpina. La Dora Baltea e i suoi affluenti scorrono tra vette oltre i 4000 metri, offrendo acque fredde e rapide popolate da trote fario di ceppo autoctono. I torrenti laterali come il Lys e il Valpelline regalano esperienze di pesca in scenari selvaggi e incontaminati.',
    descriptionEn: 'Valle d\'Aosta is a gem for alpine fly fishing. The Dora Baltea and its tributaries flow between peaks over 4000m.',
  },
  'liguria': {
    name: 'Liguria',
    description: 'La Liguria offre torrenti brevi ma intensi che scendono dall\'Appennino al mare. L\'Argentina, il Centa e l\'Entella ospitano trote fario e, nei tratti terminali, spigole e cefali. La varietà di ambienti, dai torrenti montani alle foci, rende la Liguria interessante per tecniche diverse di pesca a mosca.',
    descriptionEn: 'Liguria offers short but intense streams flowing from the Apennines to the sea.',
  },
};

const ALL_REGIONS = Object.entries(REGIONS_DATA).map(([slug, data]) => ({
  slug,
  ...data,
}));

interface Spot {
  id: string;
  name: string;
  spot_type: string;
  avg_rating: number;
  review_count: number;
  latitude: number;
  longitude: number;
  description: string | null;
  photos: string[] | null;
}

const FlyFishingRegion = () => {
  const { region } = useParams<{ region: string }>();
  const navigate = useNavigate();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  const isIndex = !region;
  const regionData = region ? REGIONS_DATA[region] : null;

  useEffect(() => {
    fetchSpots();
  }, [region]);

  const fetchSpots = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('spots')
      .select('id, name, spot_type, avg_rating, review_count, latitude, longitude, description, photos')
      .order('avg_rating', { ascending: false })
      .limit(20);
    setSpots((data as Spot[]) || []);
    setLoading(false);
  };

  const pageTitle = isIndex
    ? 'Fly Fishing in Italy — Best Spots & Rivers | Flywaters'
    : `Fly Fishing ${regionData?.name || region} — Spots & Rivers | Flywaters`;

  const pageDesc = isIndex
    ? 'Discover the best fly fishing spots in Italy. Explore rivers, lakes and streams across all Italian regions. Save locations, read reviews and plan your next fishing trip.'
    : regionData?.description?.slice(0, 155) + '...' || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: pageDesc,
    url: isIndex
      ? 'https://flywaters.app/fly-fishing-italy'
      : `https://flywaters.app/fly-fishing-italy/${region}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: spots.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Place',
          name: s.name,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: s.latitude,
            longitude: s.longitude,
          },
          ...(s.avg_rating > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: s.avg_rating,
              reviewCount: s.review_count,
            },
          }),
        },
      })),
    },
  };

  return (
    <AppLayout>
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonical={
          isIndex
            ? 'https://flywaters.app/fly-fishing-italy'
            : `https://flywaters.app/fly-fishing-italy/${region}`
        }
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029'),
        }}
      />

      <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
          <nav className="flex items-center gap-1 text-xs text-[#8c8c7a]">
            <Link to="/" className="hover:text-[#242242] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            {isIndex ? (
              <span className="text-[#242242] font-medium">Fly Fishing Italy</span>
            ) : (
              <>
                <Link to="/fly-fishing-italy" className="hover:text-[#242242] transition-colors">Fly Fishing Italy</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#242242] font-medium">{regionData?.name || region}</span>
              </>
            )}
          </nav>
        </div>

        {/* Hero */}
        <header className="max-w-5xl mx-auto px-4 py-8 md:py-14">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold font-serif leading-tight mb-6"
          >
            {isIndex
              ? 'Fly Fishing in Italy'
              : `Fly Fishing in ${regionData?.name || region}`}
          </motion.h1>
          <p className="text-base md:text-lg leading-relaxed text-[#8c8c7a] max-w-3xl">
            {isIndex
              ? 'Italy is a world-class fly fishing destination with crystal-clear alpine streams, limestone spring creeks, and wild Apennine rivers. From the marble trout of the north to the Mediterranean trout of the south, discover hundreds of spots shared by the Flywaters community.'
              : regionData?.description}
          </p>
        </header>

        {/* Region grid (index only) */}
        {isIndex && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <h2 className="text-xl font-bold font-serif mb-6">Explore by Region</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ALL_REGIONS.map((r) => (
                <Link
                  key={r.slug}
                  to={`/fly-fishing-italy/${r.slug}`}
                  className="group p-4 border border-[#242242]/10 rounded-2xl hover:border-[#242242]/30 transition-colors"
                >
                  <span className="text-sm font-semibold group-hover:text-[#4a7c59] transition-colors flex items-center justify-between">
                    {r.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Map link */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <button
            onClick={() => navigate('/mappa')}
            className="w-full flex items-center justify-between p-5 border border-[#242242]/10 rounded-2xl hover:border-[#4a7c59]/40 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#4a7c59]" />
              <div className="text-left">
                <p className="text-sm font-semibold">Explore the interactive map</p>
                <p className="text-xs text-[#8c8c7a]">View all spots with filters and reviews</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[#8c8c7a] group-hover:text-[#4a7c59] transition-colors" />
          </button>
        </section>

        {/* Spots listing */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <h2 className="text-xl font-bold font-serif mb-6">
            {isIndex ? 'Top rated spots in Italy' : `Spots in ${regionData?.name || region}`}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#242242]" />
            </div>
          ) : spots.length === 0 ? (
            <p className="text-sm text-[#8c8c7a] py-8">No spots found yet. Be the first to add one!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {spots.map((spot) => (
                <Link
                  key={spot.id}
                  to={`/spot/${spot.id}`}
                  className="group flex gap-4 p-4 border border-[#242242]/10 rounded-2xl hover:border-[#242242]/25 transition-colors"
                >
                  {spot.photos?.[0] ? (
                    <img
                      src={spot.photos[0]}
                      alt={spot.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-[#242242]/5 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-[#8c8c7a]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate group-hover:text-[#4a7c59] transition-colors">
                      {spot.name}
                    </h3>
                    <p className="text-xs text-[#8c8c7a] capitalize mt-0.5">{spot.spot_type}</p>
                    {spot.description && (
                      <p className="text-xs text-[#8c8c7a] mt-1 line-clamp-2">{spot.description}</p>
                    )}
                    {spot.avg_rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3.5 h-3.5 fill-[#d4a017] text-[#d4a017]" />
                        <span className="text-xs font-medium">{Number(spot.avg_rating).toFixed(1)}</span>
                        <span className="text-xs text-[#8c8c7a]">({spot.review_count})</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Internal links (index only) */}
        {isIndex && (
          <section className="max-w-5xl mx-auto px-4 pb-20 border-t border-[#242242]/10 pt-12">
            <h2 className="text-xl font-bold font-serif mb-4">Related pages</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/blog" className="text-sm px-4 py-2 border border-[#242242]/15 rounded-full hover:border-[#242242]/30 transition-colors">
                Fly Fishing Blog
              </Link>
              <Link to="/mappa" className="text-sm px-4 py-2 border border-[#242242]/15 rounded-full hover:border-[#242242]/30 transition-colors">
                Interactive Map
              </Link>
              <Link to="/contatti" className="text-sm px-4 py-2 border border-[#242242]/15 rounded-full hover:border-[#242242]/30 transition-colors">
                Contact Us
              </Link>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default FlyFishingRegion;
