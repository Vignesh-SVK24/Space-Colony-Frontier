import React, { useEffect, useState } from 'react';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';

export const BoundaryWarning: React.FC = () => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    
    const checkProximity = () => {
      const state = useMultiplayerStore.getState().selfState;
      if (state) {
        const [x, y, z] = state.position;
        const dist = Math.sqrt(x*x + y*y + z*z);
        const margin = 50;
        const boundaryRadius = 300;
        
        if (dist > boundaryRadius - margin) {
          const intensity = Math.min(1, (dist - (boundaryRadius - margin)) / margin);
          setOpacity(intensity);
        } else {
          setOpacity(0);
        }
      }
      animationFrameId = requestAnimationFrame(checkProximity);
    };
    
    checkProximity();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  if (opacity <= 0) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300"
      style={{
        opacity: opacity,
        background: 'radial-gradient(circle, transparent 40%, rgba(255,0,0,0.4) 100%)'
      }}
    >
      <div className="text-red-500 font-mono text-3xl font-bold tracking-[0.2em] animate-pulse drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
        ⚠ BOUNDARY WARNING — TURN BACK
      </div>
    </div>
  );
};
