import { useState, useRef, useCallback } from 'react';
import { Heart } from 'lucide-react';

interface ZoomableImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'auto';
  decoding?: 'async' | 'auto' | 'sync';
  onSingleTap?: () => void;
  /** When provided, double-tap fires this instead of zooming (Instagram-style like). */
  onDoubleTap?: () => void;
  disableZoom?: boolean;
}

const ZoomableImage = ({
  src,
  srcSet,
  sizes,
  alt,
  className = '',
  style = {},
  loading,
  fetchPriority,
  decoding,
  onSingleTap,
  onDoubleTap,
  disableZoom = false,
}: ZoomableImageProps) => {
  const [zoomed, setZoomed] = useState(false);
  const [burst, setBurst] = useState(0);
  const lastTapRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBurst = () => setBurst(b => b + 1);

  const handleTap = useCallback(() => {
    const useDoubleTapLike = !!onDoubleTap;

    if (disableZoom && !useDoubleTapLike) {
      onSingleTap?.();
      return;
    }

    const now = Date.now();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      if (useDoubleTapLike) {
        onDoubleTap!();
        triggerBurst();
      } else {
        setZoomed(z => !z);
      }
    } else {
      lastTapRef.current = now;
      if (onSingleTap) {
        timerRef.current = setTimeout(() => {
          lastTapRef.current = 0;
          timerRef.current = null;
          onSingleTap();
        }, 320);
      }
    }
  }, [disableZoom, onSingleTap, onDoubleTap]);

  return (
    <div
      className={`overflow-hidden relative ${className}`}
      onClick={handleTap}
      style={{ touchAction: 'pan-y' }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        className="w-full h-full object-cover"
        style={{
          ...style,
          transform: zoomed ? 'scale(2)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          cursor: zoomed ? 'zoom-out' : 'zoom-in',
          transformOrigin: 'center center',
        }}
      />
      {burst > 0 && (
        <Heart
          key={burst}
          className="pointer-events-none absolute inset-0 m-auto w-24 h-24 fill-white text-white heart-burst drop-shadow-lg"
        />
      )}
    </div>
  );
};

export default ZoomableImage;
