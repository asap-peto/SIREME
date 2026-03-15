import { useState, useMemo } from 'react';
import { Building2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { getAllCases, clearAllCases } from '../services/caseService';
import { Card, GravityBadge, Badge, Button } from '../components/ui';
import { formatDate, formatDuration, CATEGORY_LABELS, CARE_LINE_LABELS } from '../utils';
import { SavedCase } from '../types';

function TimelineItem({ label, detail, type, at, isLast }: {
  label: string; detail?: string; type: string; at: string; isLast: boolean;
}) {
  const icons: Record<string, string> = { create: '📋', classify: '🔍', recommend: '🏥', decide: '✅' };
  const colors: Record<string, string> = { create: 'bg-blue-500', classify: 'bg-purple-500', recommend: 'bg-amber-500', decide: 'bg-emerald-500' };
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${colors[type]}`}>
          {icons[type]}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-800 mt-1" />}
      </div>
      <div className={`${isLast ? 'pb-0' : 'pb-4'} min-w-0`}>
        <div className="flex items-center gap-2">
          <p className="text-slate-200 text-xs font-medium font-body">{label}</p>
          <span className="text-slate-600 text-[10px] font-body">{new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {detail && <p className="text-slate-500 text-[11px] font-body mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function CaseRow({ c }: { c: SavedCase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <button
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-all text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-mono text-xs">{c.id}</span>
              <GravityBadge gravity={c.recommendation.classification.gravity} size="xs" />
              <Badge variant="default" size="xs">{CATEGORY_LABELS[c.recommendation.classification.category]}</Badge>
              <Badge variant="info" size="xs">{CARE_LINE_LABELS[c.recommendation.classification.careLine]}</Badge>
              {c.divergedFromSuggestion && <Badge variant="warning" size="xs">Override</Badge>}
            </div>
            <p className="text-slate-300 text-xs font-body mt-1 truncate">
              Pac. {c.caseData.patientId} · {c.caseData.age}a · {c.caseData.sex === 'M' ? 'Masc.' : 'Fem.'} · {c.caseData.origin}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-slate-200 text-xs font-semibold font-display">{c.finalHospitalName.split(' ').slice(0, 3).join(' ')}</p>
            <p className="text-slate-500 text-[10px] font-body">{formatDate(c.savedAt)}</p>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/60 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
          <div>
            <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider mb-3">Detalhes</p>
            <div className="space-y-2 text-xs font-body">
              <div className="flex justify-between">
                <span className="text-slate-500">Regulador</span>
                <span className="text-slate-300">{c.regulatorName}</span>
              </div>
              {c.caseData.regulationCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">REDS / Regulação</span>
                  <span className="text-slate-300">{c.caseData.regulationCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Sugestão SIREME</span>
                <span className="text-slate-300">{c.recommendation.recommended.hospital.shortName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destino final</span>
                <span className={c.divergedFromSuggestion ? 'text-amber-400' : 'text-emerald-400'}>{c.finalHospitalName.split(' ').slice(0, 3).join(' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Score final</span>
                <span className="text-slate-300">{c.recommendation.recommended.finalScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tempo até rec.</span>
                <span className="text-slate-300">{formatDuration(c.recommendation.timeToRecommendationMs)}</span>
              </div>
              {c.divergedFromSuggestion && c.overrideReason && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-amber-400 text-[10px] font-medium">Motivo override:</p>
                  <p className="text-amber-300/80 text-[11px] mt-0.5">{c.overrideReason}</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider mb-3">Timeline do Caso</p>
            <div>
              {c.timeline.map((t, i) => (
                <TimelineItem key={i} {...t} isLast={i === c.timeline.length - 1} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryPage() {
  const [cases, setCases] = useState(() => getAllCases());
  const [filter, setFilter] = useState<'all' | 'critico' | 'override'>('all');

  const filtered = useMemo(() => {
    if (filter === 'critico') return cases.filter(c => c.recommendation.classification.gravity === 'critico');
    if (filter === 'override') return cases.filter(c => c.divergedFromSuggestion);
    return cases;
  }, [cases, filter]);

  const handleClear = () => {
    if (window.confirm('Apagar todo o histórico? Esta ação não pode ser desfeita.')) {
      clearAllCases();
      setCases([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
        <div>
          <h1 className="text-slate-100 text-xl font-bold font-display">Histórico</h1>
          <p className="text-slate-500 text-xs font-body mt-0.5">{cases.length} casos registrados</p>
        </div>
        {cases.length > 0 && (
          <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={handleClear} className="text-red-500 hover:text-red-400">
            Limpar
          </Button>
        )}
      </div>

      <div className="p-6 space-y-5 animate-fade-in">
        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'critico', 'override'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body border transition-all ${
                filter === f
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              {f === 'all' ? `Todos (${cases.length})` : f === 'critico' ? `Críticos (${cases.filter(c => c.recommendation.classification.gravity === 'critico').length})` : `Overrides (${cases.filter(c => c.divergedFromSuggestion).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <Building2 size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-body text-sm">
              {cases.length === 0 ? 'Nenhum caso registrado ainda.' : 'Nenhum caso neste filtro.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => <CaseRow key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
