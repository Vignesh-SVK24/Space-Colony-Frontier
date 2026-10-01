import { useState, useEffect, useRef, type FC } from 'react';
import {
  Zap,
  Shield,
  Crosshair,
  ChevronUp,
  ChevronDown,
  Map as MapIcon,
  Flame,
  Compass,
  Sun,
  RotateCcw
} from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';

export const VirtualJoystick: FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});

  // 360-Degree Joystick State
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState<boolean>(false);
  const [angleDeg, setAngleDeg] = useState<number>(0);
  const [magnitude, setMagnitude] = useState<number>(0);

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const setJoystickAxis = useMultiplayerStore(state => state.setJoystickAxis);
  const laserCooldownRemaining = useMultiplayerStore(state => state.laserCooldownRemaining);
  const solarCooldownRemaining = useMultiplayerStore(state => state.solarCooldownRemaining);
  const ammo = useMultiplayerStore(state => state.ammo);
  const isReloading = useMultiplayerStore(state => state.isReloading);
  const isMapOpen = useMultiplayerStore(state => state.isMapOpen);
  const setMapOpen = useMultiplayerStore(state => state.setMapOpen);

  const MAX_RADIUS = 54;

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileWidth = window.innerWidth <= 1024;
      setIsTouchDevice(hasTouch && isMobileWidth);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const pressKey = (code: string, keyName: string) => {
    setActiveKeys(prev => ({ ...prev, [code]: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key: keyName, bubbles: true }));
  };

  const releaseKey = (code: string, keyName: string) => {
    setActiveKeys(prev => ({ ...prev, [code]: false }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key: keyName, bubbles: true }));
  };

  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, MAX_RADIUS);
    const angleRad = Math.atan2(dy, dx);
    const clampedX = Math.cos(angleRad) * clampedDist;
    const clampedY = Math.sin(angleRad) * clampedDist;

    let degrees = (angleRad * 180) / Math.PI + 90;
    if (degrees < 0) degrees += 360;

    const magNorm = clampedDist / MAX_RADIUS;
    const normX = clampedX / MAX_RADIUS;
    const normY = -clampedY / MAX_RADIUS;

    setKnobPos({ x: clampedX, y: clampedY });
    setAngleDeg(Math.round(degrees));
    setMagnitude(Math.round(magNorm * 100));

    setJoystickAxis({ x: normX, y: normY });

    if (normY > 0.35) pressKey('KeyW', 'W');
    else releaseKey('KeyW', 'W');

    if (normY < -0.35) pressKey('KeyS', 'S');
    else releaseKey('KeyS', 'S');

    if (normX < -0.35) pressKey('KeyA', 'A');
    else releaseKey('KeyA', 'A');

    if (normX > 0.35) pressKey('KeyD', 'D');
    else releaseKey('KeyD', 'D');
  };

  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch && touchIdRef.current === null) {
      touchIdRef.current = touch.identifier;
      setIsActive(true);
      updateJoystickFromPoint(touch.clientX, touch.clientY);
    }
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystickFromPoint(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsActive(false);
        setKnobPos({ x: 0, y: 0 });
        setMagnitude(0);
        setJoystickAxis({ x: 0, y: 0 });
        releaseKey('KeyW', 'W');
        releaseKey('KeyS', 'S');
        releaseKey('KeyA', 'A');
        releaseKey('KeyD', 'D');
        break;
      }
    }
  };

  // Primary Bullet Fire
  const handleShootStart = () => {
    pressKey('KeyJ', 'j');
  };
  const handleShootEnd = () => {
    releaseKey('KeyJ', 'j');
  };

  // Secondary Laser Beam Fire (3s cooldown)
  const handleLaserStart = () => {
    if (laserCooldownRemaining <= 0.05) {
      pressKey('KeyK', 'k');
    }
  };
  const handleLaserEnd = () => {
    releaseKey('KeyK', 'k');
  };

  // Special Solar Beam Fire (10s cooldown)
  const handleSolarStart = () => {
    if (solarCooldownRemaining <= 0.05) {
      pressKey('KeyL', 'l');
    }
  };
  const handleSolarEnd = () => {
    releaseKey('KeyL', 'l');
  };

  // Manual Reload
  const handleReload = () => {
    pressKey('KeyR', 'r');
    setTimeout(() => releaseKey('KeyR', 'r'), 100);
  };

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStartCamera = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMoveCamera = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    window.dispatchEvent(
      new MouseEvent('mousemove', {
        movementX: deltaX * 1.5,
        movementY: deltaY * 1.5,
        bubbles: true
      })
    );
  };

  const handleTouchEndCamera = () => {
    touchStartPos.current = null;
  };

  if (!isTouchDevice) return null;

  const laserReady = laserCooldownRemaining <= 0.05;
  const solarReady = solarCooldownRemaining <= 0.05;

  return (
    <>
      <div
        className="fixed inset-x-0 top-16 bottom-56 z-10 pointer-events-auto touch-none opacity-0"
        onTouchStart={handleTouchStartCamera}
        onTouchMove={handleTouchMoveCamera}
        onTouchEnd={handleTouchEndCamera}
      />

      <div className="fixed inset-x-0 bottom-3 z-30 pointer-events-none px-3 sm:px-6 flex justify-between items-end font-mono select-none">
        
        {/* Left Side: 360° Joystick + Elevation Flight */}
        <div className="pointer-events-auto flex items-end gap-2.5">
          <div className="flex flex-col items-center">
            <div className="text-[9px] text-cyan-400 font-bold mb-1 px-2 py-0.5 rounded-full bg-black/60 border border-cyan-800/60 backdrop-blur-sm flex items-center gap-1.5 shadow-md">
              <Compass size={11} className={isActive ? 'text-cyan-300 animate-spin-slow' : 'text-gray-500'} />
              <span>{isActive ? `${angleDeg}°` : '360° STICK'}</span>
              <span className="text-gray-500">|</span>
              <span className={magnitude > 60 ? 'text-amber-300' : 'text-cyan-300'}>{magnitude}%</span>
            </div>

            <div
              ref={joystickBaseRef}
              onTouchStart={handleJoystickTouchStart}
              onTouchMove={handleJoystickTouchMove}
              onTouchEnd={handleJoystickTouchEnd}
              onTouchCancel={handleJoystickTouchEnd}
              className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 bg-gradient-to-b from-black/85 via-slate-950/80 to-black/90 backdrop-blur-md p-1 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center touch-none select-none transition-colors ${
                isActive ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.45)]' : 'border-cyan-500/40'
              }`}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none p-1" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
                <circle cx="80" cy="80" r="28" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" />
                <line x1="80" y1="6" x2="80" y2="154" stroke="rgba(6, 182, 212, 0.18)" strokeWidth="1" />
                <line x1="6" y1="80" x2="154" y2="80" stroke="rgba(6, 182, 212, 0.18)" strokeWidth="1" />
              </svg>

              <div
                style={{
                  transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
                  transition: isActive ? 'none' : 'transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                }}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing ${
                  isActive
                    ? 'bg-gradient-to-tr from-cyan-600 via-sky-500 to-cyan-300 border-white text-white shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-105'
                    : 'bg-gradient-to-tr from-gray-900 via-slate-800 to-gray-900 border-cyan-400/60 text-cyan-300'
                }`}
              >
                <div
                  style={{
                    transform: `rotate(${angleDeg}deg)`,
                    transition: isActive ? 'none' : 'transform 0.18s ease-out'
                  }}
                  className="flex flex-col items-center pointer-events-none"
                >
                  <div className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] ${
                    isActive ? 'border-b-white' : 'border-b-cyan-400'
                  }`} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Elevation Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onTouchStart={(e) => { e.stopPropagation(); pressKey('Space', ' '); }}
              onTouchEnd={(e) => { e.stopPropagation(); releaseKey('Space', ' '); }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-lg transition-all ${
                activeKeys['Space']
                  ? 'bg-cyan-500 text-white border-white scale-95 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-black/85 border-cyan-500/60 text-cyan-300'
              }`}
            >
              <ChevronUp size={20} />
              <span>UP</span>
            </button>

            <button
              onTouchStart={(e) => { e.stopPropagation(); pressKey('KeyC', 'c'); }}
              onTouchEnd={(e) => { e.stopPropagation(); releaseKey('KeyC', 'c'); }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-lg transition-all ${
                activeKeys['KeyC']
                  ? 'bg-cyan-500 text-white border-white scale-95 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-black/85 border-cyan-500/60 text-cyan-300'
              }`}
            >
              <ChevronDown size={20} />
              <span>DOWN</span>
            </button>
          </div>
        </div>

        {/* Right Side: 3 Combat Weapons (Bullet, Laser, Solar) + Tactical Strip */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5 sm:gap-3 touch-none">
          
          {/* Tactical Strip */}
          <div className="flex items-center gap-2 sm:gap-2.5 bg-black/60 p-1 rounded-2xl border border-gray-800/80 backdrop-blur-md shadow-xl">
            <button
              onTouchStart={(e) => { e.stopPropagation(); pressKey('ShiftLeft', 'Shift'); }}
              onTouchEnd={(e) => { e.stopPropagation(); releaseKey('ShiftLeft', 'Shift'); }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-md transition-all ${
                activeKeys['ShiftLeft']
                  ? 'bg-amber-500 text-white border-white shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-95'
                  : 'bg-black/80 border-amber-500/60 text-amber-300'
              }`}
            >
              <Flame size={15} />
              <span>BOOST</span>
            </button>

            <button
              onTouchStart={(e) => { e.stopPropagation(); pressKey('KeyX', 'x'); }}
              onTouchEnd={(e) => { e.stopPropagation(); releaseKey('KeyX', 'x'); }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-md transition-all ${
                activeKeys['KeyX']
                  ? 'bg-rose-500 text-white border-white shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-95'
                  : 'bg-black/80 border-rose-500/60 text-rose-300'
              }`}
            >
              <Shield size={15} />
              <span>BRAKE</span>
            </button>

            <button
              onTouchStart={(e) => { e.stopPropagation(); handleReload(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-sky-400/60 bg-black/80 text-sky-300 flex flex-col items-center justify-center text-[8px] font-bold shadow-md active:scale-95"
            >
              <RotateCcw size={15} />
              <span>RELOAD</span>
            </button>

            <button
              onTouchStart={(e) => { e.stopPropagation(); setMapOpen(!isMapOpen); nexusAudio.playClick(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-sky-400/60 bg-black/80 text-sky-300 flex flex-col items-center justify-center text-[8px] font-bold shadow-md active:scale-95"
            >
              <MapIcon size={15} />
              <span>MAP</span>
            </button>
          </div>

          {/* Attacks Row: Solar Beam + Laser Beam + Rapid Bullet */}
          <div className="flex items-center gap-2.5 sm:gap-3 pr-1">
            
            {/* Weapon 3: Solar Beam (30 HP, 10s cooldown) */}
            <div className="flex flex-col items-center">
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleSolarStart(); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleSolarEnd(); }}
                disabled={!solarReady}
                className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 flex flex-col items-center justify-center font-bold shadow-xl transition-all ${
                  solarReady
                    ? 'bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-300 border-white text-white shadow-[0_0_20px_rgba(249,115,22,0.8)] active:scale-95'
                    : 'bg-black/85 border-gray-700/80 text-gray-500 opacity-60'
                }`}
              >
                <Sun size={18} className={solarReady ? 'animate-spin-slow' : ''} />
                {solarReady ? (
                  <span className="text-[7.5px] font-black tracking-wider uppercase">READY</span>
                ) : (
                  <span className="text-[9px] font-black text-orange-400">
                    {solarCooldownRemaining.toFixed(1)}s
                  </span>
                )}
              </button>
              <span className="text-[7.5px] font-bold text-orange-300 mt-0.5 uppercase tracking-wider">
                SOLAR (30)
              </span>
            </div>

            {/* Weapon 2: Laser Beam (12 HP, 3s cooldown) */}
            <div className="flex flex-col items-center">
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleLaserStart(); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleLaserEnd(); }}
                disabled={!laserReady}
                className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 flex flex-col items-center justify-center font-bold shadow-xl transition-all ${
                  laserReady
                    ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 border-white text-white shadow-[0_0_20px_rgba(245,158,11,0.7)] active:scale-95'
                    : 'bg-black/85 border-gray-700/80 text-gray-500 opacity-60'
                }`}
              >
                <Zap size={18} className={laserReady ? 'animate-bounce' : ''} />
                {laserReady ? (
                  <span className="text-[7.5px] font-black tracking-wider uppercase">READY</span>
                ) : (
                  <span className="text-[9px] font-black text-amber-400">
                    {laserCooldownRemaining.toFixed(1)}s
                  </span>
                )}
              </button>
              <span className="text-[7.5px] font-bold text-amber-300 mt-0.5 uppercase tracking-wider">
                LASER (12)
              </span>
            </div>

            {/* Weapon 1: Rapid Plasma Bullet (2 HP, 30 ammo, 2s reload) */}
            <div className="flex flex-col items-center">
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleShootStart(); }}
                onTouchEnd={(e) => { e.stopPropagation(); handleShootEnd(); }}
                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-white text-white flex flex-col items-center justify-center font-black shadow-[0_0_25px_rgba(239,68,68,0.7)] active:scale-95 transition-transform cursor-pointer ${
                  isReloading
                    ? 'bg-gradient-to-tr from-gray-700 to-gray-900 border-red-500'
                    : 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500'
                }`}
              >
                <Crosshair size={22} className="animate-spin-slow" />
                <span className="text-[9px] tracking-wider uppercase font-black">
                  {isReloading ? 'RELOAD' : `${ammo}/30`}
                </span>
              </button>
              <span className="text-[8px] font-bold text-red-300 mt-0.5 uppercase tracking-wider">
                BULLET (2)
              </span>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};
