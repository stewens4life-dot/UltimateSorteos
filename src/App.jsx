import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutGrid, ImageIcon, Volume2, VolumeX, Plus, Sparkles
} from 'lucide-react';

import { Toast, ConfirmModal, Confetti, AmbientOrbs } from './components/ui.jsx';
import { RaffleCard, NewRaffleCard, getTheme, THEMES_MAP } from './components/RaffleCard.jsx';
import EditorView from './components/EditorView.jsx';
import LiveView from './components/LiveView.jsx';

/* ─── Constants ─────────────────────────────────────── */
const DEFAULT_CONFIG = {
  numWinners: 1,
  numSubstitutes: 0,
  timerDuration: 5,
  revealMode: 'individual',
  removeWinners: false,
  colorTheme: 'blue',
  customColor: '#007AFF',
  whiteLogo: false,
};

const genId = () => Math.random().toString(36).slice(2, 11);

const blankRaffle = (n = 1) => ({
  id: genId(),
  title: n === 1 ? 'Sorteo General' : `Sorteo #${n}`,
  participants: [],
  config: { ...DEFAULT_CONFIG },
  updatedAt: Date.now(),
  status: 'draft',
  results: [],
  substitutes: [],
  logo: null,
});

/* ─── Load / Save ────────────────────────────────────── */
function loadRaffles() {
  try {
    const s = localStorage.getItem('us-raffles');
    return s ? JSON.parse(s) : [blankRaffle()];
  } catch { return [blankRaffle()]; }
}

/* ─── Audio helpers ──────────────────────────────────── */
function makeAudio(url, vol = 0.5) {
  try {
    const a = new Audio(url);
    a.volume = vol;
    a.load();
    return a;
  } catch { return null; }
}

