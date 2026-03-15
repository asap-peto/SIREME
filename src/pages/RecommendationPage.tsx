import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { saveCase } from '../services/caseService';
import { Card, Button, GravityBadge, Badge, ScoreBar } from '../components/ui';
import { formatDuration, formatConfidence, CATEGORY_LABELS, CARE_LINE_LABELS, GRAVITY_LABELS } from '../utils';
import { RESOURCE_LABELS } from '../rules/resourceRules';
import { HospitalRecommendation } from '../types';
import { HospitalMap } from '../components/map/HospitalMap';
import { HOSPITALS } from '../mocks/hospitals';

function ConfidencePill({ label, value }: { label: 'Alta' | 'Média' | 'Baixa'; value: number }) {
  const s = label === 'Alta'
    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
    : label === 'Média'
    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
    : 'bg-red-500/20 border-red-500/30 text-red-300';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold font-display ${s}`}>
      <span>{label === 'Alta' ? '●' : label === 'Média' ? '◐' : '○'}</span>
      Confiança {label} — {formatConfidence(value)}
    </span>
  );
}

function HospitalCard({ rec, isTop }: { rec: HospitalRecommendation; isTop?: boolean }) {
  return (
    <Card glow={isTop ? 'blue' : 'none'} className={isTop ? 'border-blue-500/30' : ''}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display flex-shrink-0 ${
            rec.rank === 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
          }`}>{rec.rank}</span>
          <div>
            <p className={`font-semibold font-display ${isTop ? 'text-slate-100 text-base' : 'text-slate-200 text-sm'}`}>
              {rec.hospital.shortName}
            </p>
            <p className="text-slate-500 text-xs font-body">{rec.hospital.neighborhood}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold font-display ${isTop ? 'text-2xl text-blue-300' : 'text-xl text-slate-200'}`}>
            {rec.finalScore}
          </p>
          <p className="text-slate-600 text-[10px] font-body">pts</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {rec.hospital.badges.slice(0, isTop ? 4 : 2).map(b => (
          <Badge key={b} variant="default" size="xs">{b}</Badge>
        ))}
        <ConfidencePill label={rec.confidenceLabel} value={rec.confidence} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs font-body mb-3 p-2 bg-slate-800/30 rounded-lg">
        <div className="text-center">
          <p className="text-slate-500">Distância</p>
          <p className="text-slate-200 font-medium mt-0.5">{rec.distanceKm} km</p>
        </div>
        <div className="text-center border-x border-slate-700/40">
          <p className="text-slate-500">Tempo est.</p>
          <p className="text-amber-300 font-medium mt-0.5">~{rec.estimatedTimeMin} min</p>
        </div>
        <div className="text-center">
          <p className="text-slate-500">Lotação</p>
          <p className={`font-medium mt-0.5 ${
            rec.snapshot.occupancy === 'critica' ? 'text-red-400' :
            rec.snapshot.occupancy === 'alta' ? 'text-amber-400' :
            rec.snapshot.occupancy === 'media' ? 'text-blue-400' : 'text-emerald-400'
          }`}>{rec.snapshot.occupancyPercent}%</p>
        </div>
      </div>

      {isTop && (
        <div className="space-y-2 mb-4">
          <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider">Composição do Score</p>
          <ScoreBar value={rec.score.resource} max={40} label="Recursos Assistenciais" color="bg-emerald-500" />
          <ScoreBar value={rec.score.distance} max={25} label="Distância / Tempo" color="bg-blue-500" />
          <ScoreBar value={rec.score.occupancy} max={20} label="Disponibilidade" color="bg-amber-500" />
          <ScoreBar value={rec.score.specialty} max={15} label="Perfil de Especialidade" color="bg-purple-500" />
          <ScoreBar value={rec.score.operational} max={10} label="Maturidade Operacional" color="bg-cyan-500" />
        </div>
      )}

      {isTop && rec.justification.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
          <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider mb-2">Justificativa</p>
          {rec.justification.map((j, i) => (
            <div key={i} className="flex items-start gap-2 text-xs font-body text-slate-400">
              <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              {j}
            </div>
          ))}
          <div className="flex items-start gap-2 text-xs font-body text-slate-400">
            <CheckCircle2 size={12} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            {rec.hospital.regulationNotes}
          </div>
        </div>
      )}
    </Card>
  );
}

export function RecommendationPage() {
  const navigate = useNavigate();
  const { pendingResult, user, setPendingResult } = useApp();
  const [decisionMode, setDecisionMode] = useState<'confirm' | 'override' | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExcluded, setShowExcluded] = useState(false);
  const [mapSelected, setMapSelected] = useState<string | undefined>(pendingResult?.recommended.hospital.id);

  if (!pendingResult) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-slate-400 font-body">Nenhuma recomendação ativa.</p>
          <Button variant="primary" onClick={() => navigate('/cases/new')}>Iniciar novo caso</Button>
        </div>
      </div>
    );
  }

  const { classification, recommended, alternatives, excluded, caseId, timestamp, timeToRecommendationMs, caseData } = pendingResult;

  const handleSave = async (mode: 'confirm' | 'override') => {
    if (mode === 'override' && !overrideReason.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    const finalHospital = mode === 'confirm'
      ? recommended.hospital
      : (HOSPITALS.find(h => h.id === selectedHospitalId) ?? recommended.hospital);

    const diverged = mode === 'override';

    saveCase({
      caseData,
      recommendation: pendingResult,
      finalHospitalId: finalHospital.id,
      finalHospitalName: finalHospital.name,
      divergedFromSuggestion: diverged,
      overrideReason: mode === 'override' ? overrideReason : undefined,
      regulatorName: user?.name ?? 'Sistema',
    });

    setSaved(true);
    setSaving(false);
    setTimeout(() => {
      setPendingResult(null);
      navigate('/history');
    }, 1200);
  };

  // Map hospitals: recommended + alternatives
  const mapHospitals = [
    recommended.hospital,
    ...alternatives.map(a => a.hospital),
  ].filter((h, i, arr) => arr.findIndex(x => x.id === h.id) === i);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 sticky top-0 bg-slate-950/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cases/new')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-100 font-bold font-display text-lg">Recomendação</h1>
              <span className="text-slate-600 font-mono text-xs">{caseId}</span>
            </div>
            <p className="text-slate-500 text-xs font-body">
              Processado em {formatDuration(timeToRecommendationMs)} ·{' '}
              {new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GravityBadge gravity={classification.gravity} size="md" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

        {/* Classification Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Categoria Clínica', value: CATEGORY_LABELS[classification.category], color: 'text-blue-300' },
            { label: 'Linha de Cuidado', value: CARE_LINE_LABELS[classification.careLine], color: 'text-cyan-300' },
            { label: 'Gravidade', value: GRAVITY_LABELS[classification.gravity], color: classification.gravity === 'critico' ? 'text-red-400' : classification.gravity === 'alto' ? 'text-orange-400' : 'text-amber-400' },
            { label: 'Recursos Obrigatórios', value: classification.requiredResources.length.toString(), color: 'text-slate-200' },
            { label: 'Alertas Clínicos', value: classification.alerts.length.toString(), color: classification.alerts.some(a => a.level === 'critical') ? 'text-red-400' : 'text-amber-400' },
          ].map(item => (
            <div key={item.label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider">{item.label}</p>
              <p className={`font-semibold font-display text-base mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {classification.alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-slate-500 text-xs font-body uppercase tracking-wider">Alertas Clínicos</p>
            {classification.alerts.map(alert => (
              <div
                key={alert.code}
                className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs font-body ${
                  alert.level === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                  alert.level === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                  'bg-slate-800/40 border-slate-700/40 text-slate-400'
                }`}
              >
                <span className="flex-shrink-0 font-mono text-[10px] opacity-60">{alert.code}</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Resources */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classification.requiredResources.length > 0 && (
            <div className="bg-slate-900/60 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-xs font-body font-medium mb-2">⚠ Recursos Obrigatórios</p>
              <div className="flex flex-wrap gap-1.5">
                {classification.requiredResources.map(r => (
                  <Badge key={r} variant="danger" size="xs">{RESOURCE_LABELS[r]}</Badge>
                ))}
              </div>
            </div>
          )}
          {classification.desiredResources.length > 0 && (
            <div className="bg-slate-900/60 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 text-xs font-body font-medium mb-2">✦ Recursos Desejáveis</p>
              <div className="flex flex-wrap gap-1.5">
                {classification.desiredResources.map(r => (
                  <Badge key={r} variant="primary" size="xs">{RESOURCE_LABELS[r]}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommendations */}
          <div className="space-y-4">
            <p className="text-slate-400 text-xs font-body uppercase tracking-wider">Hospital Recomendado</p>
            <HospitalCard rec={recommended} isTop />
            <Card>
              <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider mb-3">Oferta assistencial da unidade recomendada</p>
              <div className="flex flex-wrap gap-1.5">
                {recommended.hospital.offers.map((offer) => (
                  <Badge key={offer} variant="info" size="xs">{offer}</Badge>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-body">
                <div className="rounded-lg bg-slate-800/40 p-2 text-center">
                  <p className="text-slate-500">Fila urgência</p>
                  <p className="text-slate-200 font-semibold">{recommended.snapshot.emergencyQueue} casos</p>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-2 text-center">
                  <p className="text-slate-500">Leitos livres</p>
                  <p className="text-slate-200 font-semibold">{recommended.snapshot.availableBeds}</p>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-2 text-center">
                  <p className="text-slate-500">Status</p>
                  <p className="text-cyan-300 font-semibold">{recommended.snapshot.statusLabel}</p>
                </div>
              </div>
            </Card>

            {alternatives.length > 0 && (
              <>
                <p className="text-slate-500 text-xs font-body uppercase tracking-wider">Alternativas</p>
                {alternatives.map(alt => (
                  <HospitalCard key={alt.hospital.id} rec={alt} />
                ))}
              </>
            )}
          </div>

          {/* Map + Excluded */}
          <div className="space-y-4">
            <p className="text-slate-400 text-xs font-body uppercase tracking-wider">Mapa de Unidades</p>
            <div className="rounded-xl overflow-hidden border border-slate-800/60">
              <HospitalMap
                hospitals={mapHospitals}
                selectedId={mapSelected}
                originLat={caseData.originLat}
                originLng={caseData.originLng}
                onSelect={setMapSelected}
                height="320px"
              />
            </div>

            {/* Excluded hospitals */}
            <div>
              <button
                onClick={() => setShowExcluded(!showExcluded)}
                className="w-full flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800/60 rounded-xl text-xs font-body text-slate-400 hover:border-slate-700 transition-all"
              >
                <span className="flex items-center gap-2">
                  <XCircle size={14} className="text-red-400/60" />
                  {excluded.length} unidades excluídas
                </span>
                {showExcluded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showExcluded && (
                <div className="mt-2 space-y-2 animate-slide-up">
                  {excluded.map(ex => (
                    <div key={ex.hospital.id} className="p-3 bg-slate-900/40 border border-slate-800/40 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-slate-300 text-xs font-semibold font-display">{ex.hospital.shortName}</p>
                        <Badge variant="ghost" size="xs">{ex.hospital.type.toUpperCase()}</Badge>
                      </div>
                      {ex.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] font-body text-slate-500 mt-1">
                          <XCircle size={10} className="text-red-400/50 flex-shrink-0 mt-0.5" />
                          {r}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decision Panel */}
        {!saved ? (
          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-slate-200 mb-1">Decisão do Regulador</h3>
            <p className="text-slate-500 text-xs font-body mb-4">Confirme ou substitua a recomendação. A decisão será registrada no histórico.</p>

            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                variant={decisionMode === 'confirm' ? 'primary' : 'outline'}
                size="md"
                onClick={() => setDecisionMode('confirm')}
                leftIcon={<CheckCircle2 size={14} />}
              >
                Confirmar recomendação
              </Button>
              <Button
                variant={decisionMode === 'override' ? 'secondary' : 'outline'}
                size="md"
                onClick={() => { setDecisionMode('override'); setSelectedHospitalId(''); }}
              >
                Escolher outro hospital
              </Button>
            </div>

            {decisionMode === 'override' && (
              <div className="space-y-3 animate-slide-up">
                <div>
                  <label className="block text-xs font-medium text-slate-400 font-body mb-1.5">Hospital destino final</label>
                  <select
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 font-body focus:outline-none focus:border-blue-500/60"
                    value={selectedHospitalId}
                    onChange={e => setSelectedHospitalId(e.target.value)}
                  >
                    <option value="">Selecionar hospital...</option>
                    {HOSPITALS.filter(h => h.id !== recommended.hospital.id).map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 font-body mb-1.5">
                    Motivo do override <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 font-body placeholder-slate-500 focus:outline-none focus:border-blue-500/60 resize-none"
                    rows={2}
                    placeholder="Ex: Hospital recomendado sem leito UTI disponível no momento. Contato confirmado com H. Trabalhador..."
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            {decisionMode && (
              <Button
                variant="primary"
                size="md"
                className="mt-4"
                leftIcon={<Save size={14} />}
                loading={saving}
                disabled={decisionMode === 'override' && (!selectedHospitalId || !overrideReason.trim())}
                onClick={() => handleSave(decisionMode)}
              >
                Salvar e encerrar caso
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center animate-fade-in">
            <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-300 font-semibold font-display">Caso salvo com sucesso!</p>
            <p className="text-slate-500 text-xs font-body mt-1">Redirecionando para o histórico...</p>
          </div>
        )}
      </div>
    </div>
  );
}
