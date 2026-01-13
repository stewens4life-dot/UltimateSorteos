import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Users, Trophy, Play, RefreshCw, Settings, Trash2, 
  ChevronRight, ChevronLeft, Volume2, VolumeX, 
  Image as ImageIcon, Video, X, Edit3, Save, Clock, Monitor, ArrowLeft,
  FileImage, Plus, LayoutGrid, Copy, MousePointerClick, Home, CheckCircle,
  AlertTriangle, Info, Calendar, RotateCcw, Eye
} from 'lucide-react';

// --- Tipos y Constantes ---
const DEFAULT_CONFIG = {
  numWinners: 1,
  timerDuration: 5,
  revealMode: 'individual',
  removeWinners: false
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Componentes UI Personalizados ---

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-fadeInUp">
      <div className="bg-slate-900 border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
        <div className="bg-green-500/20 p-2 rounded-full text-green-400">
          <CheckCircle size={20} />
        </div>
        <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Sí, Eliminar", confirmColor = "bg-red-500 hover:bg-red-600" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-white/10 p-4 rounded-full text-white mb-2">
            <Info size={32} />
          </div>
          <h3 className="text-2xl font-black text-white">{title}</h3>
          <p className="text-white/60 text-sm leading-relaxed">{message}</p>
          <div className="flex gap-3 w-full mt-4">
            <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all">
              Cancelar
            </button>
            <button onClick={onConfirm} className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-lg ${confirmColor}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Componente de Confeti ---
const Confetti = ({ active }) => {
  if (!active) return null;
  const particles = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    bg: ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32', '#FF4500', '#FFFFFF'][Math.floor(Math.random() * 6)],
    speed: Math.random() * 2 + 2,
    size: Math.random() * 10 + 5,
    rotation: Math.random() * 360
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
      {particles.map((p) => (
        <div key={p.id} className="absolute rounded-sm opacity-90 shadow-lg"
          style={{
            left: `${p.x}%`, top: `-30px`, width: `${p.size}px`, height: `${p.size}px`,
            backgroundColor: p.bg, transform: `rotate(${p.rotation}deg)`,
            animation: `fall ${p.speed}s linear infinite`, animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style>{`@keyframes fall { 0% { transform: translateY(-30px) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
};

export default function App() {
  // --- Estados Globales (App) ---
  const [view, setView] = useState('dashboard');
  
  // Inicialización
  const [raffles, setRaffles] = useState(() => {
      try {
          const saved = localStorage.getItem('elite-raffles');
          return saved ? JSON.parse(saved) : [{ 
            id: generateId(), 
            title: "Sorteo General", 
            participants: [], 
            config: DEFAULT_CONFIG,
            updatedAt: Date.now(),
            status: 'draft',
            results: []
        }];
      } catch (e) {
          console.error("Error localStorage:", e);
          return [{ id: generateId(), title: "Sorteo General", participants: [], config: DEFAULT_CONFIG, updatedAt: Date.now(), status: 'draft', results: [] }];
      }
  });

  const [currentRaffleId, setCurrentRaffleId] = useState(null);
  
  // UI States
  const [toastMessage, setToastMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, raffleId: null });
  const [resetModal, setResetModal] = useState({ isOpen: false, raffleId: null });

  // Recursos Globales
  const [bgSource, setBgSource] = useState(null);
  const [bgType, setBgType] = useState(null);
  const [logo, setLogo] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // --- Estados del Editor/Live ---
  const [title, setTitle] = useState("Nuevo Sorteo");
  const [participants, setParticipants] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isEditingList, setIsEditingList] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  
  // Estados Live
  const [liveStep, setLiveStep] = useState('ready');
  const [countdown, setCountdown] = useState(5);
  const [randomName, setRandomName] = useState('');
  const [winners, setWinners] = useState([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0); 
  const [showConfetti, setShowConfetti] = useState(false);

  // Referencias Audio
  const applauseAudio = useRef(null);
  const tickAudio = useRef(null); 
  const clickAudio = useRef(null);

  // --- Efectos ---
  useEffect(() => {
    const savedBg = localStorage.getItem('elite-bg');
    const savedBgType = localStorage.getItem('elite-bg-type');
    const savedLogo = localStorage.getItem('elite-logo');
    if (savedBg) { setBgSource(savedBg); setBgType(savedBgType || 'image'); }
    if (savedLogo) setLogo(savedLogo);

    applauseAudio.current = new Audio('https://www.soundjay.com/human/sounds/applause-01.mp3'); 
    tickAudio.current = new Audio('https://www.soundjay.com/button/sounds/beep-07.mp3'); 
    clickAudio.current = new Audio('https://www.soundjay.com/button/sounds/button-30.mp3'); 
    [applauseAudio, tickAudio, clickAudio].forEach(a => { if (a.current) { a.current.volume = 0.6; a.current.load(); } });
  }, []);

  // Persistencia Automática
  useEffect(() => {
    localStorage.setItem('elite-raffles', JSON.stringify(raffles));
  }, [raffles]);

  useEffect(() => {
    if (isEditingList) setInputText(participants.join('\n'));
  }, [isEditingList, participants]);

  useEffect(() => {
    if (!soundEnabled) {
      [applauseAudio, tickAudio, clickAudio].forEach(a => { if (a.current) { a.current.pause(); a.current.currentTime = 0; } });
    }
  }, [soundEnabled]);

  // Limpieza al salir de live
  useEffect(() => {
    if (view !== 'live') {
      setShowConfetti(false);
      [applauseAudio, tickAudio, clickAudio].forEach(a => { if (a.current) { a.current.pause(); a.current.currentTime = 0; } });
    }
  }, [view]);

  const showToast = (msg) => setToastMessage(msg);

  const playSound = async (audioRef) => {
    if (soundEnabled && audioRef.current) {
      try { audioRef.current.currentTime = 0; await audioRef.current.play(); } catch (e) { console.warn("Audio blocked", e); }
    }
  };
  const stopSound = (audioRef) => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } };

  // --- Funciones de Gestión ---

  const createRaffle = () => {
      const newRaffle = {
          id: generateId(),
          title: `Sorteo #${raffles.length + 1}`,
          participants: [],
          config: DEFAULT_CONFIG,
          updatedAt: Date.now(),
          status: 'draft',
          results: []
      };
      setRaffles(prev => [...prev, newRaffle]);
      loadRaffleIntoEditor(newRaffle);
      showToast("Nuevo sorteo creado");
  };

  const requestDelete = (id, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setDeleteModal({ isOpen: true, raffleId: id });
  };

  const confirmDelete = () => {
      const idToDelete = deleteModal.raffleId;
      if (!idToDelete) return;

      setRaffles(currentRaffles => {
          const newList = currentRaffles.filter(r => r.id !== idToDelete);
          if (newList.length === 0) {
             const defaultRaffle = { 
                id: generateId(), 
                title: "Nuevo Sorteo", 
                participants: [], 
                config: DEFAULT_CONFIG,
                updatedAt: Date.now(),
                status: 'draft',
                results: []
             };
             if (currentRaffleId === idToDelete) {
                 setTimeout(() => loadRaffleIntoEditor(defaultRaffle), 0);
             }
             return [defaultRaffle];
          }
          return newList;
      });

      if (view === 'editor' && currentRaffleId === idToDelete) {
          setView('dashboard');
          setCurrentRaffleId(null);
      }
      setDeleteModal({ isOpen: false, raffleId: null });
      showToast("Sorteo eliminado");
  };

  const requestReset = (id, e) => {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      setResetModal({ isOpen: true, raffleId: id });
  };

  const confirmReset = () => {
      const idToReset = resetModal.raffleId;
      if (!idToReset) return;

      setRaffles(prev => prev.map(r => 
        r.id === idToReset 
        ? { ...r, status: 'draft', results: [] } 
        : r
      ));

      setResetModal({ isOpen: false, raffleId: null });
      showToast("Resultados reiniciados");
  };

  const duplicateRaffle = (raffle, e) => {
      e.stopPropagation();
      const newRaffle = { ...raffle, id: generateId(), title: `${raffle.title} (Copia)`, updatedAt: Date.now(), status: 'draft', results: [] };
      setRaffles(prev => [...prev, newRaffle]);
      showToast("Sorteo duplicado");
  };

  const loadRaffleIntoEditor = (raffle) => {
      setCurrentRaffleId(raffle.id);
      setTitle(raffle.title);
      setParticipants(raffle.participants || []);
      setConfig(raffle.config || DEFAULT_CONFIG);
      setView('editor');
      setWinners(raffle.results || []); 
  };

  // Auto-guardado editor
  useEffect(() => {
      if (view === 'editor' && currentRaffleId) {
          const timer = setTimeout(() => {
              setRaffles(prev => prev.map(r => 
                  r.id === currentRaffleId 
                    ? { ...r, title, participants, config, updatedAt: Date.now() } 
                    : r
              ));
          }, 400); 
          return () => clearTimeout(timer);
      }
  }, [title, participants, config]);

  // --- Lógica de Ejecución y Visualización ---

  // Botón Principal del Dashboard
  const handleMainAction = (raffle, e) => {
      e.stopPropagation();
      loadRaffleIntoEditor(raffle);
      setView('live');
      
      if (raffle.status === 'completed') {
          setWinners(raffle.results);
          setLiveStep('results');
          setCurrentWinnerIndex(0);
          setShowConfetti(true); 
          setTimeout(() => playSound(applauseAudio), 500);
      } else {
          setLiveStep('ready');
          setWinners([]);
      }
  };

  // Función para calcular tamaño de fuente dinámico
  const getWinnerFontSize = (text) => {
    if (!text) return "text-5xl md:text-8xl";
    const len = text.length;
    if (len < 10) return "text-5xl md:text-8xl"; 
    if (len < 20) return "text-4xl md:text-6xl"; 
    if (len < 35) return "text-3xl md:text-5xl"; 
    return "text-2xl md:text-4xl"; 
  };

  const startDraw = () => {
    if (participants.length === 0) return;
    playSound(clickAudio);
    
    // Cálculo de ganadores
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, config.numWinners);
    
    setWinners(selected);
    setCountdown(config.timerDuration);
    setLiveStep('countdown');
    setCurrentWinnerIndex(0);
    setShowConfetti(false);
    playSound(tickAudio);
  };

  // Efecto del Sorteo en Vivo
  useEffect(() => {
    let interval;
    if (view === 'live' && liveStep === 'countdown') {
      interval = setInterval(() => {
        setRandomName(participants[Math.floor(Math.random() * participants.length)]);
      }, 30);
      
      if (countdown > 0) {
        const timer = setTimeout(() => {
            setCountdown(c => c - 1);
            if (countdown > 1) playSound(tickAudio);
        }, 1000);
        return () => { clearTimeout(timer); clearInterval(interval); };
      } else {
        clearInterval(interval);
        // --- FINAL DEL SORTEO ---
        setLiveStep('results');
        triggerCelebration();

        // GUARDADO DE RESULTADOS (PERSISTENCIA)
        if (currentRaffleId) {
            setRaffles(prev => prev.map(r => 
                r.id === currentRaffleId 
                ? { 
                    ...r, 
                    status: 'completed', 
                    results: winners,
                    completedAt: Date.now()
                  } 
                : r
            ));
        }

        if (config.removeWinners) {
            setParticipants(prev => prev.filter(p => !winners.includes(p)));
        }
      }
    }
    return () => clearInterval(interval);
  }, [view, liveStep, countdown, participants, winners, currentRaffleId]);

  const triggerCelebration = () => { setShowConfetti(true); setTimeout(() => playSound(applauseAudio), 100); };
  
  const resetLive = () => {
      playSound(clickAudio);
      [applauseAudio, tickAudio].forEach(stopSound);
      setLiveStep('ready');
      setWinners([]);
      setShowConfetti(false);
  };

  // --- Funciones Archivos ---
  const handleBgUpload = (e) => { 
    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { try { localStorage.setItem('elite-bg', ev.target.result); localStorage.setItem('elite-bg-type', file.type.startsWith('video/') ? 'video' : 'image'); } catch(e) {} setBgSource(ev.target.result); setBgType(file.type.startsWith('video/') ? 'video' : 'image'); showToast("Fondo actualizado"); }; reader.readAsDataURL(file); }
  };
  const handleLogoUpload = (e) => { 
    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { try { localStorage.setItem('elite-logo', ev.target.result); } catch(e) {} setLogo(ev.target.result); showToast("Logo actualizado"); }; reader.readAsDataURL(file); }
  };
  const handleFileUpload = (e) => { 
    const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { const rawNames = ev.target.result.split(/[\r\n,]+/).map((n) => n.trim()).filter((n) => n !== ''); const unique = Array.from(new Set([...participants, ...rawNames])); setParticipants(unique); showToast(`Cargados ${unique.length} participantes`); }; reader.readAsText(file); }
  };
  const handleManualSave = () => {
    const names = inputText.split(/\r?\n/).map(n => n.trim()).filter(n => n !== '');
    setParticipants(Array.from(new Set(names)));
    setIsEditingList(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative select-none flex flex-col">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {bgSource ? (
            bgType === 'video' ? 
                <video src={bgSource} autoPlay loop muted className="w-full h-full object-cover"/> : 
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${bgSource})` }}/>
        ) : null}
        <div className={`absolute inset-0 ${bgSource ? 'bg-slate-900/70' : 'bg-transparent'}`}></div>
      </div>
      
      <Confetti active={showConfetti} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      
      {/* MODALES */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({isOpen: false, raffleId: null})} 
        onConfirm={confirmDelete}
        title="¿Eliminar Sorteo?"
        message="Se perderá toda la configuración y resultados."
      />
       <ConfirmModal 
        isOpen={resetModal.isOpen} 
        onClose={() => setResetModal({isOpen: false, raffleId: null})} 
        onConfirm={confirmReset}
        title="¿Reiniciar Sorteo?"
        message="Esto borrará los ganadores guardados y permitirá realizar el sorteo nuevamente. ¿Continuar?"
        confirmText="Sí, Reiniciar"
        confirmColor="bg-yellow-500 hover:bg-yellow-600 text-black"
      />

      {/* --- DASHBOARD VIEW --- */}
      {view === 'dashboard' && (
        <div className="relative z-10 flex flex-col h-screen p-6 md:p-12 animate-fadeIn overflow-y-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <LayoutGrid className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Panel de Sorteos</h1>
                        <p className="text-white/40 text-sm font-mono">Gestiona tus eventos</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                        <ImageIcon size={16} /> <span className="text-xs font-bold uppercase hidden md:inline">Fondo</span>
                        <input type="file" accept="image/*,video/*" onChange={handleBgUpload} className="hidden" />
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                        <FileImage size={16} /> <span className="text-xs font-bold uppercase hidden md:inline">Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-xl border ${soundEnabled ? 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20' : 'text-white/20 bg-white/5 border-white/10'}`}>
                        {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                <button onClick={createRaffle} className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-3xl hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform mb-4">
                        <Plus className="text-white/40 group-hover:text-yellow-500" size={32} />
                    </div>
                    <span className="text-white/40 font-bold uppercase tracking-widest text-sm group-hover:text-white">Nuevo Sorteo</span>
                </button>

                {raffles.map(raffle => (
                    <div 
                        key={raffle.id} 
                        onClick={(e) => {
                            if (raffle.status === 'completed') {
                                handleMainAction(raffle, e); 
                            } else {
                                loadRaffleIntoEditor(raffle);
                            }
                        }}
                        className={`group backdrop-blur-md border rounded-3xl p-6 relative hover:border-white/30 transition-all cursor-pointer flex flex-col h-64 ${raffle.status === 'completed' ? 'bg-green-900/20 border-green-500/30' : 'bg-black/40 border-white/10'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${raffle.status === 'completed' ? 'bg-green-500 text-black' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                                {raffle.status === 'completed' ? <CheckCircle size={18} /> : <Trophy size={18} />}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={(e) => duplicateRaffle(raffle, e)} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors" title="Duplicar">
                                    <Copy size={16} />
                                </button>
                                {raffle.status === 'completed' && (
                                    <button onClick={(e) => requestReset(raffle.id, e)} className="p-2 hover:bg-yellow-500/20 rounded-lg text-white/40 hover:text-yellow-400 transition-colors z-20" title="Reiniciar Sorteo">
                                        <RotateCcw size={16} />
                                    </button>
                                )}
                                <button onClick={(e) => requestDelete(raffle.id, e)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors z-20" title="Eliminar">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 leading-tight group-hover:text-yellow-400 transition-colors">{raffle.title}</h3>
                            {raffle.status === 'completed' ? (
                                <div className="bg-black/30 rounded-lg p-2 text-xs text-white/70 h-full overflow-hidden">
                                    <p className="font-bold text-green-400 uppercase mb-1">Resultados:</p>
                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                                        {raffle.results?.map((w, i) => (
                                            <div key={i} className="flex gap-2"><span className="text-white/30">{i+1}.</span> <span className="truncate">{w}</span></div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-white/40 space-y-1">
                                    <p>👥 {raffle.participants?.length || 0} Participantes</p>
                                    <p>🏆 {raffle.config?.numWinners || 1} Ganador(es)</p>
                                    <p>⏱️ {raffle.config?.timerDuration || 5} Segundos</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                             <button onClick={(e) => handleMainAction(raffle, e)} className={`flex-1 py-2 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 font-bold ${raffle.status === 'completed' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 hover:bg-green-500 hover:text-black text-white'}`}>
                                {raffle.status === 'completed' ? <><Eye size={14}/> Ver Resultados</> : <><Play size={14}/> Lanzar</>}
                             </button>
                             {raffle.status !== 'completed' && (
                                <button className="flex-1 bg-white/5 hover:bg-white/20 text-white py-2 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    <Edit3 size={14} /> Editar
                                </button>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- EDITOR VIEW --- */}
      {view === 'editor' && (
        <div className="relative z-10 flex flex-col h-screen overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-black/40 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Volver al Dashboard">
                        <ArrowLeft size={20} />
                    </button>
                    <input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b border-white/20 w-64 md:w-96"
                        placeholder="Nombre del Sorteo"
                    />
                </div>
                <div className="flex items-center gap-3">
                     {/* Mostrar estado en el editor */}
                    {raffles.find(r => r.id === currentRaffleId)?.status === 'completed' && (
                        <span className="text-green-400 text-xs font-bold uppercase border border-green-500/30 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                            <CheckCircle size={12} /> Finalizado
                        </span>
                    )}

                    {currentRaffleId && (
                        <button onClick={(e) => requestDelete(currentRaffleId, e)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg mr-2" title="Borrar este sorteo">
                            <Trash2 size={18} />
                        </button>
                    )}
                    <button onClick={(e) => handleMainAction(raffles.find(r => r.id === currentRaffleId), e)} className="bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-green-500/20">
                        <Monitor size={18} /> <span className="hidden md:inline">IR AL LIVE</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-black/30 border border-white/10 rounded-3xl p-6 flex flex-col h-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2"><Users size={18} className="text-yellow-500"/> Lista de Participantes</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setParticipants([])} className="p-2 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg"><Trash2 size={16}/></button>
                                <button onClick={() => { setIsEditingList(!isEditingList); if(!isEditingList) setInputText(participants.join('\n')); else handleManualSave(); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border ${isEditingList ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/10'}`}>
                                    {isEditingList ? 'Guardar' : 'Editar'}
                                </button>
                            </div>
                        </div>
                        {isEditingList ? (
                            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-1 bg-black/20 rounded-xl p-4 text-sm font-mono focus:outline-none resize-none" placeholder="Pegar nombres..." autoFocus />
                        ) : (
                            <div className="flex-1 bg-black/20 rounded-xl overflow-hidden flex flex-col">
                                {participants.length === 0 ? (
                                    <label className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-white/5 m-4 rounded-xl">
                                        <Upload size={32} className="text-white/20 mb-2"/>
                                        <span className="text-white/40 text-sm">Subir archivo .txt / .csv</span>
                                        <input type="file" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                        {participants.map((p, i) => (
                                            <div key={i} className="px-3 py-2 border-b border-white/5 text-sm text-white/70 flex gap-3"><span className="text-white/20 w-6 text-right">{i+1}.</span> {p}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-3xl p-8 flex flex-col gap-8 h-fit">
                        <h3 className="font-bold flex items-center gap-2"><Settings size={18} className="text-purple-400"/> Configuración</h3>
                        {/* Si el sorteo está completado, mostrar advertencia */}
                        {raffles.find(r => r.id === currentRaffleId)?.status === 'completed' && (
                             <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-yellow-500 text-sm">Sorteo Finalizado</h4>
                                    <p className="text-xs text-white/60 mt-1">Este sorteo ya tiene ganadores registrados. Para volver a correrlo, debes reiniciarlo desde el Dashboard.</p>
                                </div>
                             </div>
                        )}
                        <div className={`space-y-6 ${raffles.find(r => r.id === currentRaffleId)?.status === 'completed' ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="flex justify-between text-xs font-bold uppercase text-white/50 mb-2">Ganadores <span className="text-purple-400">{config.numWinners}</span></label>
                                <input type="range" min="1" max={Math.max(1, participants.length)} value={config.numWinners} onChange={(e) => setConfig({...config, numWinners: parseInt(e.target.value)})} className="w-full h-2 bg-black/50 rounded-lg accent-purple-500 cursor-pointer"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-white/50 mb-2"><Clock size={12}/> Tiempo (s)</label>
                                    <input type="number" value={config.timerDuration} onChange={(e) => setConfig({...config, timerDuration: Math.max(1, parseInt(e.target.value)||0)})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold text-center focus:border-purple-500 outline-none"/>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-white/50 mb-2"><MousePointerClick size={12}/> Revelar</label>
                                    <div className="flex bg-black/50 rounded-xl p-1">
                                        <button onClick={() => setConfig({...config, revealMode: 'individual'})} className={`flex-1 rounded-lg text-[10px] font-bold uppercase py-2 ${config.revealMode === 'individual' ? 'bg-white/20 text-white' : 'text-white/30'}`}>Uno</button>
                                        <button onClick={() => setConfig({...config, revealMode: 'all'})} className={`flex-1 rounded-lg text-[10px] font-bold uppercase py-2 ${config.revealMode === 'all' ? 'bg-white/20 text-white' : 'text-white/30'}`}>Todos</button>
                                    </div>
                                </div>
                            </div>
                            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all">
                                <input type="checkbox" checked={config.removeWinners} onChange={(e) => setConfig({...config, removeWinners: e.target.checked})} className="w-4 h-4 accent-purple-500 rounded bg-black/50 border-white/20"/>
                                <span className="text-sm font-medium text-white/80">Eliminar ganadores al finalizar</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- LIVE VIEW --- */}
      {view === 'live' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center animate-fadeIn">
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50">
                <div className="flex gap-2">
                    <button onClick={() => setView('editor')} className="bg-black/40 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/60 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
                        <Settings size={14} /> Config
                    </button>
                    <button onClick={() => setView('dashboard')} className="bg-black/40 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/60 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all">
                        <Home size={14} /> Dashboard
                    </button>
                </div>
                {/* Logo Flotante AJUSTADO */}
                {(liveStep === 'countdown' || liveStep === 'results') && logo && (
                    <div className="fixed top-36 left-8 animate-fadeIn z-50 pointer-events-none">
                        <img src={logo} alt="Logo" className="h-8 w-auto object-contain drop-shadow-lg opacity-80" />
                    </div>
                )}
                <div className="flex gap-2">
                     {liveStep === 'results' && (
                        <button onClick={resetLive} className={`p-3 rounded-full transition-all backdrop-blur-md ${raffles.find(r => r.id === currentRaffleId)?.status === 'completed' ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'}`} disabled={raffles.find(r => r.id === currentRaffleId)?.status === 'completed'} title="Reinicia desde el dashboard">
                            <RefreshCw size={20} />
                        </button>
                     )}
                     <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-md">
                        {soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
                     </button>
                </div>
            </div>

            {liveStep === 'ready' && (
                <div className="text-center animate-fadeInUp max-w-4xl px-6">
                    <div className="mb-12 relative flex justify-center">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-[120px] rounded-full pointer-events-none"></div>
                        {logo ? (
                            <img src={logo} alt="Event Logo" className="h-40 md:h-56 w-auto object-contain drop-shadow-2xl animate-popIn" />
                        ) : (
                            <Trophy size={100} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-popIn" />
                        )}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter drop-shadow-xl mb-4 leading-none">{title}</h1>
                    <div className="flex justify-center gap-8 mb-16">
                        <div className="text-right border-r border-white/20 pr-8">
                            <div className="text-4xl font-black text-white">{participants.length}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/40">Participantes</div>
                        </div>
                        <div className="text-left pl-2">
                            <div className="text-4xl font-black text-white">{config.numWinners}</div>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/40">Ganadores</div>
                        </div>
                    </div>
                    
                    {/* Botón de Comenzar */}
                    {raffles.find(r => r.id === currentRaffleId)?.status !== 'completed' ? (
                        <button onClick={startDraw} className="group relative px-16 py-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full font-black text-2xl text-white shadow-[0_0_60px_rgba(234,179,8,0.4)] hover:shadow-[0_0_100px_rgba(234,179,8,0.6)] hover:scale-105 transition-all duration-300 active:scale-95">
                            <span className="relative z-10 flex items-center gap-3"><Play fill="currentColor" /> COMENZAR</span>
                            <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse"></div>
                        </button>
                    ) : (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-8 py-4 rounded-xl font-bold uppercase tracking-widest animate-pulse">
                            Resultados Oficiales
                        </div>
                    )}
                </div>
            )}

            {liveStep === 'countdown' && (
                <div className="flex flex-col items-center justify-center w-full relative">
                    <div className="relative mb-12 scale-150">
                        <div className="w-64 h-64 rounded-full border-[8px] border-yellow-500/10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl shadow-[0_0_150px_rgba(255,191,0,0.15)] relative z-10">
                            <span key={countdown} className="text-[8rem] font-black text-white tabular-nums z-10 drop-shadow-2xl leading-none animate-ping-once">{countdown}</span>
                            <div className="absolute inset-[-8px] w-[calc(100%+16px)] h-[calc(100%+16px)] rounded-full border-t-[6px] border-yellow-500 animate-spin" style={{ animationDuration: '1s' }}></div>
                        </div>
                    </div>
                    <div className="w-full max-w-3xl bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] text-center relative overflow-hidden shadow-2xl mt-8">
                         <div className="text-xs font-black text-yellow-500 uppercase tracking-[0.5em] mb-4 opacity-80 animate-pulse">{config.numWinners > 1 ? 'Seleccionando Ganadores...' : 'Seleccionando Ganador...'}</div>
                         <div className="text-6xl font-black text-white/90 italic tracking-tighter truncate h-20">{randomName}</div>
                    </div>
                </div>
            )}

            {liveStep === 'results' && (
                <div className="w-full flex flex-col items-center max-w-6xl animate-popIn">
                    <div className="mb-12 text-center">
                        <div className="px-10 py-3 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-black uppercase tracking-[0.4em] inline-block shadow-[0_0_50px_rgba(234,179,8,0.3)] backdrop-blur-xl">
                            {winners.length > 1 ? '¡Ganadores Oficiales!' : '¡Felicidades!'}
                        </div>
                    </div>

                    {config.revealMode === 'individual' ? (
                        <div className="flex flex-col items-center w-full max-w-5xl">
                             <div className="w-full bg-gradient-to-r from-slate-100 to-slate-300 text-slate-900 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] p-12 md:p-16 relative overflow-hidden mb-12 border-[8px] border-white/20 ring-4 ring-yellow-500/40 flex flex-col md:flex-row items-center gap-12">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-black pointer-events-none transform rotate-12 scale-150"><Trophy size={400} /></div>
                                <div className="relative z-10 flex-shrink-0">
                                    <div className="w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl transform -rotate-3 ring-[6px] ring-white">
                                        <Trophy className="text-white" size={80} />
                                    </div>
                                </div>
                                <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0">
                                    <span className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-4 border-b-2 border-slate-300 pb-2 inline-block">
                                        {winners.length > 1 ? `Ganador ${currentWinnerIndex + 1} de ${winners.length}` : 'Ganador Oficial'}
                                    </span>
                                    <h3 className={`${getWinnerFontSize(winners[currentWinnerIndex])} font-black break-words w-full leading-none tracking-tighter uppercase text-slate-900 drop-shadow-sm transition-all duration-300`}>
                                        {winners[currentWinnerIndex]}
                                    </h3>
                                </div>
                             </div>
                             
                             {winners.length > 1 && (
                                 <div className="flex gap-6 items-center bg-black/60 p-4 pl-8 pr-4 rounded-full border border-white/10 backdrop-blur-2xl shadow-2xl">
                                     <span className="text-white/40 font-bold text-xs uppercase tracking-widest mr-4">Navegar Resultados</span>
                                     <button onClick={() => { playSound(clickAudio); setShowConfetti(false); setTimeout(() => { setCurrentWinnerIndex(Math.max(0, currentWinnerIndex - 1)); triggerCelebration(); }, 100); }} disabled={currentWinnerIndex === 0} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"><ChevronLeft size={24}/></button>
                                     <span className="font-mono text-white text-2xl w-20 text-center font-bold">{currentWinnerIndex + 1}/{winners.length}</span>
                                     <button onClick={() => { playSound(clickAudio); setShowConfetti(false); setTimeout(() => { setCurrentWinnerIndex(Math.min(winners.length - 1, currentWinnerIndex + 1)); triggerCelebration(); }, 100); }} disabled={currentWinnerIndex === winners.length - 1} className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"><ChevronRight size={24}/></button>
                                 </div>
                             )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-h-[60vh] overflow-y-auto px-6 custom-scrollbar pb-20">
                            {winners.map((winner, index) => (
                                <div key={index} className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group hover:bg-white/15 transition-all hover:-translate-y-2 animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={64} className="text-white transform rotate-12"/></div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-black shadow-lg text-lg border-2 border-white/20">{index + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Ganador</span>
                                            <span className="text-2xl font-bold text-white uppercase tracking-tight leading-none group-hover:text-yellow-400 transition-colors">{winner}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; } 
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } 
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } 
        .animate-fadeInUp { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; } 
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } } 
        .animate-popIn { animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; } 
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        .animate-ping-once { animation: pingOnce 0.4s cubic-bezier(0, 0, 0.2, 1); }
        @keyframes pingOnce { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}