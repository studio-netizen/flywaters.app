import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AuthModal from '@/components/AuthModal';
import { MapPin, Camera, Users, Search, Share2, Fish } from 'lucide-react';
import logoWhite from '@/assets/flywaters-logo-white.png';
import logoDark from '@/assets/flywaters-logo-dark.png';
import heroImg from '@/assets/hero-mosca-club.jpg';
import editorialImg from '@/assets/editorial-wideshot.jpg';
import craftImg from '@/assets/craft-anglers.jpg';
import seasonCold from '@/assets/season-winter.jpg';
import seasonTemperate from '@/assets/season-spring.webp';
import seasonWarm from '@/assets/season-summer.webp';
import seasonSalt from '@/assets/season-saltwater.webp';
import spotTovel from '@/assets/spot-lago-tovel.webp';
import spotNatisone from '@/assets/spot-torrente-natisone.jpg';
import spotMella from '@/assets/spot-torrente-mella.jpeg';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SpeciesSection from '@/components/landing/SpeciesSection';
import EntomologySection from '@/components/landing/EntomologySection';

const slow = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] as const },
  },
});

const spots = [
  { img: spotTovel, region: 'TRENTINO-ALTO ADIGE', name: 'Lago di Tovel' },
  { img: spotNatisone, region: 'FRIULI VENEZIA GIULIA', name: 'Torrente Natisone' },
  { img: spotMella, region: 'LOMBARDIA', name: 'Torrente Mella' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeSeason, setActiveSeason] = useState(0);
  const { t } = useTranslation();

  const seasons = [
    { key: 'cold', label: t('landing.seasons.winter'), img: seasonCold, desc: t('landing.seasons.winterDesc') },
    { key: 'temperate', label: t('landing.seasons.spring'), img: seasonTemperate, desc: t('landing.seasons.springDesc') },
    { key: 'warm', label: t('landing.seasons.summer'), img: seasonWarm, desc: t('landing.seasons.summerDesc') },
    { key: 'salt', label: t('landing.seasons.autumn'), img: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=800&q=80', desc: t('landing.seasons.autumnDesc') },
  ];

  const features = [
    {
      icon: MapPin,
      title: t('landing.discoverSpots'),
      desc: t('landing.discoverSpotsDesc'),
    },
    {
      icon: Camera,
      title: t('landing.shareCatches'),
      desc: t('landing.shareCatchesDesc'),
    },
    {
      icon: Users,
      title: t('landing.connectCommunity'),
      desc: t('landing.connectCommunityDesc'),
    },
  ];

  const steps = [
    { num: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc'), Icon: Fish },
    { num: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc'), Icon: Search },
    { num: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc'), Icon: Share2 },
  ];

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8', color: '#242242' }}>
      <SEOHead title={t('seo.defaultTitle')} description={t('seo.defaultDescription')} canonical="https://flywaters.app/" />

      {/* ─── MINIMAL NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium tracking-wide text-white">Flywaters</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="border-white/30 text-white hover:bg-white/10" />
            {!authLoading && !user ? (
              <>
                <button
                  onClick={() => openAuth('login')}
                  className="px-5 py-2 rounded-full text-xs tracking-widest uppercase font-medium text-white border border-white/40 hover:bg-white/10 transition-colors"
                >
                  {t('landing.login')}
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-5 py-2 rounded-full text-xs tracking-widest uppercase font-medium bg-white text-[#242242] hover:opacity-85 transition-opacity"
                >
                  {t('landing.register')}
                </button>
              </>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8 border border-white/30">
                      <AvatarImage src={''} alt={`Profilo di ${user.user_metadata?.full_name || user.email || 'utente'} su Flywaters`} />
                      <AvatarFallback className="bg-white/20 text-white text-sm">
                        {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>{t('nav.profile')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/')}>Feed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>{t('nav.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />

      {/* ─── HERO: FULL-BLEED IMAGE WITH OVERLAY ─── */}
      <section className="relative w-full h-[85vh]">
        <img
          src={heroImg}
          alt="Pescatore a mosca in un torrente alpino italiano"
          className="w-full h-full object-cover object-center"
          style={{ filter: 'saturate(0.8) contrast(1.05)' }}
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }}
        />

        <div className="absolute inset-0 flex items-end">
          <div className="px-6 md:px-12 pb-12 md:pb-16 max-w-7xl w-full mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="display-xl text-[44px] md:text-[88px] text-white max-w-[14ch]"
            >
              {t('landing.heroHeadline')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-5 text-white/90 text-lg font-normal leading-[1.6] max-w-[560px]"
            >
              {t('landing.heroSubheadline')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              {user ? (
                <button
                  onClick={() => navigate('/mappa')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#242242] hover:opacity-85 transition-opacity"
                >
                  {t('landing.ctaExplore')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/mappa')}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#242242] hover:opacity-85 transition-opacity"
                  >
                    {t('landing.ctaExplore')}
                  </button>
                  <button
                    onClick={() => openAuth('login')}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold bg-transparent border-[1.5px] border-white text-white hover:opacity-85 transition-opacity"
                  >
                    {t('landing.login')}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── GEAR PER STAGIONE ─── */}
      <section className="px-6 py-12 md:py-20 border-t border-[#242242]/10">
        <div className="max-w-content mx-auto">
          <motion.p variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="label-caps text-[#8c8c7a] mb-3">
            {t('landing.everyWater')}
          </motion.p>
          <motion.h2 variants={slow(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="display-lg text-3xl md:text-6xl mb-10">
            {t('landing.spotsForCondition')}
          </motion.h2>

          <div className="flex gap-0 border-b border-[#242242]/10 mb-10">
            {seasons.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActiveSeason(i)}
                className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors border-b-2 ${
                  activeSeason === i
                    ? 'border-[#242242] text-[#242242]'
                    : 'border-transparent text-[#8c8c7a] hover:text-[#242242]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
            <motion.div key={seasons[activeSeason].key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="overflow-hidden md:col-span-3 relative">
              <img src={seasons[activeSeason].img} alt={seasons[activeSeason].label} className="w-full aspect-[4/5] object-cover" style={{ filter: 'saturate(0.8) contrast(1.05)' }} loading="lazy" width={800} height={1000} />
              <div className="absolute inset-0 flex items-end p-6 md:p-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)' }}>
                <span className="text-white text-3xl md:text-5xl font-bold font-serif uppercase tracking-wider leading-none">
                  {seasons[activeSeason].label}
                </span>
              </div>
            </motion.div>
            <motion.div key={`text-${seasons[activeSeason].key}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="md:col-span-2 self-center">
              <h3 className="text-2xl md:text-3xl font-bold font-serif mb-4">{seasons[activeSeason].label}</h3>
              <p className="text-base md:text-lg leading-relaxed text-[#8c8c7a] mb-8">{seasons[activeSeason].desc}</p>
              <button onClick={() => navigate('/mappa')} className="text-sm font-semibold tracking-[0.18em] uppercase text-[#2D3A27] hover:opacity-70 transition-opacity inline-flex items-center gap-2 group">
                {t('landing.exploreSpots')}
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL: CRAFT BLOCK ─── */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div variants={slow(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="max-w-lg order-2 md:order-1">
            <p className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">{t('landing.ourMission')}</p>
            <h2 className="display-lg text-3xl md:text-5xl mb-6 whitespace-pre-line">
              {t('landing.builtByFishers')}
            </h2>
            <p className="text-base leading-relaxed text-[#8c8c7a] mb-8">
              {t('landing.missionDesc')}
            </p>
            <button onClick={() => openAuth('register')} className="inline-flex items-center justify-center px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-semibold border border-[#2D3A27] text-[#2D3A27] hover:bg-[#2D3A27] hover:text-[#f5f0e8] transition-colors">
              {t('landing.joinCommunity')}
            </button>
          </motion.div>
          <motion.div variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="overflow-hidden order-1 md:order-2">
            <img src={craftImg} alt="Costruzione di una mosca artigianale" className="w-full h-[500px] md:h-[700px] object-cover" style={{ filter: 'saturate(0.8) contrast(1.05)' }} loading="lazy" width={1080} height={1920} />
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="px-6 py-20 md:py-32 border-t border-[#242242]/10">
        <div className="max-w-7xl mx-auto">
          <motion.p variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3">
            {t('landing.whatYouCanDo')}
          </motion.p>
          <motion.h2 variants={slow(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="display-lg text-3xl md:text-6xl mb-14">
            {t('landing.digitalCompanion')}
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={slow(i * 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
                <div
                  className="flex items-center justify-center mb-6"
                  style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#f0ede8' }}
                >
                  <f.icon style={{ width: 48, height: 48, color: '#242242' }} strokeWidth={1.5} />
                </div>
                <div className="mb-3" style={{ width: 40, height: 3, backgroundColor: '#242242' }} />
                <h3 className="text-xl font-bold font-serif mb-3">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#8c8c7a]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NO-KILL PHILOSOPHY ─── */}
      <section className="bg-[#242242] text-[#f5f0e8] py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-xs tracking-[0.3em] uppercase text-[#f5f0e8]/50 mb-4">
            {t('landing.ourValue')}
          </motion.p>
          <motion.h2 variants={slow(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="display-lg text-3xl md:text-6xl mb-8">
            {t('landing.noKillPhilosophy')}
          </motion.h2>
          <motion.p variants={slow(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-base md:text-lg leading-relaxed text-[#f5f0e8]/75">
            {t('landing.noKillDesc')}
          </motion.p>
        </div>
      </section>

      {/* ─── FULL-WIDTH EDITORIAL IMAGE ─── */}
      <section>
        <motion.div variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <img src={editorialImg} alt="Pescatore in un torrente di montagna in autunno" className="w-full h-[50vh] md:h-[70vh] object-cover" style={{ filter: 'saturate(0.8) contrast(1.05)' }} loading="lazy" width={1280} height={1600} />
        </motion.div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="px-6 py-20 md:py-32" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="max-w-7xl mx-auto">
          <motion.p variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3">
            {t('landing.startIn3Steps')}
          </motion.p>
          <motion.h2 variants={slow(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="display-lg text-3xl md:text-6xl mb-14">
            {t('landing.howItWorks')}
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-16">
            {steps.map((s, i) => (
              <motion.div key={s.num} variants={slow(i * 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
                <s.Icon className="w-14 h-14 mb-4" strokeWidth={1.4} style={{ color: '#242242' }} />
                <span className="text-5xl font-bold font-serif block mb-4" style={{ color: '#242242' }}>{s.num}</span>
                <h3 className="text-xl font-bold font-serif mb-3">{s.title}</h3>
                <p className="text-sm leading-relaxed text-[#8c8c7a]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FLY FISHING SPECIES ─── */}
      <SpeciesSection />

      {/* ─── ENTOMOLOGY ─── */}
      <EntomologySection />


      {/* ─── FEATURED SPOTS ─── */}
      <section className="py-20 md:py-32 px-6 border-t border-[#242242]/10">
        <div className="max-w-7xl mx-auto">
          <motion.p variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-4">
            {t('landing.featured')}
          </motion.p>
          <motion.h2 variants={slow(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="display-lg text-3xl md:text-6xl mb-14">
            {t('landing.spotsWorthTrip')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {spots.map((s, i) => (
              <motion.button key={s.name} variants={slow(i * 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} onClick={() => navigate('/mappa')} className="text-left group">
                <div className="overflow-hidden mb-4 rounded-card">
                  <img src={s.img} alt={s.name} className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: 'saturate(0.8) contrast(1.05)' }} loading="lazy" width={1200} height={800} />
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#8c8c7a] mb-1">{s.region}</p>
                <p className="text-lg font-semibold font-serif">{s.name}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="bg-[#242242] text-[#f5f0e8] py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 variants={slow(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="display-lg text-3xl md:text-6xl mb-6 whitespace-pre-line">
            {t('landing.ctaTitle')}
          </motion.h2>
          <motion.div variants={slow(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <button onClick={() => navigate('/mappa')} className="inline-flex items-center justify-center px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-semibold border border-[#f5f0e8]/60 text-[#f5f0e8] hover:bg-[#f5f0e8] hover:text-[#242242] transition-colors">
              {t('landing.exploreSpots')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#242242] text-[#f5f0e8] border-t border-[#f5f0e8]/10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoWhite} alt="Flywaters — La community italiana per la pesca a mosca" className="h-6" />
          <p className="text-xs tracking-[0.2em] uppercase text-[#f5f0e8]/50">
            {t('landing.footerTagline')}
          </p>
          <div className="flex gap-8 text-xs tracking-wide text-[#f5f0e8]/60">
            <a href="/blog" className="hover:text-[#f5f0e8] transition-colors">{t('nav.blog')}</a>
            <a href="/installa-app" className="hover:text-[#f5f0e8] transition-colors">Installa l'app</a>
            <a href="/contatti" className="hover:text-[#f5f0e8] transition-colors">{t('nav.contacts')}</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448" className="iubenda-white iubenda-noiframe iubenda-embed hover:text-[#f5f0e8] transition-colors" title="Privacy Policy">Privacy Policy</a>
            <a href="https://www.iubenda.com/privacy-policy/53958448/cookie-policy" className="iubenda-white iubenda-noiframe iubenda-embed hover:text-[#f5f0e8] transition-colors" title="Cookie Policy">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
