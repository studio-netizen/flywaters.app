# UX Polish & Micro-interactions

Scope: 5 independent improvements across the app. All strings routed through `i18next` (IT/EN).

## 1. Skeleton Loaders

Replace spinners with Tailwind shimmer skeletons in:
- **Feed** (`src/pages/Feed.tsx`) — extract `<FeedSkeleton />` (3 post cards: avatar row + square media + action row + caption lines).
- **Notifications** (`src/pages/Notifications.tsx`) — already partly skeletoned, standardize style with shimmer.
- **Spot Details Drawer** (`src/components/SpotDetailDrawer.tsx`) — hero image + title + rating + review list rows.
- **Profile** (`src/pages/Profile.tsx`) — header (avatar/name/stats) + 3x3 grid tiles.

Uses existing `bg-muted animate-pulse` pattern already established in the codebase (memory: "Skeleton loading only, no spinners").

## 2. Motivational Empty States

New reusable `src/components/EmptyState.tsx`: icon + title + subtitle + primary CTA button. Applied to:
- Notifications empty → CTA "Esplora la mappa" → `/mappa`
- Profile "Salvati" tab empty → CTA "Scopri il feed" → `/`
- Profile "Post" tab empty (own profile) → CTA "Crea il tuo primo post" → `/publish`
- Feed empty (no posts loaded) → CTA "Segnala uno spot" → `/mappa`
- Messages list empty → CTA "Trova pescatori" → `/cerca`

All copy added to `src/locales/it.json` + `src/locales/en.json` under `emptyStates.*`.

## 3. Mobile Floating Action Button (FAB)

New `src/components/MobileFAB.tsx` rendered inside `AppLayout` (mobile only, `lg:hidden`, positioned above `BottomNav`).
- Collapsed: single `+` pill button, bottom-right, ~72px above bottom nav.
- Expanded: three stacked action pills with icons + labels:
  - "Nuovo post" (Camera) → `/publish`
  - "Condividi spot" (MapPin) → `/mappa?action=new-spot`
  - "Segnala problema" (AlertTriangle) → `/mappa?action=report`
- Backdrop dim overlay when open; tap outside closes. Uses `animate-scale-in` / `fade-in`.
- Hidden on `/publish`, `/messages/*`, `/auth`, admin routes.

## 4. Upload Progress Indicator

Enhance `CreatePostDialog.tsx` + `Publish.tsx` + `ReportIssueDialog.tsx`:
- Show local preview via `URL.createObjectURL(file)` immediately on file select (already partly done in some).
- Wire `XMLHttpRequest` upload with progress event → `progress` state (0-100). For R2 uploads (`src/lib/r2.ts`), extend the signed-upload helper to accept an `onProgress` callback and use `xhr.upload.onprogress` instead of `fetch`.
- Render translucent overlay on preview: circular progress ring or bottom linear bar with "%".

## 5. Network Resilience Toast

- Configure React Query global default: `retry: 2`, `retryDelay: exponential`. In `QueryClient` `defaultOptions.queries.meta` add an `onError` handler via `QueryCache({ onError })` in `src/App.tsx` (or main QueryClient init).
- On query error matching network signals (`err.message` includes `Failed to fetch` / `NetworkError` / `timeout` / navigator.onLine=false), fire `toast("Segnale debole rilevato. Nuovo tentativo…")` once per 10s (dedup with a module-level timestamp).
- Add `online` / `offline` window listeners in `src/main.tsx` for a "Connessione ripristinata" success toast.

## Technical notes

- Uses existing `sonner` toast (already imported in the app).
- No new dependencies.
- Locale keys added under `emptyStates`, `fab`, `upload`, `network`.
- Verify by loading Feed with throttled network in preview and confirming skeletons + retry toast.

## Files touched (approx.)

Created:
- `src/components/EmptyState.tsx`
- `src/components/MobileFAB.tsx`
- `src/components/FeedSkeleton.tsx` (shared)

Edited:
- `src/pages/Feed.tsx`, `src/pages/Notifications.tsx`, `src/pages/Profile.tsx`, `src/pages/Messages.tsx`
- `src/components/SpotDetailDrawer.tsx`, `src/components/AppLayout.tsx`
- `src/components/CreatePostDialog.tsx`, `src/pages/Publish.tsx`, `src/components/ReportIssueDialog.tsx`, `src/lib/r2.ts`
- `src/App.tsx` (QueryClient error handler)
- `src/main.tsx` (online/offline listeners)
- `src/locales/it.json`, `src/locales/en.json`