/* ─── App ────────────────────────────────────────────── */
export default function App() {
  const [view, setView] = useState('dashboard');
  const [raffles, setRaffles] = useState(loadRaffles);
  const [currentRaffleId, setCurrentRaffleId] = useState(null);

  // Editor state
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [currentLogo, setCurrentLogo] = useState(null);

  // Live state
  const [liveStep, setLiveStep] = useState('ready');
  const [countdown, setCountdown] = useState(5);
  const [randomName, setRandomName] = useState('');
  const [winners, setWinners] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Global
  const [bgSource, setBgSource] = useState(null);
  const [bgType, setBgType] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toast, setToast] = useState({ msg: null, type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [resetModal, setResetModal] = useState({ open: false, id: null });

  // Audio
  const sfx = useRef({});
  useEffect(() => {
    sfx.current.applause = makeAudio('https://www.soundjay.com/human/sounds/applause-01.mp3', 0.5);
    sfx.current.tick     = makeAudio('https://www.soundjay.com/button/sounds/beep-07.mp3', 0.4);
    sfx.current.click    = makeAudio('https://www.soundjay.com/button/sounds/button-30.mp3', 0.3);

    const saved = localStorage.getItem('us-bg');
    const savedType = localStorage.getItem('us-bg-type');
    if (saved) { setBgSource(saved); setBgType(savedType || 'image'); }
  }, []);

  const playSound = useCallback(async (key) => {
    if (!soundEnabled) return;
    const a = sfx.current[key];
    if (!a) return;
    try { a.currentTime = 0; await a.play(); } catch {}
  }, [soundEnabled]);

  const stopSound = useCallback((key) => {
    const a = sfx.current[key];
    if (a) { a.pause(); a.currentTime = 0; }
  }, []);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  /* ─── Persistence ─────────────────────────────────── */
  useEffect(() => {
    localStorage.setItem('us-raffles', JSON.stringify(raffles));
  }, [raffles]);

  /* ─── Auto-save editor ─────────────────────────────── */
  useEffect(() => {
    if (view !== 'editor' || !currentRaffleId) return;
    const t = setTimeout(() => {
      setRaffles(prev => prev.map(r =>
        r.id === currentRaffleId
          ? { ...r, title, participants, config, logo: currentLogo, updatedAt: Date.now() }
          : r
      ));
    }, 400);
    return () => clearTimeout(t);
  }, [title, participants, config, currentLogo, view, currentRaffleId]);

  /* ─── Cleanup live sounds on leave ────────────────── */
  useEffect(() => {
    if (view !== 'live') {
      setShowConfetti(false);
      ['applause','tick','click'].forEach(stopSound);
    }
  }, [view, stopSound]);

  /* ─── Load into editor ─────────────────────────────── */
  const loadEditor = useCallback((raffle) => {
    setCurrentRaffleId(raffle.id);
    setTitle(raffle.title);
    setParticipants(raffle.participants || []);
    setConfig({ ...DEFAULT_CONFIG, ...raffle.config });
    setCurrentLogo(raffle.logo || null);
    setWinners(raffle.results || []);
    setSubstitutes(raffle.substitutes || []);
  }, []);

  /* ─── CRUD ─────────────────────────────────────────── */
  const createRaffle = useCallback(() => {
    const r = blankRaffle(raffles.length + 1);
    setRaffles(prev => [...prev, r]);
    loadEditor(r);
    setView('editor');
    showToast('Nuevo sorteo creado');
  }, [raffles.length, loadEditor, showToast]);

  const confirmDelete = useCallback(() => {
    const id = deleteModal.id;
    setRaffles(prev => {
      const next = prev.filter(r => r.id !== id);
      if (next.length === 0) {
        const def = blankRaffle();
        if (id === currentRaffleId) setTimeout(() => { loadEditor(def); setView('dashboard'); }, 0);
        return [def];
      }
      return next;
    });
    if (currentRaffleId === id && view === 'editor') { setView('dashboard'); setCurrentRaffleId(null); }
    setDeleteModal({ open: false, id: null });
    showToast('Sorteo eliminado', 'error');
  }, [deleteModal.id, currentRaffleId, view, loadEditor, showToast]);

  const confirmReset = useCallback(() => {
    setRaffles(prev => prev.map(r =>
      r.id === resetModal.id ? { ...r, status: 'draft', results: [], substitutes: [] } : r
    ));
    setResetModal({ open: false, id: null });
    showToast('Sorteo reiniciado');
  }, [resetModal.id, showToast]);

  const duplicateRaffle = useCallback((raffle, e) => {
    e.stopPropagation();
    const copy = { ...raffle, id: genId(), title: `${raffle.title} (Copia)`, updatedAt: Date.now(), status: 'draft', results: [], substitutes: [] };
    setRaffles(prev => [...prev, copy]);
    showToast('Sorteo duplicado');
  }, [showToast]);

  /* ─── Launch Live ──────────────────────────────────── */
  const launchLive = useCallback((raffle) => {
    loadEditor(raffle);
    setView('live');
    if (raffle.status === 'completed') {
      setLiveStep('results');
      setCurrentWinnerIndex(0);
      setShowConfetti(true);
      setTimeout(() => playSound('applause'), 500);
    } else {
      setLiveStep('ready');
      setWinners([]);
      setSubstitutes([]);
      setShowConfetti(false);
    }
  }, [loadEditor, playSound]);

  /* ─── Draw logic ───────────────────────────────────── */
  const startDraw = useCallback(() => {
    if (!participants.length) return;
    const total = (config.numWinners || 1) + (config.numSubstitutes || 0);
    if (participants.length < total) {
      showToast(`Necesitas al menos ${total} participantes`, 'error');
      return;
    }
    playSound('click');
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    setWinners(shuffled.slice(0, config.numWinners));
    setSubstitutes(shuffled.slice(config.numWinners, total));
    setCountdown(config.timerDuration || 5);
    setLiveStep('countdown');
    setCurrentWinnerIndex(0);
    setShowConfetti(false);
    playSound('tick');
  }, [participants, config, playSound, showToast]);

  const triggerCelebration = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => playSound('applause'), 100);
  }, [playSound]);

  const resetLive = useCallback(() => {
    playSound('click');
    stopSound('applause');
    stopSound('tick');
    setLiveStep('ready');
    setWinners([]);
    setSubstitutes([]);
    setShowConfetti(false);
  }, [playSound, stopSound]);

  /* ─── Countdown effect ─────────────────────────────── */
  useEffect(() => {
    if (view !== 'live' || liveStep !== 'countdown') return;

    const roll = setInterval(() => {
      if (participants.length > 0) setRandomName(participants[Math.floor(Math.random() * participants.length)]);
    }, 30);

    if (countdown > 0) {
      const tick = setTimeout(() => {
        setCountdown(c => c - 1);
        if (countdown > 1) playSound('tick');
      }, 1000);
      return () => { clearTimeout(tick); clearInterval(roll); };
    } else {
      clearInterval(roll);
      setLiveStep('results');
      triggerCelebration();
      if (currentRaffleId) {
        setRaffles(prev => prev.map(r =>
          r.id === currentRaffleId
            ? { ...r, status: 'completed', results: winners, substitutes, completedAt: Date.now() }
            : r
        ));
      }
      if (config.removeWinners) {
        setParticipants(prev => prev.filter(p => !winners.includes(p)));
      }
    }
    return () => clearInterval(roll);
  }, [view, liveStep, countdown, participants, winners, substitutes, currentRaffleId, config.removeWinners, playSound, triggerCelebration]);

  /* ─── Background upload ────────────────────────────── */
  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        localStorage.setItem('us-bg', ev.target.result);
        localStorage.setItem('us-bg-type', file.type.startsWith('video/') ? 'video' : 'image');
      } catch {}
      setBgSource(ev.target.result);
      setBgType(file.type.startsWith('video/') ? 'video' : 'image');
      showToast('Fondo actualizado');
    };
    reader.readAsDataURL(file);
  };

  const currentRaffle = raffles.find(r => r.id === currentRaffleId);
  const theme = getTheme(config);

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-[#060608] text-white select-none overflow-hidden relative">

      {/* Ambient background */}
      <AmbientOrbs theme={theme} />

      {/* Custom background */}
      {bgSource && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {bgType === 'video'
            ? <video src={bgSource} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30" />
            : <div className="w-full h-full bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${bgSource})` }} />}
          <div className="absolute inset-0 bg-[#060608]/70" />
        </div>
      )}

      {/* Dot grid texture */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none z-0" />

      {/* Confetti */}
      <Confetti active={showConfetti} />

      {/* Toast */}
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: null, type: 'success' })} />

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="¿Eliminar sorteo?"
        message="Se perderá toda la configuración y resultados. Esta acción no puede deshacerse."
        confirmText="Eliminar"
        danger
      />
      <ConfirmModal
        isOpen={resetModal.open}
        onClose={() => setResetModal({ open: false, id: null })}
        onConfirm={confirmReset}
        title="¿Reiniciar sorteo?"
        message="Se borrarán los resultados actuales y podrás ejecutar el sorteo nuevamente."
        confirmText="Reiniciar"
        danger={false}
      />

      {/* ── DASHBOARD ── */}
      {view === 'dashboard' && (
        <div className="relative z-10 flex flex-col h-full anim-fadeIn">
          {/* Header */}
          <header className="flex-none px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #007AFF, #0055CC)' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none">UltimateSorteos</h1>
                <p className="text-[11px] text-white/30 mt-0.5">Panel de sorteos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="glass-button px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
                <ImageIcon size={13} />
                <span className="hidden sm:inline">Fondo</span>
                <input type="file" accept="image/*,video/*" onChange={handleBgUpload} className="hidden" />
              </label>
              <button onClick={() => setSoundEnabled(s => !s)}
                className={`p-2 rounded-xl glass-button ${soundEnabled ? 'text-white/70' : 'text-white/25'}`}>
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
          </header>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <NewRaffleCard onClick={createRaffle} />
              {raffles.map(raffle => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onLaunch={() => launchLive(raffle)}
                  onEdit={() => { loadEditor(raffle); setView('editor'); }}
                  onDuplicate={(e) => duplicateRaffle(raffle, e)}
                  onDelete={(e) => { e.stopPropagation(); setDeleteModal({ open: true, id: raffle.id }); }}
                  onReset={(e) => { e.stopPropagation(); setResetModal({ open: true, id: raffle.id }); }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EDITOR ── */}
      {view === 'editor' && (
        <div className="relative z-10 flex flex-col h-full anim-slideRight">
          <EditorView
            raffle={currentRaffle}
            title={title} setTitle={setTitle}
            participants={participants} setParticipants={setParticipants}
            config={config} setConfig={setConfig}
            currentLogo={currentLogo} setCurrentLogo={setCurrentLogo}
            soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
            onBack={() => setView('dashboard')}
            onGoLive={() => {
              if (currentRaffle) launchLive(currentRaffle);
            }}
            showToast={showToast}
          />
        </div>
      )}

      {/* ── LIVE ── */}
      {view === 'live' && (
        <div className="relative z-10 flex flex-col h-full anim-fadeIn">
          <LiveView
            raffle={currentRaffle}
            title={title}
            participants={participants}
            config={config}
            currentLogo={currentLogo}
            liveStep={liveStep}
            countdown={countdown}
            randomName={randomName}
            winners={winners}
            substitutes={substitutes}
            currentWinnerIndex={currentWinnerIndex}
            setCurrentWinnerIndex={setCurrentWinnerIndex}
            onStartDraw={startDraw}
            onReset={resetLive}
            onGoEditor={() => setView('editor')}
            onGoHome={() => setView('dashboard')}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            playSound={playSound}
            clickAudio="click"
            triggerCelebration={triggerCelebration}
          />
        </div>
      )}
    </div>
  );
}
