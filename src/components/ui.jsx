import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

/* ─── Toast ─────────────────────────────────────────── */
export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const colors = {
    success: 'text-green-400 bg-green-500/15 border-green-500/20',
    error:   'text-red-400   bg-red-500/15   border-red-500/20',
    info:    'text-blue-400  bg-blue-500/15  border-blue-500/20',
  };

  const Icon = type === 'error' ? AlertTriangle : CheckCircle;

  return (
    <div className="fixed bottom-6 right-6 z-[200] anim-fadeInUp pointer-events-none">
      <div className="glass flex items-center gap-3 px-5 py-3.5 rounded-2xl min-w-[240px]">
        <span className={`p-1.5 rounded-full border ${colors[type]}`}>
          <Icon size={15} />
        </span>
        <span className="text-sm font-medium text-white/90">{message}</span>
      </div>
    </div>
  );
};

/* ─── Confirm Modal ─────────────────────────────────── */
export const ConfirmModal = ({
  isOpen, onClose, onConfirm,
  title, message,
  confirmText = 'Eliminar',
  danger = true,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 anim-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full anim-popIn relative z-10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`p-4 rounded-2xl ${danger ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'}`}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl glass-button text-white/70 text-sm font-medium">
              Cancelar
            </button>
            <button onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all
                ${danger
                  ? 'bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'bg-yellow-500/90 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                }`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Duplicate-Mode Modal ───────────────────────────── */
export const DuplicateModal = ({ isOpen, onKeep, onRemove, selfCount = 0, existingCount = 0 }) => {
  if (!isOpen) return null;
  const total = selfCount + existingCount;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 anim-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full anim-popIn relative z-10">
        <div className="flex flex-col items-center text-center gap-5">
          <div className="p-4 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              {total} {total === 1 ? 'duplicado detectado' : 'duplicados detectados'}
            </h3>
            {/* Breakdown */}
            <div className="space-y-1.5 mt-1">
              {selfCount > 0 && (
                <div className="flex items-center justify-between text-xs bg-white/[0.05] rounded-xl px-3 py-2">
                  <span className="text-white/50">Repetidos en el archivo</span>
                  <span className="font-bold text-orange-400">{selfCount}</span>
                </div>
              )}
              {existingCount > 0 && (
                <div className="flex items-center justify-between text-xs bg-white/[0.05] rounded-xl px-3 py-2">
                  <span className="text-white/50">Ya existen en la lista</span>
                  <span className="font-bold text-orange-400">{existingCount}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <button onClick={onKeep}
              className="w-full py-3 px-4 rounded-xl glass-button text-white/80 text-sm font-semibold border border-white/15 hover:bg-white/10 transition-all">
              Conservar todos
              <span className="block text-[11px] text-white/35 font-normal mt-0.5">Útil para sorteos por participaciones</span>
            </button>
            <button onClick={onRemove}
              className="w-full py-3 px-4 rounded-xl bg-blue-500/90 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all">
              Limpiar duplicados
              <span className="block text-[11px] text-blue-200/70 font-normal mt-0.5">Una participación por persona</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Confetti ──────────────────────────────────────── */
const CONFETTI_COLORS = ['#007AFF','#30D158','#FF9F0A','#FF453A','#BF5AF2','#FFFFFF','#FFD60A'];
export const Confetti = ({ active }) => {
  if (!active) return null;
  const particles = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    speed: Math.random() * 2.5 + 2,
    size: Math.random() * 8 + 5,
    rot: Math.random() * 360,
    shape: i % 3,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute"
          style={{
            left: `${p.x}%`, top: -20,
            width: p.size, height: p.size * (p.shape === 2 ? 0.4 : 1),
            backgroundColor: p.color,
            borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '2px' : '1px',
            transform: `rotate(${p.rot}deg)`,
            animation: `confettiFall ${p.speed}s linear ${p.delay}s infinite`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
};

/* ─── Toggle Switch ─────────────────────────────────── */
export const Toggle = ({ checked, onChange }) => (
  <div className={`toggle ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)} role="checkbox" aria-checked={checked} />
);

/* ─── Orb background ────────────────────────────────── */
export const AmbientOrbs = ({ theme }) => {
  const color = theme?.isCustom ? theme.color : theme?.orbColor || 'rgba(0,122,255,0.15)';
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="orb w-[600px] h-[600px] -top-40 -left-20 opacity-60"
        style={{ background: color, animationDelay: '0s' }} />
      <div className="orb w-[500px] h-[500px] -bottom-40 -right-20 opacity-40"
        style={{ background: 'rgba(88,86,214,0.12)', animationDelay: '-4s' }} />
      <div className="orb w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
        style={{ background: 'rgba(255,255,255,0.04)', animationDelay: '-2s' }} />
    </div>
  );
};
