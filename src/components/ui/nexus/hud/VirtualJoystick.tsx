import { useState, type FC } from 'react';
import { Zap, Shield, Crosshair, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';

export const VirtualJoystick: FC = () => {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});

  const pressKey = (code: string, keyName: string) => {
    setActiveKeys(prev => ({ ...prev, [code]: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key: keyName, bubbles: true }));
  };

  const releaseKey = (code: string, keyName: string) => {
    setActiveKeys(prev => ({ ...prev, [code]: false }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key: keyName, bubbles: true }));
  };

  const handleShootStart = () => {
    nexusAudio.playLaser();
    pressKey('Space', ' ');
  };

  const handleShootEnd = () => {
    releaseKey('Space', ' ');
  };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-24 z-30 pointer-events-none px-3 sm:px-6 flex justify-between items-end font-mono select-none">
      
      {/* Left Touch Virtual D-Pad (Thrust & Steering) */}
      <div className="pointer-events-auto flex flex-col items-center select-none">
        <div className="relative w-32 h-32 bg-black/60 backdrop-blur-md rounded-full border border-sky-500/40 p-2 shadow-2xl flex items-center justify-center">
          
          {/* Forward (W) */}
          <button
            onTouchStart={() => pressKey('KeyW', 'W')}
            onTouchEnd={() => releaseKey('KeyW', 'W')}
            onMouseDown={() => pressKey('KeyW', 'W')}
            onMouseUp={() => releaseKey('KeyW', 'W')}
            className={`absolute top-1 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activeKeys['KeyW'] ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.6)]' : 'bg-gray-900/90 text-sky-400 border border-gray-700'
            }`}
          >
            <ArrowUp size={18} />
          </button>

          {/* Reverse (S) */}
          <button
            onTouchStart={() => pressKey('KeyS', 'S')}
            onTouchEnd={() => releaseKey('KeyS', 'S')}
            onMouseDown={() => pressKey('KeyS', 'S')}
            onMouseUp={() => releaseKey('KeyS', 'S')}
            className={`absolute bottom-1 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activeKeys['KeyS'] ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.6)]' : 'bg-gray-900/90 text-sky-400 border border-gray-700'
            }`}
          >
            <ArrowDown size={18} />
          </button>

          {/* Yaw Left (A) */}
          <button
            onTouchStart={() => pressKey('KeyA', 'A')}
            onTouchEnd={() => releaseKey('KeyA', 'A')}
            onMouseDown={() => pressKey('KeyA', 'A')}
            onMouseUp={() => releaseKey('KeyA', 'A')}
            className={`absolute left-1 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activeKeys['KeyA'] ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.6)]' : 'bg-gray-900/90 text-sky-400 border border-gray-700'
            }`}
          >
            <ArrowLeft size={18} />
          </button>

          {/* Yaw Right (D) */}
          <button
            onTouchStart={() => pressKey('KeyD', 'D')}
            onTouchEnd={() => releaseKey('KeyD', 'D')}
            onMouseDown={() => pressKey('KeyD', 'D')}
            onMouseUp={() => releaseKey('KeyD', 'D')}
            className={`absolute right-1 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              activeKeys['KeyD'] ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.6)]' : 'bg-gray-900/90 text-sky-400 border border-gray-700'
            }`}
          >
            <ArrowRight size={18} />
          </button>

          {/* Center Stick Indicator */}
          <div className="w-8 h-8 rounded-full border border-sky-400/40 bg-sky-500/20 flex items-center justify-center text-[10px] text-sky-300 font-bold">
            6DOF
          </div>
        </div>
      </div>

      {/* Right Touch Combat Actions (Fire Laser, Boost, Brake) */}
      <div className="pointer-events-auto flex flex-col items-end gap-3 select-none">
        
        {/* Boost & Brake Row */}
        <div className="flex gap-2">
          {/* Boost Button */}
          <button
            onTouchStart={() => pressKey('ShiftLeft', 'Shift')}
            onTouchEnd={() => releaseKey('ShiftLeft', 'Shift')}
            onMouseDown={() => pressKey('ShiftLeft', 'Shift')}
            onMouseUp={() => releaseKey('ShiftLeft', 'Shift')}
            className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold shadow-lg transition-all ${
              activeKeys['ShiftLeft']
                ? 'bg-amber-500 text-white border-white scale-105 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                : 'bg-black/70 border-amber-500/60 text-amber-300'
            }`}
          >
            <Zap size={16} />
            <span>BOOST</span>
          </button>

          {/* Brake Button */}
          <button
            onTouchStart={() => pressKey('KeyX', 'X')}
            onTouchEnd={() => releaseKey('KeyX', 'X')}
            onMouseDown={() => pressKey('KeyX', 'X')}
            onMouseUp={() => releaseKey('KeyX', 'X')}
            className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold shadow-lg transition-all ${
              activeKeys['KeyX']
                ? 'bg-rose-500 text-white border-white scale-105 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                : 'bg-black/70 border-rose-500/60 text-rose-300'
            }`}
          >
            <Shield size={16} />
            <span>BRAKE</span>
          </button>
        </div>

        {/* PRIMARY FIRE BUTTON */}
        <button
          onTouchStart={handleShootStart}
          onTouchEnd={handleShootEnd}
          onMouseDown={handleShootStart}
          onMouseUp={handleShootEnd}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 border-2 border-red-300 text-white flex flex-col items-center justify-center font-black shadow-[0_0_20px_rgba(239,68,68,0.5)] active:scale-95 transition-transform cursor-pointer"
        >
          <Crosshair size={22} className="animate-spin-slow" />
          <span className="text-[10px] tracking-wider uppercase">FIRE</span>
        </button>

      </div>

    </div>
  );
};
