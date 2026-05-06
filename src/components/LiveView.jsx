import React, { useState, useMemo } from 'react';
import {
  Settings, Home, Volume2, VolumeX, RefreshCw, Trophy, Play,
  ChevronLeft, ChevronRight, Eye, EyeOff, Shield
} from 'lucide-react';
import { GradientBtn, getTheme, THEMES_MAP } from './RaffleCard.jsx';

/* ─── Helpers ────────────────────────────────────────── */
function winnerFontSize(text) {
  if (!text) return 'text-5xl md:text-7xl';
  if (text.length < 12) return 'text-5xl md:text-7xl';
  if (text.length < 22) return 'text-4xl md:text-5xl';
  if (text.length < 36) return 'text-3xl md:text-4xl';
  return 'text-2xl md:text-3xl';
}

/* ─── Ready Step ─────────────────────────────────────── */
function ReadyStep({ title, logo, participants, config, theme, accent, isDone, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center px-6 anim-fadeInUp max-w-2xl">
      {/* Logo or icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full"
          style={{ background: `${accent}20`, filter: 'blur(60px)', transform: 'scale(1.5)' }} />
        {logo ? (
          <img src={logo} alt="Logo" className="h-24 md:h-32 w-auto object-contain relative z-10 drop-shadow-2xl"
            style={{ filter: config.whiteLogo ? 'brightness(0) invert(1)' : 'none' }} />
        ) : (
          <Trophy size={72} className="relative z-10 drop-shadow-2xl anim-breathe"
            style={{ color: accent }} />
        )}
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none text-gradient">
        {title}
      </h1>

      {/* Stats */}
      <div className="flex items-center gap-0 glass rounded-2xl overflow-hidden">
        <div className="px-8 py-4 border-r border-white/10">
          <div className="text-3xl font-black text-white">{participants.length}</div>
          <div className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">Participantes</div>
        </div>
        <div className="px-8 py-4">
          <div className="text-3xl font-black text-white">{config.numWinners || 1}</div>
          <div className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">Ganadores</div>
        </div>
        {(config.numSubstitutes || 0) > 0 && (
          <div className="px-8 py-4 border-l border-white/10">
            <div className="text-3xl font-black text-white">{config.numSubstitutes}</div>
            <div className="text-[11px] text-white/40 uppercase tracking-wider mt-0.5">Suplentes</div>
          </div>
        )}
      </div>

      {/* CTA */}
      {isDone ? (
        <div className="px-8 py-3.5 rounded-full glass border border-green-500/30 text-green-400 text-sm font-semibold">
          Resultados registrados
        </div>
      ) : (
        <button onClick={onStart}
          className="group relative px-14 py-5 rounded-full font-black text-xl text-white transition-all duration-300
            hover:scale-105 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
            boxShadow: `0 0 60px ${accent}50, 0 20px 60px rgba(0,0,0,0.5)`,
          }}>
          <span className="flex items-center gap-3 relative z-10">
            <Play fill="currentColor" size={22} />COMENZAR
          </span>
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
        </button>
      )}
    </div>
  );
}

/* ─── Countdown Step ─────────────────────────────────── */
function CountdownStep({ countdown, randomName, numWinners, accent }) {
  return (
    <div className="flex flex-col items-center gap-10 anim-fadeIn">
      {/* Circle timer */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        <div className="absolute inset-0 rounded-full glass-deep flex items-center justify-center">
          <span key={countdown} className="text-8xl font-black text-white tabular-nums anim-numberPop leading-none">
            {countdown}
          </span>
        </div>
        {/* Spinning accent ring */}
        <div className="absolute inset-0 rounded-full anim-spin-slow" style={{
          background: `conic-gradient(from 0deg, ${accent}, transparent 70%)`,
          padding: 3,
          maskImage: 'radial-gradient(circle, transparent 90px, black 91px)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 90px, black 91px)',
        }} />
      </div>

      {/* Scrolling name */}
      <div className="glass-deep rounded-3xl px-12 py-8 text-center max-w-2xl w-full mx-4">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] mb-4"
          style={{ color: accent }}>
          {numWinners > 1 ? 'Seleccionando ganadores…' : 'Seleccionando ganador…'}
        </p>
        <div className="text-4xl md:text-6xl font-black text-white italic tracking-tight truncate anim-glitch">
          {randomName}
        </div>
      </div>
    </div>
  );
}

