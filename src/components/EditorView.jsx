import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Monitor, Trash2, Users, Settings, Upload, FileImage,
  CheckCircle, AlertTriangle, Clock, MousePointerClick, Sun,
  ChevronDown, ChevronUp, Volume2, VolumeX, Edit3, Save
} from 'lucide-react';
import { GradientBtn, THEMES_MAP, getTheme } from './RaffleCard.jsx';
import { Toggle, DuplicateModal } from './ui.jsx';

/* ─────────────────────────────────────────────────────── */
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={15} className="text-white/40" />}
          <span className="text-sm font-medium text-white/70">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
function SliderField({ label, value, min, max, onChange, accent }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>
        <span className="text-sm font-bold text-white tabular-nums">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ accentColor: accent || 'white' }}
        className="w-full"
      />
    </div>
  );
}

/* ─── Spinner / Stepper ─────────────────────────────────── */
function SpinnerField({ label, value, min = 1, max = 120, onChange }) {
  const hold = useRef(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const step = (dir) => {
    const next = Math.min(max, Math.max(min, valueRef.current + dir));
    valueRef.current = next;
    onChange(next);
  };

  const startHold = (dir) => {
    step(dir);
    hold.current = setTimeout(() => {
      hold.current = setInterval(() => step(dir), 80);
    }, 400);
  };
  const stopHold = () => {
    clearTimeout(hold.current);
    clearInterval(hold.current);
  };

  const onWheel = (e) => {
    e.preventDefault();
    step(e.deltaY < 0 ? 1 : -1);
  };

  return (
    <div>
      <label className="text-xs font-medium text-white/40 uppercase tracking-wider block mb-2.5">{label}</label>
      <div
        className="flex items-center glass-card rounded-2xl overflow-hidden h-12 select-none"
        onWheel={onWheel}
      >
        {/* Minus */}
        <button
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={() => startHold(-1)} onTouchEnd={stopHold}
          className="w-12 h-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors text-2xl font-thin flex-shrink-0 border-r border-white/[0.06]"
        >−</button>

        {/* Value display */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute inset-x-0 top-0 h-px bg-white/[0.05]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.05]" />
          <span className="text-lg font-black text-white tabular-nums leading-none">{value}</span>
          <span className="text-[10px] text-white/25 uppercase tracking-widest mt-0.5">seg</span>
        </div>

        {/* Plus */}
        <button
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={() => startHold(1)} onTouchEnd={stopHold}
          className="w-12 h-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors text-2xl font-thin flex-shrink-0 border-l border-white/[0.06]"
        >+</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
export default function EditorView({
  raffle, title, setTitle, participants, setParticipants,
  config, setConfig, currentLogo, setCurrentLogo,
  onBack, onGoLive, soundEnabled, setSoundEnabled,
  showToast,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [dupModal, setDupModal] = useState({ open: false, pending: [], existingCount: 0, selfCount: 0 });
  const fileInputRef = useRef(null);

  const theme = getTheme(config);
  const accent = theme.isCustom ? theme.color : THEMES_MAP[theme.id]?.accent || '#007AFF';
  const isDone = raffle?.status === 'completed';

  // Count duplicates within the current participants list
  const selfDuplicateCount = participants.length - new Set(participants).size;

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const rawNames = ev.target.result
        .split(/[\r\n,;]+/)
        .map(n => n.trim())
        .filter(n => n);

      // Duplicates within the file itself
      const seenInFile = new Set();
      let selfDupes = 0;
      rawNames.forEach(n => { if (seenInFile.has(n)) selfDupes++; else seenInFile.add(n); });

      // Duplicates against existing participants
      const existingSet = new Set(participants);
      const crossDupes = rawNames.filter(n => existingSet.has(n)).length;

      const totalDupes = selfDupes + crossDupes;

      if (totalDupes > 0) {
        setDupModal({ open: true, pending: rawNames, selfCount: selfDupes, existingCount: crossDupes });
      } else {
        setParticipants(p => [...p, ...rawNames]);
        showToast(`${rawNames.length} participantes cargados`, 'success');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [participants, showToast]);

  // Keep all — including duplicates within file and against existing list
  const handleDupKeep = () => {
    setParticipants(p => [...p, ...dupModal.pending]);
    showToast(`${dupModal.pending.length} participantes agregados (duplicados conservados)`, 'info');
    setDupModal({ open: false, pending: [], existingCount: 0, selfCount: 0 });
  };

  // Remove all duplicates — deduplicate file internally AND against existing list
  const handleDupRemove = () => {
    const existingSet = new Set(participants);
    const added = [];
    const seenNew = new Set();
    dupModal.pending.forEach(n => {
      if (!existingSet.has(n) && !seenNew.has(n)) {
        added.push(n);
        seenNew.add(n);
      }
    });
    const removed = dupModal.pending.length - added.length;
    setParticipants(p => [...p, ...added]);
    showToast(`${added.length} únicos agregados · ${removed} duplicados eliminados`, 'success');
    setDupModal({ open: false, pending: [], existingCount: 0, selfCount: 0 });
  };

  // Save manual edit preserving duplicates exactly as typed
  const handleManualSave = () => {
    const names = inputText.split(/\r?\n/).map(n => n.trim()).filter(n => n);
    setParticipants(names); // preserve duplicates intentionally
    setIsEditing(false);
    showToast(`${names.length} participantes guardados`, 'success');
  };

  // Explicit clean-duplicates action for the current list
  const handleCleanDuplicates = () => {
    const unique = Array.from(new Set(participants));
    const removed = participants.length - unique.length;
    setParticipants(unique);
    showToast(`${removed} duplicados eliminados · ${unique.length} participantes únicos`, 'success');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCurrentLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const totalDupCount = (dupModal.selfCount || 0) + (dupModal.existingCount || 0);

  return (
    <>
      <DuplicateModal
        isOpen={dupModal.open}
        selfCount={dupModal.selfCount || 0}
        existingCount={dupModal.existingCount || 0}
        onKeep={handleDupKeep}
        onRemove={handleDupRemove}
      />

      {/* Top bar */}
      <div className="flex-none px-5 py-3.5 glass border-b border-white/[0.06] flex items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack}
            className="p-2 rounded-xl glass-button text-white/50 hover:text-white flex-shrink-0">
            <ArrowLeft size={17} />
          </button>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="glass-input bg-transparent text-base font-semibold text-white focus:outline-none px-2 py-1 rounded-lg min-w-0 flex-1 max-w-xs"
            placeholder="Nombre del sorteo…"
          />
          {isDone && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full flex-shrink-0">
              <CheckCircle size={11} />Finalizado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl glass-button text-white/40 hover:text-white">
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <GradientBtn theme={theme} onClick={onGoLive} className="px-5 py-2 text-sm">
            <Monitor size={15} />Live
          </GradientBtn>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">

          {/* LEFT – Participants */}
          <div className="glass-card rounded-3xl flex flex-col overflow-hidden" style={{ minHeight: 480 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-white/40" />
                <span className="text-sm font-medium text-white/70">Participantes</span>
                <span className="text-[11px] text-white/30 bg-white/[0.06] rounded-full px-2 py-0.5">
                  {participants.length}
                </span>
                {/* Badge showing duplicate count in current list */}
                {selfDuplicateCount > 0 && !isEditing && (
                  <span className="text-[11px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                    {selfDuplicateCount} dup.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {/* Clean duplicates button — only shows when duplicates exist */}
                {selfDuplicateCount > 0 && !isEditing && (
                  <button
                    onClick={handleCleanDuplicates}
                    title={`Eliminar ${selfDuplicateCount} duplicados`}
                    className="p-1.5 rounded-lg text-xs px-2.5 flex items-center gap-1.5 text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                    Limpiar
                  </button>
                )}
                {!isEditing && (
                  <label className="p-1.5 rounded-lg glass-button text-white/40 hover:text-white cursor-pointer flex items-center gap-1.5 text-xs px-3">
                    <Upload size={13} />Cargar
                    <input ref={fileInputRef} type="file" accept=".txt,.csv,text/plain,text/csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
                <button
                  onClick={() => {
                    if (isEditing) { handleManualSave(); }
                    else { setIsEditing(true); setInputText(participants.join('\n')); }
                  }}
                  className={`p-1.5 rounded-lg text-xs px-3 flex items-center gap-1.5 transition-all ${
                    isEditing
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'glass-button text-white/40 hover:text-white'
                  }`}
                >
                  {isEditing ? <><Save size={13} />Guardar</> : <><Edit3 size={13} />Editar</>}
                </button>
                {participants.length > 0 && !isEditing && (
                  <button onClick={() => setParticipants([])}
                    className="p-1.5 rounded-lg glass-button text-white/30 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-3">
              {isEditing ? (
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="glass-input w-full h-full rounded-xl p-4 text-sm font-mono resize-none"
                  placeholder="Un nombre por línea…"
                  autoFocus
                />
              ) : participants.length === 0 ? (
                <label className="flex flex-col items-center justify-center h-full cursor-pointer group rounded-2xl border-2 border-dashed border-white/[0.07] hover:border-white/15 transition-colors">
                  <Upload size={28} className="text-white/20 group-hover:text-white/40 transition-colors mb-3" />
                  <span className="text-sm text-white/30 group-hover:text-white/50 transition-colors">Subir .txt o .csv</span>
                  <span className="text-[11px] text-white/20 mt-1">o haz clic en Editar</span>
                  <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
                </label>
              ) : (
                <div className="h-full overflow-y-auto space-y-0.5">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                      <span className="text-[11px] text-white/20 tabular-nums w-6 text-right flex-shrink-0">{i+1}</span>
                      <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors truncate">{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT – Config */}
          <div className="flex flex-col gap-4">

            {isDone && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-400">Sorteo finalizado</p>
                  <p className="text-xs text-white/40 mt-0.5">Reinicia desde el dashboard para volver a ejecutar.</p>
                </div>
              </div>
            )}

            <div className={isDone ? 'pointer-events-none opacity-50' : ''}>

              <Section title="Acento de color" icon={() => <div className="w-3 h-3 rounded-full" style={{ background: accent }} />}>
                <div className="flex items-center gap-2.5 flex-wrap mt-1">
                  {Object.entries(THEMES_MAP).map(([id, t]) => (
                    <button key={id} onClick={() => setConfig(c => ({ ...c, colorTheme: id }))}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                        outline: config.colorTheme === id ? `2px solid white` : '2px solid transparent',
                        outlineOffset: 2,
                        opacity: config.colorTheme === id ? 1 : 0.55,
                      }}
                      title={id}
                    />
                  ))}
                  <label
                    className="w-7 h-7 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center overflow-hidden"
                    style={{
                      background: config.colorTheme === 'custom' ? config.customColor : 'rgba(255,255,255,0.1)',
                      outline: config.colorTheme === 'custom' ? '2px solid white' : '2px solid transparent',
                      outlineOffset: 2,
                    }}
                    title="Color personalizado"
                  >
                    <input type="color" className="opacity-0 absolute w-0 h-0"
                      value={config.customColor || '#007AFF'}
                      onChange={e => setConfig(c => ({ ...c, colorTheme: 'custom', customColor: e.target.value }))}
                    />
                    <span className="text-[10px] text-white">+</span>
                  </label>
                </div>
              </Section>

              <div className="mt-4">
                <Section title="Ganadores y tiempo" icon={Clock}>
                  <div className="space-y-5 mt-2">
                    <SliderField label="Ganadores" value={config.numWinners || 1}
                      min={1} max={Math.max(1, participants.length)} accent={accent}
                      onChange={v => setConfig(c => ({ ...c, numWinners: v }))} />
                    <SliderField label="Suplentes" value={config.numSubstitutes || 0}
                      min={0} max={Math.max(0, participants.length - (config.numWinners || 1))} accent={accent}
                      onChange={v => setConfig(c => ({ ...c, numSubstitutes: v }))} />
                    <SpinnerField
                      label="Duración"
                      value={config.timerDuration}
                      min={1}
                      max={120}
                      onChange={v => setConfig(c => ({ ...c, timerDuration: v }))}
                    />
                  </div>
                </Section>
              </div>

              <div className="mt-4">
                <Section title="Modo de revelación" icon={MousePointerClick}>
                  <div className="flex bg-black/30 rounded-xl p-1 mt-2">
                    {[['individual','Uno por uno'],['all','Todos a la vez']].map(([m, label]) => (
                      <button key={m} onClick={() => setConfig(c => ({ ...c, revealMode: m }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          config.revealMode === m
                            ? 'bg-white/15 text-white shadow-sm'
                            : 'text-white/30 hover:text-white/50'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </Section>
              </div>

              <div className="mt-4">
                <Section title="Logo del evento" icon={FileImage}>
                  <div className="space-y-3 mt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl glass-button cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center overflow-hidden border border-white/10 flex-shrink-0">
                        {currentLogo
                          ? <img src={currentLogo} className="w-full h-full object-contain" alt="logo" />
                          : <Upload size={14} className="text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">Subir logo</p>
                        <p className="text-[11px] text-white/25">PNG, JPG, SVG</p>
                      </div>
                      {currentLogo && (
                        <button onClick={e => { e.preventDefault(); setCurrentLogo(null); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Sun size={12} />Logo en blanco
                      </div>
                      <Toggle checked={config.whiteLogo || false} onChange={v => setConfig(c => ({ ...c, whiteLogo: v }))} />
                    </div>
                  </div>
                </Section>
              </div>

              <div className="mt-4">
                <Section title="Opciones adicionales" icon={Settings}>
                  <div className="flex items-center justify-between px-1 mt-2">
                    <span className="text-xs text-white/50">Eliminar ganadores de la lista</span>
                    <Toggle checked={config.removeWinners || false} onChange={v => setConfig(c => ({ ...c, removeWinners: v }))} />
                  </div>
                </Section>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
