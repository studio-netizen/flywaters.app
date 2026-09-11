import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Star, Mountain, Waves } from 'lucide-react';


type Species = {
  key: string;
  scientific: string;
  habitat: string;
  habitatIcon: string;
  difficulty: 1 | 2 | 3;
  difficultyKey: 'easy' | 'intermediate' | 'technical';
  img: string;
  alt: string;
  bestFlies: string[];
  bestMonthsKey: string;
  bestRegionsKey: string;
};


const SPECIES: Species[] = [
  {
    key: 'brownTrout',
    scientific: 'Salmo trutta fario',
    habitat: 'streamRiver',
    habitatIcon: 'river',
    difficulty: 2,
    difficultyKey: 'intermediate',
    img: '/brown-trout.png',
    alt: 'Brown Trout - Salmo trutta fario illustration',
    bestFlies: ['Adams', 'Pheasant Tail', 'Elk Hair Caddis'],
    bestMonthsKey: 'monthsMarchOct',
    bestRegionsKey: 'regionsAlpsApennines',
  },
  {
    key: 'marbleTrout',
    scientific: 'Salmo marmoratus',
    habitat: 'alpineRiver',
    habitatIcon: 'mountain',
    difficulty: 3,
    difficultyKey: 'technical',
    img: '/marble-trout.png',
    alt: 'Marble Trout - Salmo marmoratus illustration',
    bestFlies: ['Streamer Zonker', 'Woolly Bugger', 'Stonefly Nymph'],
    bestMonthsKey: 'monthsAprSep',
    bestRegionsKey: 'regionsFriuliVeneto',
  },
  {
    key: 'rainbowTrout',
    scientific: 'Oncorhynchus mykiss',
    habitat: 'lakeRiver',
    habitatIcon: 'river',
    difficulty: 1,
    difficultyKey: 'easy',
    img: '/rainbow-trout.png',
    alt: 'Rainbow Trout - Oncorhynchus mykiss illustration',
    bestFlies: ['Hare\'s Ear', 'San Juan Worm', 'Parachute Adams'],
    bestMonthsKey: 'monthsAllYear',
    bestRegionsKey: 'regionsAllItaly',
  },
  {
    key: 'grayling',
    scientific: 'Thymallus thymallus',
    habitat: 'fastRiver',
    habitatIcon: 'mountain',
    difficulty: 3,
    difficultyKey: 'technical',
    img: '/images/fish/grayling.png',
    alt: 'Grayling - Thymallus thymallus illustration',
    bestFlies: ['CDC Dun', 'Klinkhammer', 'Tricot'],
    bestMonthsKey: 'monthsMayOct',
    bestRegionsKey: 'regionsTrentinoFriuli',
  },
  {
    key: 'brookTrout',
    scientific: 'Salvelinus fontinalis',
    habitat: 'alpineStream',
    habitatIcon: 'mountain',
    difficulty: 2,
    difficultyKey: 'intermediate',
    img: '/images/fish/brook-trout.png',
    alt: 'Brook Trout - Salvelinus fontinalis illustration',
    bestFlies: ['Royal Wulff', 'Humpy', 'Caddis Pupa'],
    bestMonthsKey: 'monthsJuneSep',
    bestRegionsKey: 'regionsHighAlps',
  },
  {
    key: 'arcticChar',
    scientific: 'Salvelinus alpinus',
    habitat: 'alpineLake',
    habitatIcon: 'mountain',
    difficulty: 3,
    difficultyKey: 'technical',
    img: '/images/fish/arctic-char.png',
    alt: 'Arctic Char - Salvelinus alpinus illustration',
    bestFlies: ['Booby Fly', 'Damsel Nymph', 'Bloodworm'],
    bestMonthsKey: 'monthsJulySep',
    bestRegionsKey: 'regionsHighAlpineLakes',
  },
  {
    key: 'pike',
    scientific: 'Esox lucius',
    habitat: 'lakeSlowRiver',
    habitatIcon: 'river',
    difficulty: 2,
    difficultyKey: 'intermediate',
    img: '/pike.png',
    alt: 'Pike - Esox lucius illustration',
    bestFlies: ['Pike Bunny', 'Deceiver', 'Game Changer'],
    bestMonthsKey: 'monthsOctApr',
    bestRegionsKey: 'regionsPoLakes',
  },
  {
    key: 'chub',
    scientific: 'Squalius cephalus',
    habitat: 'river',
    habitatIcon: 'river',
    difficulty: 1,
    difficultyKey: 'easy',
    img: '/images/fish/chub.png',
    alt: 'Chub - Squalius cephalus illustration',
    bestFlies: ['Foam Beetle', 'Hopper', 'Sedge'],
    bestMonthsKey: 'monthsMayAug',
    bestRegionsKey: 'regionsCentralNorthItaly',
  },
  {
    key: 'barbel',
    scientific: 'Barbus barbus',
    habitat: 'river',
    habitatIcon: 'river',
    difficulty: 2,
    difficultyKey: 'intermediate',
    img: '/images/fish/barbel.png',
    alt: 'Barbel - Barbus barbus illustration',
    bestFlies: ['Heavy Czech Nymph', 'Stonefly', 'Caddis Larva'],
    bestMonthsKey: 'monthsAprOct',
    bestRegionsKey: 'regionsLargeRivers',
  },
  {
    key: 'carp',
    scientific: 'Cyprinus carpio',
    habitat: 'lakeSlowRiver',
    habitatIcon: 'river',
    difficulty: 3,
    difficultyKey: 'technical',
    img: '/images/fish/common-carp.png',
    alt: 'Common Carp - Cyprinus carpio illustration',
    bestFlies: ['Carp Crab', 'Hybrid Damsel', 'Mulberry Fly'],
    bestMonthsKey: 'monthsMayAug',
    bestRegionsKey: 'regionsLowlands',
  },
];

