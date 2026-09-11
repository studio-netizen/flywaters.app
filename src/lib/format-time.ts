/**
 * Human-readable Italian relative time formatter.
 *  - <1 min  → "adesso"
 *  - <1 h    → "5 minuti fa" / "1 minuto fa"
 *  - <24 h   → "2 ore fa" / "1 ora fa"
 *  - 1 day   → "ieri"
 *  - <7 d    → "3 giorni fa"
 *  - older   → "3 mag 2026"
 */
export function formatTimeIt(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'adesso';
  if (mins < 60) return mins === 1 ? '1 minuto fa' : `${mins} minuti fa`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? '1 ora fa' : `${hrs} ore fa`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'ieri';
  if (days < 7) return `${days} giorni fa`;
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}
