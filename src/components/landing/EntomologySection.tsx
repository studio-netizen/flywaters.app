import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Star, Sun, Snowflake, Flower2, Leaf } from 'lucide-react';


type Importance = 1 | 2 | 3;

type Insect = {
  key: string;
  order: string;
  seasonIcons: ('spring' | 'summer' | 'autumn' | 'winter')[];
  seasonKey: string;
  importance: Importance;
  importanceKey: 'primary' | 'important' | 'secondary';
  img: string;
  alt: string;
  flies: string[];
  monthsActive: number[]; // 1..12
};


const INSECTS: Insect[] = [
  {
    key: 'mayflies',
    order: 'Ephemeroptera',
    seasonIcons: ['spring', 'summer'],
    seasonKey: 'springSummer',
    importance: 3,
    importanceKey: 'primary',
    img: '/images/fish/insects/mayfly.png',
    alt: 'Mayfly - Ephemeroptera illustration',
    flies: ['Adams', 'Pheasant Tail', 'CDC Dun', 'Sparkle Dun'],
    monthsActive: [3, 4, 5, 6, 7, 8, 9],
  },
  {
    key: 'caddisflies',
    order: 'Trichoptera',
    seasonIcons: ['spring', 'summer', 'autumn'],
    seasonKey: 'yearRound',
    importance: 3,
    importanceKey: 'primary',
    img: '/images/fish/insects/caddisfly.png',
    alt: 'Caddisfly - Trichoptera illustration',
    flies: ['Elk Hair Caddis', 'CDC Caddis', 'Sedge', 'Caddis Pupa'],
    monthsActive: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },
  {
    key: 'stoneflies',
    order: 'Plecoptera',
    seasonIcons: ['winter', 'spring'],
    seasonKey: 'winterSpring',
    importance: 2,
    importanceKey: 'important',
    img: '/images/fish/insects/stonefly.png',
    alt: 'Stonefly - Plecoptera illustration',
    flies: ['Stonefly Nymph', 'Kaufmann Stone', 'Yellow Sally', 'Pteronarcys'],
    monthsActive: [1, 2, 3, 4, 5, 11, 12],
  },
  {
    key: 'trueFlies',
    order: 'Diptera',
    seasonIcons: ['spring', 'summer', 'autumn'],
    seasonKey: 'springSummerAutumn',
    importance: 2,
    importanceKey: 'important',
    img: '/images/fish/insects/midge.png',
    alt: 'Midge - Diptera illustration',
    flies: ['Griffith\'s Gnat', 'Buzzer', 'Black Midge', 'Simulium'],
    monthsActive: [3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    key: 'terrestrials',
    order: 'variousOrders',
    seasonIcons: ['summer'],
    seasonKey: 'summer',
    importance: 2,
    importanceKey: 'important',
    img: '/images/fish/insects/black-ant.png',
    alt: 'Black Ant - terrestrial insect illustration',
    flies: ['Foam Ant', 'Hopper', 'Foam Beetle', 'Chernobyl'],
    monthsActive: [6, 7, 8, 9],
  },
  {
    key: 'dragonflies',
    order: 'Odonata',
    seasonIcons: ['summer'],
    seasonKey: 'summer',
    importance: 1,
    importanceKey: 'secondary',
    img: '/images/fish/insects/dragonfly.png',
    alt: 'Dragonfly - Odonata illustration',
    flies: ['Damsel Nymph', 'Dragon Nymph', 'Booby Damsel'],
    monthsActive: [5, 6, 7, 8, 9],
  },
  {
    key: 'beetles',
    order: 'Coleoptera',
    seasonIcons: ['summer'],
    seasonKey: 'summer',
    importance: 1,
    importanceKey: 'secondary',
    img: '/images/fish/insects/beetle.png',
    alt: 'Beetle - Coleoptera illustration',
    flies: ['Foam Beetle', 'Coch-y-Bonddu', 'Black Beetle'],
    monthsActive: [6, 7, 8, 9],
  },
  {
    key: 'alderflies',
    order: 'Megaloptera',
    seasonIcons: ['spring'],
    seasonKey: 'spring',
    importance: 2,
    importanceKey: 'important',
    img: '/images/fish/insects/alderfly.png',
    alt: 'Alderfly - Megaloptera illustration',
    flies: ['Alder Larva', 'Hellgrammite', 'Black Sedge'],
    monthsActive: [4, 5, 6],
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

const SEASON_ICONS = { spring: Flower2, summer: Sun, autumn: Leaf, winter: Snowflake } as const;

const SeasonIcons = ({ seasons }: { seasons: Insect['seasonIcons'] }) => (
  <span className="inline-flex items-center gap-0.5" aria-hidden>
    {seasons.map((s) => {
      const Icon = SEASON_ICONS[s];
      return <Icon key={s} className="w-3.5 h-3.5" strokeWidth={1.75} />;
    })}
  </span>
);

const MONTH_LABELS = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];

const EntomologySection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Insect | null>(null);

  return (
    <section className="px-6 py-20 md:py-32 border-t border-[#242242]/10" style={{ backgroundColor: '#f8f5f0' }}>
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.3em] uppercase text-[#8c8c7a] mb-3"
        >
          {t('landing.entomology.label')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="display-lg text-3xl md:text-6xl mb-4"
        >
          {t('landing.entomology.title')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg leading-relaxed text-[#8c8c7a] mb-14 max-w-2xl"
        >
          {t('landing.entomology.subtitle')}
        </motion.p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {INSECTS.map((it, i) => (
            <motion.button
              key={it.key}
              type="button"
              onClick={() => setSelected(it)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              whileHover={{ y: -4 }}
              className="group relative h-full flex flex-col text-left rounded-2xl p-4 border border-[#242242]/10 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-shadow duration-200"
              style={{ backgroundColor: '#fdfaf5' }}
            >
              <div className="flex justify-center mb-3">
                <picture>
                  <source srcSet={it.img.replace(/\.png$/, '.webp')} type="image/webp" />
                  <img
                    src={it.img}
                    alt={it.alt}
                    width={200}
                    height={172}
                    loading="lazy"
                    decoding="async"
                    className="insect-illustration mx-auto rounded-xl"
                    style={{ filter: 'saturate(0.9)' }}
                  />
                </picture>
              </div>
              <h3 className="text-sm md:text-base font-bold font-serif leading-tight text-[#242242]">
                {t(`landing.entomology.list.${it.key}.name`)}
              </h3>
              <p className="italic text-[11px] text-[#8c8c7a] mb-2">{it.order === 'variousOrders' ? t('landing.entomology.variousOrders') : it.order}</p>
              <div className="flex flex-wrap gap-1.5 mt-auto w-full">
                <span className="inline-flex max-w-full items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <SeasonIcons seasons={it.seasonIcons} />
                  <span className="truncate">{t(`landing.entomology.seasons.${it.seasonKey}`)}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <Stars n={it.importance} />
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-base md:text-lg text-[#8c8c7a] mb-5">{t('landing.entomology.ctaLead')}</p>
          <button
            onClick={() => navigate('/mappa')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-[#242242] text-white hover:opacity-85 transition-opacity"
          >
            {t('landing.entomology.ctaButton')}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

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
                {t(`landing.entomology.list.${selected.key}.name`)}
              </h3>
              <p className="italic text-sm text-[#8c8c7a] mb-4">
                {selected.order === 'variousOrders' ? t('landing.entomology.variousOrders') : selected.order}
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <SeasonIcons seasons={selected.seasonIcons} />
                  <span>{t(`landing.entomology.seasons.${selected.seasonKey}`)}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#f0ede8', color: '#242242' }}>
                  <Stars n={selected.importance} />
                  <span className="ml-1">{t(`landing.entomology.importance.${selected.importanceKey}`)}</span>
                </span>
              </div>

              <p className="text-base leading-relaxed text-[#242242] mb-6">
                {t(`landing.entomology.list.${selected.key}.lifeCycle`)}
              </p>

              <div className="space-y-5 mb-6">
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-[#8c8c7a] mb-2">{t('landing.entomology.recommendedFlies')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.flies.map((f) => (
                      <span key={f} className="text-sm px-3 py-1 rounded-full bg-[#f0ede8] text-[#242242]">{f}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-[#8c8c7a] mb-2">{t('landing.entomology.hatchPeriod')}</p>
                  <div className="grid grid-cols-12 gap-1">
                    {MONTH_LABELS.map((m, idx) => {
                      const active = selected.monthsActive.includes(idx + 1);
                      return (
                        <div
                          key={idx}
                          className={`text-[10px] text-center py-2 rounded ${active ? 'bg-[#242242] text-white font-semibold' : 'bg-[#f0ede8] text-[#8c8c7a]'}`}
                        >
                          {m}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  navigate(`/mappa?hatch=${encodeURIComponent(selected.key)}`);
                  setSelected(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#242242] text-white hover:opacity-85 transition-opacity"
              >
                {t('landing.entomology.searchHatches')}
                <span aria-hidden>→</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default EntomologySection;