/* ─── Results Step ───────────────────────────────────── */
function ResultsStep({ winners, substitutes, config, theme, accent, onNav, currentWinnerIndex }) {
  const [showSubs, setShowSubs] = useState(false);

  /* Individual mode */
  if (config.revealMode === 'individual') {
    const winner = winners[currentWinnerIndex];
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl px-4 anim-fadeInUp">
        {/* Badge */}
        <div className="glass rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.4em]"
          style={{ color: accent }}>
          {winners.length > 1 ? '¡Ganadores Oficiales!' : '¡Felicidades!'}
        </div>

        {/* Winner card — Liquid Glass */}
        <div
          key={currentWinnerIndex}
          className="w-full rounded-[2rem] p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 anim-winner relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: `1px solid rgba(255,255,255,0.18)`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.6), 0 0 100px ${accent}30`,
          }}
        >
          {/* Inner top highlight */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
          {/* Accent glow blob */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: `${accent}20`, filter: 'blur(60px)' }} />

          <div className="w-24 h-24 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl relative z-10"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)`, boxShadow: `0 8px 32px ${accent}50` }}>
            <Trophy className="text-white" size={48} />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left relative z-10">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-[0.3em] block mb-3">
              {winners.length > 1 ? `Ganador ${currentWinnerIndex + 1} de ${winners.length}` : 'Ganador oficial'}
            </span>
            <h2 className={`${winnerFontSize(winner)} font-black text-white tracking-tight leading-none break-words uppercase drop-shadow-lg`}>
              {winner}
            </h2>
          </div>
        </div>

        {/* Navigation */}
        {winners.length > 1 && (
          <div className="flex items-center gap-4 glass rounded-2xl px-6 py-3">
            <button onClick={() => onNav(-1)} disabled={currentWinnerIndex === 0}
              className="p-2 rounded-xl glass-button text-white disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-mono text-white/70 w-16 text-center">
              {currentWinnerIndex + 1} / {winners.length}
            </span>
            <button onClick={() => onNav(1)} disabled={currentWinnerIndex === winners.length - 1}
              className="p-2 rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Substitutes toggle */}
        {substitutes.length > 0 && currentWinnerIndex === winners.length - 1 && (
          <button onClick={() => setShowSubs(s => !s)}
            className="flex items-center gap-2 glass-button px-5 py-2.5 rounded-xl text-sm text-white/60 hover:text-white">
            {showSubs ? <EyeOff size={15}/> : <Eye size={15}/>}
            {showSubs ? 'Ocultar suplentes' : 'Ver suplentes'}
          </button>
        )}

        {/* Subs list */}
        {showSubs && substitutes.length > 0 && (
          <div className="w-full anim-fadeInUp">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-white/10 flex-1" />
              <span className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-widest">
                <Shield size={12}/>Suplentes
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {substitutes.map((s, i) => (
                <div key={i} className="glass-sm flex items-center gap-3 p-3.5 rounded-2xl">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px] text-white/40 font-bold flex-shrink-0">{i+1}</span>
                  <span className="text-sm text-white/70 truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Grid (all) mode */
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-5xl px-4 anim-fadeInUp pb-8">
      <div className="glass rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.4em]"
        style={{ color: accent }}>
        {winners.length > 1 ? '¡Ganadores Oficiales!' : '¡Felicidades!'}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {winners.map((w, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4 anim-fadeInUp hover:-translate-y-1 transition-transform"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>{i+1}</div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">Ganador</p>
              <p className="text-sm font-semibold text-white truncate">{w}</p>
            </div>
          </div>
        ))}
      </div>

      {substitutes.length > 0 && (
        <>
          <button onClick={() => setShowSubs(s => !s)}
            className="flex items-center gap-2 glass-button px-5 py-2.5 rounded-xl text-sm text-white/60 hover:text-white">
            {showSubs ? <EyeOff size={15}/> : <Eye size={15}/>}
            {showSubs ? 'Ocultar suplentes' : 'Ver suplentes'}
          </button>
          {showSubs && (
            <div className="w-full anim-fadeInUp">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-white/10 flex-1" />
                <span className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-widest"><Shield size={12}/>Suplentes</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {substitutes.map((s, i) => (
                  <div key={i} className="glass-sm flex items-center gap-3 p-3.5 rounded-2xl">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px] text-white/40 font-bold flex-shrink-0">{i+1}</span>
                    <span className="text-sm text-white/70 truncate">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── LiveView (main export) ─────────────────────────── */
export default function LiveView({
  raffle, title, participants, config, currentLogo,
  liveStep, countdown, randomName,
  winners, substitutes, currentWinnerIndex, setCurrentWinnerIndex,
  onStartDraw, onReset, onGoEditor, onGoHome,
  soundEnabled, setSoundEnabled,
  playSound, clickAudio, triggerCelebration,
}) {
  const theme = useMemo(() => getTheme(config), [config]);
  const accent = theme.isCustom ? theme.color : THEMES_MAP[theme.id]?.accent || '#007AFF';
  const isDone = raffle?.status === 'completed';

  const handleNav = (dir) => {
    playSound(clickAudio);
    setCurrentWinnerIndex(i => Math.min(Math.max(0, i + dir), winners.length - 1));
    if (dir > 0) triggerCelebration();
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${accent}15, transparent 70%)`,
      }} />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between z-20">
        <div className="flex gap-2">
          <button onClick={onGoEditor}
            className="glass-button px-4 py-2 rounded-full text-white/50 hover:text-white text-xs font-medium flex items-center gap-1.5 uppercase tracking-wider">
            <Settings size={13} />Config
          </button>
          <button onClick={onGoHome}
            className="glass-button px-4 py-2 rounded-full text-white/50 hover:text-white text-xs font-medium flex items-center gap-1.5 uppercase tracking-wider">
            <Home size={13} />Dashboard
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini logo */}
          {liveStep !== 'ready' && currentLogo && (
            <div className="glass p-1.5 rounded-xl">
              <img src={currentLogo} alt="" className="h-7 w-auto object-contain"
                style={{ filter: config.whiteLogo ? 'brightness(0) invert(1)' : 'none' }} />
            </div>
          )}
          {liveStep === 'results' && (
            <button onClick={onReset}
              className={`p-2.5 rounded-full glass-button text-white/50 hover:text-white ${isDone ? 'opacity-30 cursor-not-allowed' : ''}`}
              disabled={isDone} title="Nuevo sorteo">
              <RefreshCw size={17} />
            </button>
          )}
          <button onClick={() => setSoundEnabled(s => !s)}
            className="p-2.5 rounded-full glass-button text-white/50 hover:text-white">
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto pt-20 pb-6">
        {liveStep === 'ready' && (
          <ReadyStep
            title={title} logo={currentLogo} participants={participants}
            config={config} theme={theme} accent={accent} isDone={isDone}
            onStart={onStartDraw}
          />
        )}
        {liveStep === 'countdown' && (
          <CountdownStep countdown={countdown} randomName={randomName} numWinners={config.numWinners || 1} accent={accent} />
        )}
        {liveStep === 'results' && (
          <ResultsStep
            winners={winners} substitutes={substitutes}
            config={config} theme={theme} accent={accent}
            currentWinnerIndex={currentWinnerIndex} onNav={handleNav}
          />
        )}
      </div>
    </div>
  );
}
