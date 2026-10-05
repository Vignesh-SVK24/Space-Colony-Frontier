/**
 * Mobile Device Detection & WebGL Performance Optimization Engine
 * Tailored specifically for iOS (Safari / WebKit) & Android (Chrome / WebView)
 */

export const isIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    isIOS() ||
    isAndroid() ||
    /Mobi|Tablet|Opera Mini|IEMobile/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth <= 1024) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024)
  );
};

/**
 * Returns optimal DPR for WebGL Canvas.
 * Mobile Retina screens (e.g. 3x on iPhones, 2.75x-3.5x on high-DPI Android)
 * choke mobile GPUs if rendered at native 2x or 3x.
 * 1.25 DPR provides sharp visuals while reducing fragment shader workload by over 60%.
 */
export const getOptimalDPR = (): [number, number] => {
  if (isMobileDevice()) {
    const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const clamped = Math.min(rawDpr, 1.25);
    return [1, Math.max(1, clamped)];
  }
  return [1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)];
};

/**
 * Check if the device is a low-memory or constrained mobile device
 */
export const isLowSpecDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  if (nav.deviceMemory && nav.deviceMemory <= 4) return true;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true;
  return false;
};

/**
 * Global mobile environment setup to prevent gesture latency,
 * rubber-band overscroll on iOS, and passive touch issues.
 */
export const setupMobileEnvironment = () => {
  if (typeof document === 'undefined') return;

  // Prevent default pinch-to-zoom and gesture interference on mobile web games
  const preventZoom = (e: TouchEvent) => {
    if (e.touches && e.touches.length > 1) {
      e.preventDefault();
    }
  };

  document.addEventListener('touchstart', preventZoom, { passive: false });
  document.addEventListener('gesturestart' as any, (e: any) => e.preventDefault(), { passive: false });

  // Web Audio unlock on iOS Safari upon first touch
  const unlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        if (dummyCtx.state === 'suspended') {
          dummyCtx.resume();
        }
      }
    } catch {}
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('pointerdown', unlockAudio);
  };

  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
};
