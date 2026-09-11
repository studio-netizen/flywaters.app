/**
 * Lightweight haptic feedback wrapper.
 * Silent no-op on desktop / unsupported browsers.
 */
export const haptic = (pattern: number | number[] = 10) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
};

export const hapticLight = () => haptic(10);
export const hapticMedium = () => haptic(20);
export const hapticSuccess = () => haptic([10, 40, 20]);
