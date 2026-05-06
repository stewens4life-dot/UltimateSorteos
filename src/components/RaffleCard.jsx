import React, { useMemo } from 'react';
import {
  Trophy, Play, Edit3, Eye, RotateCcw, Trash2, Copy, CheckCircle,
  Users, Shield, Clock, Plus
} from 'lucide-react';

const THEMES_MAP = {
  blue:   { orbColor: 'rgba(0,122,255,0.18)',   accent: '#007AFF', from: '#007AFF', to: '#0055CC' },
  purple: { orbColor: 'rgba(94,92,230,0.18)',   accent: '#5E5CE6', from: '#5E5CE6', to: '#3634A3' },
  green:  { orbColor: 'rgba(48,209,88,0.15)',   accent: '#30D158', from: '#30D158', to: '#248A3D' },
  orange: { orbColor: 'rgba(255,159,10,0.15)',  accent: '#FF9F0A', from: '#FF9F0A', to: '#C93400' },
  pink:   { orbColor: 'rgba(255,55,95,0.15)',   accent: '#FF375F', from: '#FF375F', to: '#D70015' },
};

export function getTheme(config) {
  if (config?.colorTheme === 'custom') {
    return { isCustom: true, id: 'custom', color: config.customColor || '#007AFF', orbColor: config.customColor + '30' };
  }
  const id = config?.colorTheme || 'blue';
  const t = THEMES_MAP[id] || THEMES_MAP.blue;
  return { ...t, id };
}

export function accentStyle(theme, type = 'bg') {
  if (!theme.isCustom) return {};
  if (type === 'bg') return { background: `linear-gradient(135deg, ${theme.color}, ${adjustColor(theme.color, -30)})` };
  if (type === 'text') return { color: theme.color };
  if (type === 'border') return { borderColor: theme.color };
  if (type === 'glow') return { boxShadow: `0 0 40px ${theme.color}40` };
  return {};
}

export function accentClass(theme, type = 'bg') {
  if (theme.isCustom) return '';
  const t = THEMES_MAP[theme.id] || THEMES_MAP.blue;
  if (type === 'bg') return 'bg-[var(--t-from)]';
  return '';
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}

export function GradientBtn({ theme, onClick, children, className = '', disabled = false }) {
  const style = theme.isCustom
    ? { background: `linear-gradient(135deg, ${theme.color}, ${adjustColor(theme.color, -30)})` }
    : { background: `linear-gradient(135deg, ${THEMES_MAP[theme.id]?.from || '#007AFF'}, ${THEMES_MAP[theme.id]?.to || '#0055CC'})` };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 font-semibold text-white rounded-xl transition-all duration-200
        hover:opacity-90 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed
        shadow-lg ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

/* ─── Raffle Card ───────────────────────────────────── */
export function RaffleCard({ raffle, onLaunch, onEdit, onDuplicate, onDelete, onReset }) {
  const theme = useMemo(() => getTheme(raffle.config), [raffle.config]);
  const isDone = raffle.status === 'completed';
  const accentColor = theme.isCustom ? theme.color : THEMES_MAP[theme.id]?.accent || '#007AFF';

  return (
    <div
      className={`glass-card rounded-3xl p-5 flex flex-col gap-4 cursor-pointer group transition-all duration-300
        hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden
        ${isDone ? 'border-[rgba(48,209,88,0.2)]' : ''}`}
      onClick={() => isDone ? onLaunch() : onEdit()}
    >
      {/* Shimmer */}
      <div className="shimmer absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl"
          style={{ background: isDone ? 'rgba(48,209,88,0.15)' : `${accentColor}20`, border: `1px solid ${isDone ? 'rgba(48,209,88,0.3)' : accentColor + '30'}` }}>
          {isDone
            ? <CheckCircle size={18} className="text-green-400" />
            : <Trophy size={18} style={{ color: accentColor }} />}
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          {isDone && (
            <button onClick={onReset} className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-white/30 hover:text-yellow-400 transition-colors" title="Reiniciar">
              <RotateCcw size={14} />
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors" title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-base leading-tight line-clamp-1 mb-2 group-hover:text-white transition-colors">
          {raffle.title}
        </h3>
        {isDone ? (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-green-400 uppercase tracking-wider mb-1">Ganadores</p>
            {raffle.results?.slice(0,3).map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                <span className="text-white/25 tabular-nums w-4 text-right">{i+1}.</span>
                <span className="truncate">{w}</span>
              </div>
            ))}
            {(raffle.results?.length || 0) > 3 && (
              <p className="text-[11px] text-white/30">+{raffle.results.length - 3} más</p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Users size={11} /><span>{raffle.participants?.length || 0} participantes</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Trophy size={11} /><span>{raffle.config?.numWinners || 1} ganador(es)</span>
            </div>
            {(raffle.config?.numSubstitutes || 0) > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Shield size={11} /><span>{raffle.config.numSubstitutes} suplente(s)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
        <GradientBtn theme={theme} onClick={onLaunch}
          className="flex-1 py-2 text-xs">
          {isDone ? <><Eye size={13}/>Ver resultados</> : <><Play size={13} fill="currentColor"/>Lanzar</>}
        </GradientBtn>
        {!isDone && (
          <button onClick={onEdit}
            className="flex-1 py-2 rounded-xl glass-button text-white/60 hover:text-white text-xs flex items-center justify-center gap-1.5">
            <Edit3 size={13}/>Editar
          </button>
        )}
      </div>

      {/* Updated time */}
      <div className="flex items-center gap-1 text-[10px] text-white/20">
        <Clock size={9} />
        <span>{new Date(raffle.updatedAt || Date.now()).toLocaleDateString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
      </div>
    </div>
  );
}

/* ─── New Card Button ───────────────────────────────── */
export function NewRaffleCard({ onClick }) {
  return (
    <button onClick={onClick}
      className="glass-card rounded-3xl p-5 flex flex-col items-center justify-center gap-3 h-full min-h-[220px]
        border-dashed border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]
        group transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center group-hover:scale-110 transition-transform">
        <Plus size={22} className="text-white/40 group-hover:text-white/70 transition-colors" />
      </div>
      <span className="text-xs font-medium text-white/30 group-hover:text-white/60 uppercase tracking-widest transition-colors">
        Nuevo sorteo
      </span>
    </button>
  );
}

export { THEMES_MAP };
