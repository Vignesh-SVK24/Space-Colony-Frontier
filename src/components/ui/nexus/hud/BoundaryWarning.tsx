import React, { useEffect, useRef } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';

export const BoundaryWarning: React.FC = () => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    
    const checkProximity = () => {
      const state = useMultiplayerStore.getState().selfState;
      if (overlayRef.current) {
        if (state) {
          const [x, y, z] = state.position;
          const dist = Math.sqrt(x * x + y * y + z * z);
          const margin = 50;
          const boundaryRadius = 300;
          
          if (dist > boundaryRadius - margin) {
            const intensity = Math.min(1, (dist - (boundaryRadius - margin)) / margin);
            overlayRef.current.style.opacity = intensity.toFixed(2);
            overlayRef.current.style.display = 'flex';
          } else {
            overlayRef.current.style.opacity = '0';
            overlayRef.current.style.display = 'none';
          }
        } else {
          overlayRef.current.style.opacity = '0';
          overlayRef.current.style.display = 'none';
        }
      }
      animationFrameId = requestAnimationFrame(checkProximity);
    };
    
    checkProximity();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none items-center justify-center transition-opacity duration-200"
      style={{
        display: 'none',
        opacity: 0,
        background: 'radial-gradient(circle, transparent 40%, rgba(255,0,0,0.4) 100%)'
      }}
    >
      <div className="text-red-500 font-mono text-2xl sm:text-3xl font-bold tracking-[0.2em] animate-pulse drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
        ⚠ BOUNDARY WARNING — TURN BACK
      </div>
    </div>
  );
};
