import { useState, useEffect } from 'react';

/**
 * Checks if document is currently in fullscreen mode across browsers
 */
export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Requests fullscreen mode on the root element and optionally engages screen wake lock
 */
export async function enterFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const docEl = document.documentElement as any;

  try {
    if (!isFullscreen()) {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    }

    // Keep screen awake while in gameplay on mobile
    if ('wakeLock' in navigator) {
      try {
        await (navigator as any).wakeLock.request('screen');
      } catch {
        // WakeLock optional
      }
    }

    // Mobile address bar hide scroll trick
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 1);
    }

    return true;
  } catch (err) {
    console.warn('Fullscreen request could not be completed:', err);
    return false;
  }
}

/**
 * Exits fullscreen mode across browsers
 */
export async function exitFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const doc = document as any;

  try {
    if (isFullscreen()) {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    }
    return true;
  } catch (err) {
    console.warn('Exit fullscreen error:', err);
    return false;
  }
}

/**
 * Toggles fullscreen mode
 */
export async function toggleFullscreen(): Promise<boolean> {
  if (isFullscreen()) {
    return await exitFullscreen();
  } else {
    return await enterFullscreen();
  }
}

/**
 * React hook to listen for fullscreen state changes
 */
export function useFullscreen() {
  const [fullscreenActive, setFullscreenActive] = useState<boolean>(isFullscreen());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenActive(isFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen: fullscreenActive,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen
  };
}
