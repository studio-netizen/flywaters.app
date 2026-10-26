import { useMemo } from 'react';
import { Clock, Fish, Feather, Cloud, Moon, Gauge, CalendarDays } from 'lucide-react';
import { dayPart, moonKey, skyKey, pressureKey, topOf, type PostConditions } from '@/lib/conditions';

const L = {
  dawn: 'Alba', morning: 'Mattina', afternoon: 'Pomeriggio', evening: 'Sera', night: 'Notte',
  clear: 'Sereno', cloudy: 'Nuvoloso', rain: 'Pioggia', snow: 'Neve', storm: 'Temporale',
  new: 'Luna nuova', waxing: 'Luna crescente', full: 'Luna piena', waning: 'Luna calante',
  low: 'Bassa', normal: 'Stabile', high: 'Alta',
} as Record<string, string>;
const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

interface Post { created_at: string; fish_species?: string[] | null; gear_used?: string[] | null; hatch_activity?: string[] | null; conditions?: PostConditions | null }

const Stat = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide mb-1.5">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <p className="text-base font-semibold text-foreground leading-tight">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const FishingDiary = ({ posts, isOwn }: { posts: Post[]; isOwn: boolean }) => {
  const s = useMemo(() => {
    const withC = posts.filter(p => p.conditions);
    const hour = (p: Post) => p.conditions?.hour ?? new Date(p.created_at).getHours();
    return {
      total: posts.length,
      withC: withC.length,
      time: topOf(posts.map(p => dayPart(hour(p)))),
      month: topOf(posts.map(p => new Date(p.created_at).getMonth())),
      species: topOf(posts.flatMap(p => p.fish_species ?? [])),
      fly: topOf(posts.flatMap(p => [...(p.gear_used ?? []), ...(p.hatch_activity ?? [])])),
      sky: topOf(withC.map(p => skyKey(p.conditions!.weather_code))),
      moon: topOf(withC.map(p => moonKey(p.conditions!.moon_phase))),
      pressure: topOf(withC.map(p => pressureKey(p.conditions!.pressure_hpa))),
      temp: withC.filter(p => p.conditions!.temp_c != null).map(p => p.conditions!.temp_c!),
    };
  }, [posts]);

  if (s.total === 0) {
    return (
      <div className="py-10 px-4">
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <h3 className="text-sm font-semibold text-foreground mb-1">Il diario è ancora vuoto</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {isOwn ? 'Pubblica le tue catture: ogni post aggiunge orario, meteo e luna, e qui scoprirai quando peschi meglio.' : 'Nessuna cattura ancora.'}
          </p>
        </div>
      </div>
    );
  }

  const n = (c?: { count: number } | null, of = s.total) => (c ? `${c.count} su ${of} catture` : undefined);
  const avgTemp = s.temp.length ? Math.round(s.temp.reduce((a, b) => a + b, 0) / s.temp.length) : null;

  return (
    <div className="py-4 space-y-4">
      <p className="text-xs text-muted-foreground px-1">
        {isOwn ? 'Il tuo profilo di pesca, costruito dalle tue catture.' : 'Profilo di pesca costruito dalle catture.'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stat icon={Clock} label="Momento migliore" value={s.time ? L[s.time.value] : '—'} sub={n(s.time)} />
        <Stat icon={CalendarDays} label="Mese migliore" value={s.month ? MONTHS[s.month.value] : '—'} sub={n(s.month)} />
        <Stat icon={Fish} label="Specie preferita" value={s.species?.value ?? '—'} sub={n(s.species)} />
        <Stat icon={Feather} label="Mosca / attrezzatura" value={s.fly?.value ?? '—'} sub={s.fly ? `usata ${s.fly.count} volte` : undefined} />
        {s.withC > 0 && <>
          <Stat icon={Cloud} label="Meteo migliore" value={s.sky ? L[s.sky.value] : '—'} sub={avgTemp != null ? `media ${avgTemp}°C` : undefined} />
          <Stat icon={Moon} label="Luna" value={s.moon ? L[s.moon.value] : '—'} sub={n(s.moon, s.withC)} />
          <Stat icon={Gauge} label="Pressione" value={s.pressure ? L[s.pressure.value] : '—'} sub={n(s.pressure, s.withC)} />
        </>}
      </div>
      {s.withC < s.total && (
        <p className="text-[11px] text-muted-foreground px-1">
          Meteo e luna sono disponibili per {s.withC} catture su {s.total}: vengono salvati in automatico solo sui post nuovi con posizione.
        </p>
      )}
    </div>
  );
};

export default FishingDiary;
