import React, { useState } from 'react';
import { useMultiplayerStore } from '../../multiplayer/useMultiplayerStore';
import { BattleColor } from '../../multiplayer/types';
import { nexusAudio } from '../../utils/nexusAudio';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  LogOut, 
  Award, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

const CHASSIS_CONFIG: Record<BattleColor, { hex: string; label: string }> = {
  yellow: { hex: '#FFCC00', label: 'Solar Vanguard' },
  blue: { hex: '#8CCDEB', label: 'Frost Interceptor' },
  red: { hex: '#ef4444', label: 'Crimson Raptor' },
  green: { hex: '#107E57', label: 'Emerald Phantom' }
};

export const PilotAuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authUser, 
    loginPilot, 
    registerPilot, 
    logoutPilot,
    playerColor,
    setPlayerColor
  } = useMultiplayerStore();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedColor, setSelectedColor] = useState<BattleColor>(playerColor);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Please enter a pilot callsign');
      return;
    }
    if (cleanUser.length < 3 || cleanUser.length > 15) {
      setErrorMessage('Callsign must be 3-15 characters (letters, numbers, _ -)');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Security password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    nexusAudio.playConfirm();

    if (mode === 'LOGIN') {
      const res = await loginPilot(cleanUser, password);
      setSubmitting(false);
      if (res.success) {
        setSuccessMessage('Pilot authenticated. Security clearance granted.');
        setTimeout(() => setAuthModalOpen(false), 900);
      } else {
        setErrorMessage(res.error || 'Authentication failure. Check callsign or password.');
      }
    } else {
      const res = await registerPilot(cleanUser, password, selectedColor);
      setSubmitting(false);
      if (res.success) {
        setSuccessMessage('Pilot registered and encrypted token stored.');
        setTimeout(() => setAuthModalOpen(false), 900);
      } else {
        setErrorMessage(res.error || 'Registration failed. Callsign may already be taken.');
      }
    }
  };

  const handleLogout = async () => {
    nexusAudio.playClick(900);
    await logoutPilot();
    setSuccessMessage('Pilot signed out. Default guest access enabled.');
    setTimeout(() => {
      setSuccessMessage(null);
      setAuthModalOpen(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#05070B]/85 backdrop-blur-md font-mono select-none">
      <div 
        className="relative w-full max-w-md bg-[#061A35] border-2 border-[#8CCDEB]/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(140,205,235,0.25)] text-[#F4F7FA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#8CCDEB]/25">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#08264A] border border-[#8CCDEB]/40 text-[#8CCDEB]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wider text-white">
                PILOT SECURITY DOSSIER
              </h3>
              <p className="text-[10px] text-[#8CCDEB]/80 tracking-widest uppercase">
                FRONTIER DEFENSE COMMAND
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#08264A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* If Already Logged In: Show Profile & Dossier */}
        {authUser && !authUser.isGuest ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#05070B] border border-[#8CCDEB]/30 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#08264A] border border-[#FFCC00]/50 flex items-center justify-center text-[#FFCC00] font-black text-xl shadow-[0_0_12px_rgba(255,204,0,0.3)]">
                {authUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white truncate">
                    {authUser.username}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#107E57]/40 border border-[#107E57] text-[#34d399] font-bold uppercase tracking-wider">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-[#8CCDEB]/80">
                  Role: <span className="text-[#FFCC00] uppercase font-bold">{authUser.role || 'Pilot'}</span>
                </p>
              </div>
            </div>

            {authUser.stats && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-[#08264A]/60 border border-[#8CCDEB]/20">
                  <div className="text-[10px] text-[#8CCDEB]/70 uppercase">Sorties</div>
                  <div className="text-sm font-black text-white">{authUser.stats.matchesPlayed}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#08264A]/60 border border-[#8CCDEB]/20">
                  <div className="text-[10px] text-[#8CCDEB]/70 uppercase">Victories</div>
                  <div className="text-sm font-black text-[#FFCC00]">{authUser.stats.matchesWon}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#08264A]/60 border border-[#8CCDEB]/20">
                  <div className="text-[10px] text-[#8CCDEB]/70 uppercase">Eliminations</div>
                  <div className="text-sm font-black text-emerald-400">{authUser.stats.kills}</div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#08264A] hover:bg-[#0B315A] border border-[#8CCDEB]/40 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Close Dossier
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login / Registration Form */
          <div>
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 mb-4 rounded-xl bg-[#05070B] border border-[#8CCDEB]/30">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                  mode === 'LOGIN'
                    ? 'bg-[#08264A] text-[#FFCC00] shadow-[0_0_10px_rgba(255,204,0,0.25)] border border-[#FFCC00]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                  mode === 'REGISTER'
                    ? 'bg-[#08264A] text-[#FFCC00] shadow-[0_0_10px_rgba(255,204,0,0.25)] border border-[#FFCC00]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register Recruit
              </button>
            </div>

            {/* Status alerts */}
            {errorMessage && (
              <div className="p-2.5 mb-3 rounded-lg bg-red-950/60 border border-red-500/60 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400 shrink-0" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 mb-3 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="leading-tight">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Callsign Input */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  <User size={12} className="text-[#FFCC00]" />
                  <span>Pilot Callsign</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Maverick_99"
                  maxLength={15}
                  required
                  className="w-full bg-[#05070B] border border-[#8CCDEB]/40 focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] px-3 py-2 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono"
                />
                <span className="text-[9px] text-slate-400 mt-0.5 block">
                  3-15 alphanumeric characters or underscore/hyphen.
                </span>
              </div>

              {/* Password Input */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#8CCDEB] mb-1">
                  <Lock size={12} className="text-[#FFCC00]" />
                  <span>Security Password</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    required
                    className="w-full bg-[#05070B] border border-[#8CCDEB]/40 focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] px-3 py-2 pr-9 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Preferred Chassis Paint for Registration */}
              {mode === 'REGISTER' && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8CCDEB] mb-1 block">
                    Preferred Chassis Paint
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(CHASSIS_CONFIG) as BattleColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c);
                          setPlayerColor(c);
                        }}
                        className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase flex flex-col items-center gap-1 transition-all ${
                          selectedColor === c
                            ? 'border-[#FFCC00] bg-[#FFB000]/20 text-[#FFCC00]'
                            : 'border-[#08264A] bg-[#05070B] text-slate-400'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHASSIS_CONFIG[c].hex }} />
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FFB000] to-[#FFCC00] text-[#05070B] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,204,0,0.35)] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : mode === 'LOGIN' ? (
                  <>
                    <ShieldCheck size={14} />
                    <span>Authorize Pilot</span>
                  </>
                ) : (
                  <>
                    <Award size={14} />
                    <span>Register Callsign</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-slate-400 pt-1">
                {mode === 'LOGIN' 
                  ? 'Unauthenticated recruits can still deploy instantly as Guest Cadets.' 
                  : 'Pass-hashes are securely salted with bcrypt-12 on the authoritative server.'}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
