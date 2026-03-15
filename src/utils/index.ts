import { GravityLevel, ClinicalCategory, CareLine } from '../types';

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${seconds % 60}s`;
}

export function formatScore(score: number): string {
  return `${Math.min(100, Math.round(score))}/100`;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function generateCaseId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `REG-${yy}${mm}${dd}-${seq}`;
}

export const GRAVITY_STYLES: Record<GravityLevel, { bg: string; text: string; border: string; dot: string }> = {
  critico: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' },
  alto: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  moderado: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' },
  baixo: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
};

export const CATEGORY_LABELS: Record<ClinicalCategory, string> = {
  cardiologico: 'Cardiológico',
  neurologico: 'Neurológico',
  trauma: 'Trauma',
  infeccioso: 'Infeccioso',
  obstetrico: 'Obstétrico',
  pediatrico: 'Pediátrico',
  clinico_geral: 'Clínico Geral',
};

export const CARE_LINE_LABELS: Record<CareLine, string> = {
  linha_cardio: 'Linha Cardio',
  linha_neuro: 'Linha AVC / Neuro',
  linha_trauma: 'Linha Trauma',
  linha_infeccao: 'Linha Sepse / Infecção',
  linha_materno_infantil: 'Linha Materno-Infantil',
  linha_pediatrica: 'Linha Pediátrica',
  linha_clinica: 'Linha Clínica Geral',
};

export const GRAVITY_LABELS: Record<GravityLevel, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  moderado: 'Moderado',
  baixo: 'Baixo',
};