const Stars = ({ n }: { n: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-hidden>
    {[1, 2, 3].map((i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i <= n ? 'fill-[#242242] text-[#242242]' : 'fill-transparent text-[#242242]/25'}`}
        strokeWidth={1.5}
      />
    ))}
  </span>
);

const HabitatIcon = ({ icon }: { icon: string }) =>
  icon === 'mountain' ? (
    <Mountain className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
  ) : (
    <Waves className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
  );

const SpeciesSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Species | null>(null);

  return (
    <section className="px-6 py-20 md:py-32 border-t border-[#242242]/10" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3"
        >
          {t('landing.species.label')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="display-lg text-3xl md:text-6xl mb-4"
        >
          {t('landing.species.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg leading-relaxed text-[#8c8c7a] mb-14 max-w-2xl"
        >
          {t('landing.species.subtitle')}
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {SPECIES.map((s, i) => (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => setSelected(s)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative h-full flex flex-col text-left bg-white rounded-2xl p-5 pr-[130px] pt-10 overflow-visible shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow duration-200"
            >
              <picture>
                <source srcSet={s.img.replace(/\.png$/, '.webp')} type="image/webp" />
                <img
                  src={s.img}
                  alt={s.alt}
                  width={160}
                  height={100}
                  loading="lazy"
                  decoding="async"
                  className="species-illustration absolute pointer-events-none"
                  style={{ top: '-15px', right: '0px', filter: 'saturate(0.9) drop-shadow(2px 4px 6px rgba(0,0,0,0.1))' }}
                />
              </picture>
              <h3 className="text-lg md:text-xl font-bold font-serif leading-tight mb-1 text-[#242242]">
                {t(`landing.species.list.${s.key}.name`)}
              </h3>
              <p className="italic text-xs text-[#8c8c7a] mb-3">{s.scientific}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <HabitatIcon icon={s.habitatIcon} />
                  {t(`landing.species.habitats.${s.habitat}`)}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <Stars n={s.difficulty} />
                  <span className="ml-1">{t(`landing.species.difficulty.${s.difficultyKey}`)}</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#8c8c7a] mt-auto">
                {t(`landing.species.list.${s.key}.desc`)}
              </p>
            </motion.button>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-base md:text-lg text-[#8c8c7a] mb-5">{t('landing.species.ctaLead')}</p>
          <button
            onClick={() => navigate('/mappa')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-[#242242] text-white hover:opacity-85 transition-opacity"
          >
            {t('landing.species.ctaButton')}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f0ede8] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#242242]" />
              </button>

              <img
                src={selected.img}
                alt={selected.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-48 md:h-64 object-contain mb-4"
                style={{ filter: 'saturate(0.9)' }}
              />

              <h3 className="text-2xl md:text-3xl font-bold font-serif text-[#242242] mb-1">
                {t(`landing.species.list.${selected.key}.name`)}
              </h3>
              <p className="italic text-sm text-[#8c8c7a] mb-4">{selected.scientific}</p>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <HabitatIcon icon={selected.habitatIcon} />
                  {t(`landing.species.habitats.${selected.habitat}`)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <Stars n={selected.difficulty} />
                  <span className="ml-1">{t(`landing.species.difficulty.${selected.difficultyKey}`)}</span>
                </span>
              </div>

              <p className="text-base leading-relaxed text-[#242242] mb-6">
                {t(`landing.species.list.${selected.key}.desc`)}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-[#8c8c7a] mb-2">{t('landing.species.bestFlies')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.bestFlies.map((f) => (
                      <span key={f} className="text-sm px-3 py-1 rounded-full bg-[#f0ede8] text-[#242242]">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-[#8c8c7a] mb-2">{t('landing.species.bestSeason')}</p>
                  <p className="text-sm text-[#242242]">{t(`landing.species.months.${selected.bestMonthsKey}`)}</p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-[#8c8c7a] mb-2">{t('landing.species.bestRegions')}</p>
                  <p className="text-sm text-[#242242]">{t(`landing.species.regions.${selected.bestRegionsKey}`)}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  navigate(`/mappa?species=${encodeURIComponent(selected.key)}`);
                  setSelected(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#242242] text-white hover:opacity-85 transition-opacity"
              >
                {t('landing.species.searchSpots', { name: t(`landing.species.list.${selected.key}.name`) })}
                <span aria-hidden>→</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default SpeciesSection;
