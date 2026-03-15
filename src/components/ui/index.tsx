import React from 'react';
import { cn, GRAVITY_STYLES, GRAVITY_LABELS } from '../../utils';
import { GravityLevel } from '../../types';

// ─── Badge ────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const badgeVariants = {
  default: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
  primary: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger: 'bg-red-500/20 text-red-300 border-red-500/30',
  info: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  ghost: 'bg-transparent text-slate-400 border-slate-700/40',
};

const badgeSizes = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border font-medium font-body',
      badgeVariants[variant],
      badgeSizes[size],
      className
    )}>
      {children}
    </span>
  );
}

// ─── GravityBadge ─────────────────────────────────────────────────
export function GravityBadge({ gravity, size = 'sm' }: { gravity: GravityLevel; size?: 'xs' | 'sm' | 'md' }) {
  const s = GRAVITY_STYLES[gravity];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border font-semibold font-display',
      s.bg, s.text, s.border,
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot, gravity === 'critico' && 'animate-pulse')} />
      {GRAVITY_LABELS[gravity]}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const btnVariants = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/50 shadow-lg shadow-blue-500/20',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600/50',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-red-500/50',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-transparent',
  outline: 'bg-transparent hover:bg-slate-800/50 text-slate-300 border-slate-600/50',
};

const btnSizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function Button({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-medium font-body transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        btnVariants[variant],
        btnSizes[size],
        className
      )}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  glow?: 'blue' | 'red' | 'green' | 'none';
}

export function Card({ children, className, noPadding, glow = 'none' }: CardProps) {
  const glowStyles = {
    blue: 'shadow-lg shadow-blue-500/10 border-blue-500/20',
    red: 'shadow-lg shadow-red-500/10 border-red-500/20',
    green: 'shadow-lg shadow-emerald-500/10 border-emerald-500/20',
    none: 'border-slate-800/60',
  };
  return (
    <div className={cn(
      'bg-slate-900/80 backdrop-blur-sm rounded-xl border',
      glowStyles[glow],
      !noPadding && 'p-5',
      className
    )}>
      {children}
    </div>
  );
}

// ─── Loader / Spinner ─────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-3 h-3 border', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-2' };
  return (
    <span className={cn('rounded-full border-slate-600 border-t-blue-400 animate-spin inline-block', s[size])} />
  );
}

export function PageLoader({ label = 'Processando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-blue-400 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-blue-600/30 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-slate-400 text-sm font-body">{label}</p>
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────
interface ScoreBarProps {
  value: number;
  max: number;
  label: string;
  color?: string;
}

export function ScoreBar({ value, max, label, color = 'bg-blue-500' }: ScoreBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'red' | 'green' | 'amber';
}

const statColors = {
  blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10' },
  red: { icon: 'text-red-400', bg: 'bg-red-500/10' },
  green: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export function StatCard({ label, value, sub, icon, color = 'blue' }: StatCardProps) {
  const c = statColors[color];
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', c.bg)}>
          <span className={cn('text-xl', c.icon)}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-slate-400 text-xs font-body mb-0.5">{label}</p>
        <p className="text-slate-100 text-xl font-semibold font-display leading-tight">{value}</p>
        {sub && <p className="text-slate-500 text-xs font-body mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Section Header ───────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-slate-100 font-semibold font-display text-lg">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm font-body mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-slate-800/60', className)} />;
}

// ─── OccupancyBar ─────────────────────────────────────────────────
export function OccupancyBar({ percent, level }: { percent: number; level: string }) {
  const colors: Record<string, string> = {
    baixa: 'bg-emerald-500',
    media: 'bg-blue-500',
    alta: 'bg-amber-500',
    critica: 'bg-red-500',
  };
  const textColors: Record<string, string> = {
    baixa: 'text-emerald-400',
    media: 'text-blue-400',
    alta: 'text-amber-400',
    critica: 'text-red-400',
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-slate-400">Lotação</span>
        <span className={textColors[level]}>{percent}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', colors[level])} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
