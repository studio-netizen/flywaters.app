import { useEffect, useRef, useState } from 'react';

interface Options {
  onRefresh: () => Promise<void> | void;
  /** Distance in px the user must pull to trigger refresh */
  threshold?: number;
  /** Max visual pull distance in px */
  maxPull?: number;
  /** Disable the gesture (e.g. desktop) */
  disabled?: boolean;
}

/**
 * Native-feel pull-to-refresh for mobile lists.
 * Attach the returned `ref` to a scroll container (must be at scrollTop = 0 to arm).
 */
export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  threshold = 70,
  maxPull = 120,
  disabled = false,
}: Options) {
  const ref = useRef<T | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const armed = useRef(false);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      // Arm only if the page/window is scrolled to the top.
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollTop > 2) {
        armed.current = false;
        return;
      }
      armed.current = true;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!armed.current || startY.current == null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setPull(0);
        return;
      }
      // Resistance curve
      const eased = Math.min(maxPull, delta * 0.5);
      setPull(eased);
      if (eased > 6 && e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      if (!armed.current) return;
      armed.current = false;
      const shouldRefresh = pull >= threshold;
      startY.current = null;
      if (shouldRefresh) {
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onRefresh, threshold, maxPull, refreshing, pull, disabled]);

  return { ref, pull, refreshing, progress: Math.min(1, pull / threshold) };
}
