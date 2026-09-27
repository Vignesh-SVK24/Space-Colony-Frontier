import { useState, useEffect, useRef, type FC } from 'react';
import {
  Zap,
  Shield,
  Crosshair,
  ChevronUp,
  ChevronDown,
  Map as MapIcon,
  Flame,
  Maximize,
  Minimize,
  Compass
} from 'lucide-react';
import { nexusAudio } from '../../../../utils/nexusAudio';
import { useMultiplayerStore } from '../../../../multiplayer/useMultiplayerStore';
import { toggleFullscreen, useFullscreen } from '../../../../utils/fullscreenHelper';

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
  const isMapOpen = useMultiplayerStore(state => state.isMapOpen);
  const setMapOpen = useMultiplayerStore(state => state.setMapOpen);
  const { isFullscreen } = useFullscreen();

  // Maximum joystick travel radius in pixels
  const MAX_RADIUS = 54;

  // Touch device check (Desktop without touch MUST NOT render this)
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

  // =========================================================================
  // 360-DEGREE ROTATABLE JOYSTICK TOUCH HANDLERS
  // =========================================================================
  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp to MAX_RADIUS
    const clampedDist = Math.min(dist, MAX_RADIUS);
    const angleRad = Math.atan2(dy, dx);
    const clampedX = Math.cos(angleRad) * clampedDist;
    const clampedY = Math.sin(angleRad) * clampedDist;

    // Degrees: 0 at top (North / Forward), clockwise
    let degrees = (angleRad * 180) / Math.PI + 90;
    if (degrees < 0) degrees += 360;

    const magNorm = clampedDist / MAX_RADIUS;
    const normX = clampedX / MAX_RADIUS; // -1 (left) to +1 (right)
    const normY = -clampedY / MAX_RADIUS; // +1 (forward) to -1 (reverse)

    setKnobPos({ x: clampedX, y: clampedY });
    setAngleDeg(Math.round(degrees));
    setMagnitude(Math.round(magNorm * 100));

    // Update global store for 360-degree analog spaceship flight
    setJoystickAxis({ x: normX, y: normY });

    // Fallback simulated keyboard keys for backward compatibility
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

        // Release all synthetic movement keys
        releaseKey('KeyW', 'W');
        releaseKey('KeyS', 'S');
        releaseKey('KeyA', 'A');
        releaseKey('KeyD', 'D');
        break;
      }
    }
  };

  // Mouse drag support for developer testing
  const isMouseDownRef = useRef(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    setIsActive(true);
    updateJoystickFromPoint(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDownRef.current) {
      updateJoystickFromPoint(e.clientX, e.clientY);
    }
  };
  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      setMagnitude(0);
      setJoystickAxis({ x: 0, y: 0 });
      releaseKey('KeyW', 'W');
      releaseKey('KeyS', 'S');
      releaseKey('KeyA', 'A');
      releaseKey('KeyD', 'D');
    }
  };

  // Primary Blaster Fire
  const handleShootStart = () => {
    pressKey('KeyJ', 'j');
  };
  const handleShootEnd = () => {
    releaseKey('KeyJ', 'j');
  };

  // Secondary Laser Beam Fire (5s cooldown)
  const handleLaserStart = () => {
    if (laserCooldownRemaining <= 0.05) {
      pressKey('KeyK', 'k');
    }
  };
  const handleLaserEnd = () => {
    releaseKey('KeyK', 'k');
  };

  // Camera Drag Touchpad Tracking
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

  // Strict check: if not a touch device or desktop size, do not render
  if (!isTouchDevice) return null;

  const laserReady = laserCooldownRemaining <= 0.05;

  return (
    <>
      {/* Upper/Center Camera Drag Area for 3D Camera Look */}
      <div
        className="fixed inset-x-0 top-16 bottom-56 z-10 pointer-events-auto touch-none opacity-0"
        onTouchStart={handleTouchStartCamera}
        onTouchMove={handleTouchMoveCamera}
        onTouchEnd={handleTouchEndCamera}
      />

      {/* Mobile Touch Overlay Controls */}
      <div className="fixed inset-x-0 bottom-3 z-30 pointer-events-none px-3 sm:px-6 flex justify-between items-end font-mono select-none">
        
        {/* Left Side: 360° Rotatable Analog Joystick + Vertical Elevation Flight */}
        <div className="pointer-events-auto flex items-end gap-2.5">
          
          {/* Enhanced 360-Degree Floating / Rotatable Analog Joystick Base */}
          <div className="flex flex-col items-center">
            
            {/* Live Rotational Compass & Power Telemetry */}
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
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full border-2 bg-gradient-to-b from-black/85 via-slate-950/80 to-black/90 backdrop-blur-md p-1 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center touch-none select-none transition-colors ${
                isActive ? 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.45)]' : 'border-cyan-500/40'
              }`}
            >
              {/* Outer 360° Degree Markings & Compass Ring */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none p-1" viewBox="0 0 160 160">
                {/* Outer dashed ring */}
                <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1" />
                <circle cx="80" cy="80" r="28" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" />

                {/* Cardinal Axes */}
                <line x1="80" y1="6" x2="80" y2="154" stroke="rgba(6, 182, 212, 0.18)" strokeWidth="1" />
                <line x1="6" y1="80" x2="154" y2="80" stroke="rgba(6, 182, 212, 0.18)" strokeWidth="1" />

                {/* Cardinal Labels */}
                <text x="80" y="16" fill="rgba(6, 182, 212, 0.8)" fontSize="8" fontWeight="bold" textAnchor="middle">FWD</text>
                <text x="80" y="152" fill="rgba(6, 182, 212, 0.6)" fontSize="7" fontWeight="bold" textAnchor="middle">REV</text>
                <text x="14" y="83" fill="rgba(6, 182, 212, 0.6)" fontSize="7" fontWeight="bold" textAnchor="middle">L</text>
                <text x="147" y="83" fill="rgba(6, 182, 212, 0.6)" fontSize="7" fontWeight="bold" textAnchor="middle">R</text>

                {/* Real-time Center-to-Knob Vector Ray */}
                {isActive && (
                  <line
                    x1="80"
                    y1="80"
                    x2={80 + knobPos.x * (80 / 70)}
                    y2={80 + knobPos.y * (80 / 70)}
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                )}
              </svg>

              {/* Dynamic 360° Rotatable Thumb Puck */}
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
                {/* Directional Chevron pointing along current rotation */}
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

          {/* Vertical Flight Controls (Ascend / Descend) */}
          <div className="flex flex-col gap-2">
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                pressKey('Space', ' ');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                releaseKey('Space', ' ');
              }}
              onMouseDown={() => pressKey('Space', ' ')}
              onMouseUp={() => releaseKey('Space', ' ')}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-lg transition-all ${
                activeKeys['Space']
                  ? 'bg-cyan-500 text-white border-white scale-95 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-black/85 border-cyan-500/60 text-cyan-300'
              }`}
              title="Ascend (Flight Level Up)"
            >
              <ChevronUp size={20} />
              <span>UP</span>
            </button>

            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                pressKey('KeyC', 'c');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                releaseKey('KeyC', 'c');
              }}
              onMouseDown={() => pressKey('KeyC', 'c')}
              onMouseUp={() => releaseKey('KeyC', 'c')}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-lg transition-all ${
                activeKeys['KeyC']
                  ? 'bg-cyan-500 text-white border-white scale-95 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-black/85 border-cyan-500/60 text-cyan-300'
              }`}
              title="Descend (Flight Level Down)"
            >
              <ChevronDown size={20} />
              <span>DOWN</span>
            </button>
          </div>

        </div>

        {/* Right Side: Responsive Combat Attack Hub & Tactical Strip */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5 sm:gap-3 touch-none">
          
          {/* Tactical Strip: Boost, Brake, Map, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-2.5 bg-black/60 p-1 rounded-2xl border border-gray-800/80 backdrop-blur-md shadow-xl">
            {/* Boost Button */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                pressKey('ShiftLeft', 'Shift');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                releaseKey('ShiftLeft', 'Shift');
              }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-md transition-all ${
                activeKeys['ShiftLeft']
                  ? 'bg-amber-500 text-white border-white shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-95'
                  : 'bg-black/80 border-amber-500/60 text-amber-300'
              }`}
              title="Afterburner Boost"
            >
              <Flame size={15} />
              <span>BOOST</span>
            </button>

            {/* Brake Button */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                pressKey('KeyX', 'x');
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                releaseKey('KeyX', 'x');
              }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold shadow-md transition-all ${
                activeKeys['KeyX']
                  ? 'bg-rose-500 text-white border-white shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-95'
                  : 'bg-black/80 border-rose-500/60 text-rose-300'
              }`}
              title="Space Brake"
            >
              <Shield size={15} />
              <span>BRAKE</span>
            </button>

            {/* Tactical Map Button */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                setMapOpen(!isMapOpen);
                nexusAudio.playClick();
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-sky-400/60 bg-black/80 text-sky-300 flex flex-col items-center justify-center text-[8px] font-bold shadow-md active:scale-95"
              title="Open Tactical Map"
            >
              <MapIcon size={15} />
              <span>MAP</span>
            </button>

            {/* Fullscreen Button (Hide Address Bar) */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation();
                toggleFullscreen();
                nexusAudio.playClick();
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-gray-600/70 bg-black/80 text-gray-300 flex flex-col items-center justify-center text-[7.5px] font-bold shadow-md active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Hide address bar)'}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              <span>{isFullscreen ? 'WIN' : 'FULL'}</span>
            </button>
          </div>

          {/* Attacks Row: Secondary 5s Laser Beam + Primary Plasma Blaster */}
          <div className="flex items-center gap-3 sm:gap-4 pr-1">
            
            {/* Secondary Weapon: 5.0s Laser Beam Button */}
            <div className="flex flex-col items-center">
              <button
                onTouchStart={(e) => {
                  e.stopPropagation();
                  handleLaserStart();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleLaserEnd();
                }}
                disabled={!laserReady}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center font-bold shadow-xl transition-all ${
                  laserReady
                    ? 'bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 border-white text-white shadow-[0_0_20px_rgba(245,158,11,0.7)] active:scale-95'
                    : 'bg-black/85 border-gray-700/80 text-gray-500 opacity-60'
                }`}
              >
                <Zap size={20} className={laserReady ? 'animate-bounce' : ''} />
                {laserReady ? (
                  <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-wider uppercase">READY</span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-black text-amber-400">
                    {laserCooldownRemaining.toFixed(1)}s
                  </span>
                )}
              </button>
              <span className="text-[8px] font-bold text-amber-300 mt-1 uppercase tracking-wider">
                LASER (5s)
              </span>
            </div>

            {/* Primary Weapon: Rapid Plasma Blaster Button */}
            <div className="flex flex-col items-center">
              <button
                onTouchStart={(e) => {
                  e.stopPropagation();
                  handleShootStart();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleShootEnd();
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 border-2 border-white text-white flex flex-col items-center justify-center font-black shadow-[0_0_25px_rgba(239,68,68,0.7)] active:scale-95 transition-transform cursor-pointer"
              >
                <Crosshair size={26} className="animate-spin-slow" />
                <span className="text-[10px] sm:text-xs tracking-wider uppercase font-black">FIRE</span>
              </button>
              <span className="text-[8px] font-bold text-red-300 mt-1 uppercase tracking-wider">
                BLASTER
              </span>
            </div>

          </div>

        </div>

      </div>
    </>
  );
};
