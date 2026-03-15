import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, AlertTriangle, LogOut, CheckCircle, Clock,
  Plus, Trash2, Activity, Wrench, Save, RefreshCw, Hospital,
  Users, Timer, MessageSquare, ChevronRight
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { useApp } from '../context/AppContext';
import { HOSPITALS } from '../mocks/hospitals';
import {
  getNirStatus,
  saveNirStatus,
  removeBrokenEquipment,
  createDefaultStatus,
} from '../services/nirHospitalService';
import { HospitalNirStatus, BrokenEquipmentItem, PsStatus, EquipmentImpact } from '../types';
import { cn } from '../utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Config ───────────────────────────────────────────────────────────────────

const PS_STATUS_OPTIONS: { value: PsStatus; label: string; desc: string; color: string; active: string }[] = [
  { value: 'aberto',   label: 'Aberto',   desc: 'Recebendo todos os casos',   color: 'border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400', active: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' },
  { value: 'restrito', label: 'Restrito', desc: 'Apenas casos selecionados',  color: 'border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400',   active: 'bg-amber-500/15 border-amber-500/50 text-amber-300' },
  { value: 'fechado',  label: 'Fechado',  desc: 'PS não recebe novos casos',  color: 'border-slate-700 text-slate-400 hover:border-red-500/40 hover:text-red-400',     active: 'bg-red-500/15 border-red-500/50 text-red-300' },
];

const IMPACT_OPTIONS: { value: EquipmentImpact; label: string; active: string }[] = [
  { value: 'baixo', label: 'Baixo impacto', active: 'bg-sky-500/15 border-sky-500/50 text-sky-300' },
  { value: 'medio', label: 'Médio impacto', active: 'bg-amber-500/15 border-amber-500/50 text-amber-300' },
  { value: 'alto',  label: 'Alto impacto',  active: 'bg-red-500/15 border-red-500/50 text-red-300' },
];

const IMPACT_BADGE: Record<EquipmentImpact, 'info' | 'warning' | 'danger'> = {
  baixo: 'info', medio: 'warning', alto: 'danger',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function NumberStepper({ label, sub, value, onChange, min = 0, max = 999 }: {
  label: string; sub?: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="bg-slate-800/40 rounded-xl p-3 space-y-2">
      <div>
        <p className="text-slate-300 text-xs font-medium font-body">{label}</p>
        {sub && <p className="text-slate-600 text-[10px] font-body">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold transition-colors text-lg leading-none">−</button>
        <input type="number" min={min} max={max} value={value}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          className="w-14 text-center bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-display font-bold text-xl py-1 focus:outline-none focus:border-blue-500" />
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center font-bold transition-colors text-lg leading-none">+</button>
      </div>
    </div>
  );
}

function AddEquipmentModal({ onAdd, onClose }: {
  onAdd: (item: Omit<BrokenEquipmentItem, 'id'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [impact, setImpact] = useState<EquipmentImpact>('medio');
  const [expectedReturn, setExpectedReturn] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-5">
          <Wrench size={16} className="text-rose-400" />
          <h3 className="text-slate-100 font-semibold font-display text-sm">Registrar Equipamento com Problema</h3>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; onAdd({ name: name.trim(), since: new Date().toISOString(), impact, expectedReturn: expectedReturn || undefined }); onClose(); }}
          className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-body">Nome / descrição</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Tomógrafo 1, Respirador UTI 3, Hemodinâmica..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-100 px-3 py-2.5 text-sm font-body focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-body">Impacto no atendimento</label>
            <div className="grid grid-cols-3 gap-2">
              {IMPACT_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setImpact(opt.value)}
                  className={cn('py-2 rounded-xl border text-xs font-semibold font-body transition-all',
                    impact === opt.value ? opt.active : 'bg-slate-800 border-slate-700 text-slate-400')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-body">Previsão de retorno (opcional)</label>
            <input type="datetime-local" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-100 px-3 py-2 text-sm font-body focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={!name.trim()}>Registrar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function HospitalNirPage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const hospital = HOSPITALS.find(h => h.id === user?.hospitalId);
  const isUpa = hospital?.type === 'upa';

  const [status, setStatus] = useState<HospitalNirStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveTime, setSaveTime] = useState<Date | null>(null);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [activeSection, setActiveSection] = useState<'leitos' | 'ps' | 'equipamentos' | 'notas'>('ps');

  useEffect(() => {
    if (!user?.hospitalId || !hospital) return;
    const existing = getNirStatus(user.hospitalId);
    if (existing) {
      setStatus(existing);
      setSaveTime(new Date(existing.updatedAt));
    } else {
      const def = createDefaultStatus(user.hospitalId, user.name, hospital.totalBeds, hospital.icuBeds);
      setStatus(def);
    }
  }, [user, hospital]);

  const handleSave = useCallback(() => {
    if (!status) return;
    const now = new Date();
    const updated = { ...status, updatedBy: user?.name ?? 'NIR', updatedAt: now.toISOString() };
    saveNirStatus(updated);
    setStatus(updated);
    setSaved(true);
    setSaveTime(now);
    setTimeout(() => setSaved(false), 3000);
  }, [status, user]);

  const handleAddEquipment = (item: Omit<BrokenEquipmentItem, 'id'>) => {
    const newItem: BrokenEquipmentItem = { ...item, id: `eq-${Date.now()}` };
    setStatus(p => p ? { ...p, brokenEquipment: [...p.brokenEquipment, newItem] } : p);
  };

  const handleRemoveEquipment = (id: string) => {
    if (!user?.hospitalId) return;
    removeBrokenEquipment(user.hospitalId, id);
    setStatus(p => p ? { ...p, brokenEquipment: p.brokenEquipment.filter(e => e.id !== id) } : p);
  };

  const updateStatus = <K extends keyof HospitalNirStatus>(key: K, val: HospitalNirStatus[K]) =>
    setStatus(p => p ? { ...p, [key]: val } : p);

  if (!hospital || !status) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-500 font-body text-sm">Carregando...</p>
    </div>
  );

  const isStale = saveTime ? differenceInMinutes(new Date(), saveTime) > 30 : false;
  const psOption = PS_STATUS_OPTIONS.find(o => o.value === status.psStatus)!;
  const totalBeds = status.bedsGeneral + status.bedsIcuAdult + status.bedsIcuPediatric + status.bedsIcuNeonatal + status.bedsObstetric;

  const NAV_SECTIONS = [
    { id: 'ps' as const, label: isUpa ? 'PS / Atendimento' : 'Pronto-Socorro', icon: Activity,
      alert: status.psStatus !== 'aberto' },
    { id: 'leitos' as const, label: isUpa ? 'Observação' : 'Leitos', icon: BedDouble, alert: false },
    { id: 'equipamentos' as const, label: 'Equipamentos', icon: Wrench,
      alert: status.brokenEquipment.some(e => e.impact === 'alto') },
    { id: 'notas' as const, label: 'Observações', icon: MessageSquare,
      alert: !!status.generalNotes },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {showAddEquipment && (
        <AddEquipmentModal onAdd={handleAddEquipment} onClose={() => setShowAddEquipment(false)} />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: hospital.color + '22', border: `1px solid ${hospital.color}44` }}>
              <Hospital size={17} style={{ color: hospital.color }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-slate-100 font-bold font-display text-sm leading-tight truncate">{hospital.shortName}</p>
                {isUpa && <Badge variant="warning" size="xs">UPA</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-slate-500 text-[10px] font-body leading-tight">NIR · {hospital.neighborhood}</p>
                {isStale && (
                  <span className="text-amber-400 text-[10px] font-body flex items-center gap-1">
                    <AlertTriangle size={9} />dados desatualizados
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {saved && (
              <span className="hidden sm:flex items-center gap-1 text-emerald-400 text-xs font-body">
                <CheckCircle size={12} />Salvo
              </span>
            )}
            <Button variant="primary" size="sm" leftIcon={saved ? <CheckCircle size={13} /> : <Save size={13} />} onClick={handleSave}>
              {saved ? 'Salvo!' : 'Salvar'}
            </Button>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Status summary bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-3 flex-wrap">
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-body border',
            status.psStatus === 'aberto' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : status.psStatus === 'restrito' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300')}>
            <span className={cn('w-1.5 h-1.5 rounded-full',
              status.psStatus === 'aberto' ? 'bg-emerald-400 animate-pulse'
              : status.psStatus === 'restrito' ? 'bg-amber-400'
              : 'bg-red-400')} />
            PS {psOption.label}
          </div>
          <span className="text-slate-600 text-xs font-body">
            {isUpa ? 'Obs.' : 'Leitos'}: <span className="text-slate-300 font-medium">{totalBeds}</span>
          </span>
          {status.brokenEquipment.length > 0 && (
            <span className="text-rose-400 text-xs font-body flex items-center gap-1">
              <Wrench size={10} />{status.brokenEquipment.length} equipamento{status.brokenEquipment.length > 1 ? 's' : ''} c/ problema
            </span>
          )}
          {saveTime && (
            <span className="text-slate-600 text-[10px] font-body ml-auto hidden sm:block">
              Atualizado {formatDistanceToNow(saveTime, { addSuffix: true, locale: ptBR })}
            </span>
          )}
        </div>
      </header>

      {/* ── Section nav ── */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <div className="grid grid-cols-4 gap-1.5">
          {NAV_SECTIONS.map(({ id, label, icon: Icon, alert }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-[10px] font-semibold font-body transition-all relative',
                activeSection === id
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700'
              )}>
              <Icon size={15} />
              <span className="leading-tight text-center">{label}</span>
              {alert && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-1 space-y-4 animate-fade-in">

        {/* PS / Atendimento */}
        {activeSection === 'ps' && (
          <div className="space-y-4">
            <Card>
              <p className="text-slate-400 text-xs font-body mb-3">Status do {isUpa ? 'Atendimento' : 'Pronto-Socorro'}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PS_STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => updateStatus('psStatus', opt.value)}
                    className={cn('flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold font-body transition-all',
                      status.psStatus === opt.value ? opt.active : opt.color + ' bg-slate-900')}>
                    <span className="font-bold">{opt.label}</span>
                    <span className="text-[9px] font-normal opacity-70 text-center leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Motivo de restrição (Corti-style — contextual field) */}
              {status.psStatus !== 'aberto' && (
                <div className="space-y-1.5 mb-4">
                  <label className="text-slate-400 text-xs font-body">
                    Motivo da {status.psStatus === 'fechado' ? 'interdição' : 'restrição'} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={status.generalNotes}
                    onChange={e => updateStatus('generalNotes', e.target.value)}
                    placeholder={status.psStatus === 'fechado'
                      ? 'Ex: Superlotação crítica, aguardando transferências. Contato: ramal 1234...'
                      : 'Ex: Restrito a casos clínicos leves, sem vagas de observação adulto...'}
                    rows={3}
                    className="w-full bg-slate-800 border border-amber-500/30 rounded-xl text-slate-200 px-3 py-2.5 text-xs font-body focus:outline-none focus:border-amber-500/60 placeholder:text-slate-600 resize-none"
                  />
                  <p className="text-slate-600 text-[10px] font-body">Este texto fica visível para a central de regulação.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <NumberStepper
                  label={isUpa ? 'Pacientes em atendimento' : 'Pacientes na fila'}
                  sub="aguardando ou em sala"
                  value={status.psQueueSize}
                  onChange={v => updateStatus('psQueueSize', v)}
                />
                <NumberStepper
                  label="Espera estimada"
                  sub="minutos"
                  value={status.psWaitTimeMin}
                  onChange={v => updateStatus('psWaitTimeMin', v)}
                  max={999}
                />
              </div>
            </Card>

            {status.psStatus === 'fechado' && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-xs font-semibold font-body">PS marcado como FECHADO</p>
                  <p className="text-red-400/70 text-[10px] font-body mt-0.5">A central de regulação será informada e nenhum caso será direcionado até a reabertura.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leitos / Observação */}
        {activeSection === 'leitos' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-100 font-semibold font-display text-sm">
                  {isUpa ? 'Capacidade de Observação' : 'Leitos Disponíveis'}
                </p>
                <p className="text-slate-500 text-xs font-body mt-0.5">
                  Referência: {hospital.totalBeds} leitos totais{hospital.icuBeds > 0 ? ` · ${hospital.icuBeds} UTI` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-100 font-bold font-display text-2xl">{totalBeds}</p>
                <p className="text-slate-500 text-[10px] font-body">{isUpa ? 'vagas obs.' : 'total livre'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberStepper
                label={isUpa ? 'Leitos de observação' : 'Clínicos / Gerais'}
                sub={isUpa ? 'adulto + pediátrico' : 'enfermaria e semelhantes'}
                value={status.bedsGeneral}
                onChange={v => updateStatus('bedsGeneral', v)}
              />
              {hospital.resources.includes('UTI_ADULTO') && (
                <NumberStepper label="UTI Adulto" sub="vagas livres" value={status.bedsIcuAdult} onChange={v => updateStatus('bedsIcuAdult', v)} />
              )}
              {hospital.resources.includes('UTI_PEDIATRICA') && (
                <NumberStepper label="UTI Pediátrica" sub="vagas livres" value={status.bedsIcuPediatric} onChange={v => updateStatus('bedsIcuPediatric', v)} />
              )}
              {hospital.resources.includes('UTI_NEONATAL') && (
                <NumberStepper label="UTI Neonatal" sub="vagas livres" value={status.bedsIcuNeonatal} onChange={v => updateStatus('bedsIcuNeonatal', v)} />
              )}
              {hospital.resources.includes('MATERNIDADE') && (
                <NumberStepper label="Obstétricos" sub="vagas livres" value={status.bedsObstetric} onChange={v => updateStatus('bedsObstetric', v)} />
              )}
            </div>

            {isUpa && (
              <div className="mt-4 bg-slate-800/30 rounded-xl p-3 flex items-start gap-2">
                <Users size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-500 text-[10px] font-body leading-relaxed">
                  UPAs informam vagas de observação (leitos de estabilização). Casos estáveis que precisam de vaga definitiva
                  devem ser regulados pela central.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Equipamentos */}
        {activeSection === 'equipamentos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-100 font-semibold font-display text-sm">Equipamentos com Problema</p>
                <p className="text-slate-500 text-xs font-body">Informe falhas que impactam o atendimento</p>
              </div>
              <Button variant="outline" size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowAddEquipment(true)}>
                Registrar
              </Button>
            </div>

            {status.brokenEquipment.length === 0 ? (
              <Card className="flex flex-col items-center py-10 gap-2">
                <CheckCircle size={28} className="text-emerald-500/50" />
                <p className="text-slate-500 text-sm font-body">Nenhum equipamento com problema</p>
                <button onClick={() => setShowAddEquipment(true)}
                  className="text-slate-600 text-xs font-body hover:text-slate-400 flex items-center gap-1 mt-1">
                  <Plus size={11} />Registrar um problema
                </button>
              </Card>
            ) : (
              status.brokenEquipment.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-slate-200 font-semibold font-body text-sm">{item.name}</p>
                        <Badge variant={IMPACT_BADGE[item.impact]} size="xs">
                          {item.impact === 'alto' ? 'Alto impacto' : item.impact === 'medio' ? 'Médio impacto' : 'Baixo impacto'}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-xs font-body">
                        Registrado {formatDistanceToNow(new Date(item.since), { addSuffix: true, locale: ptBR })}
                      </p>
                      {item.expectedReturn && (
                        <p className="text-slate-400 text-xs font-body flex items-center gap-1">
                          <RefreshCw size={10} />
                          Retorno previsto: {new Date(item.expectedReturn).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleRemoveEquipment(item.id)}
                      className="p-2 rounded-lg text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex-shrink-0"
                      title="Marcar como resolvido">
                      <CheckCircle size={15} />
                    </button>
                  </div>
                </Card>
              ))
            )}

            <p className="text-slate-600 text-[10px] font-body text-center pt-1">
              Clique em <CheckCircle size={9} className="inline" /> para marcar equipamento como resolvido
            </p>
          </div>
        )}

        {/* Observações */}
        {activeSection === 'notas' && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={15} className="text-sky-400" />
              <div>
                <p className="text-slate-100 font-semibold font-display text-sm">Observações para a Regulação</p>
                <p className="text-slate-500 text-xs font-body">Visíveis para todos os reguladores da central</p>
              </div>
            </div>

            {/* Quick-fill suggestions */}
            {!status.generalNotes && (
              <div className="mb-3 flex flex-wrap gap-2">
                {['Sem vagas de UTI nesta data', 'Aguardando manutenção de equipamentos', 'Restrição temporária: apenas casos leves'].map(s => (
                  <button key={s} onClick={() => updateStatus('generalNotes', s)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 border border-slate-800 rounded-lg px-2 py-1 hover:border-slate-600 hover:text-slate-300 transition-all font-body">
                    <ChevronRight size={9} />{s}
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={status.generalNotes}
              onChange={e => updateStatus('generalNotes', e.target.value)}
              placeholder="Informe restrições operacionais, alertas de capacidade, contatos, situações que a central precisa saber..."
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-200 px-4 py-3 text-sm font-body focus:outline-none focus:border-blue-500 placeholder:text-slate-600 resize-none"
            />
            <p className="text-slate-600 text-[10px] font-body mt-2">{status.generalNotes.length} caracteres</p>
          </Card>
        )}

        {/* Save bar */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            {saveTime ? (
              <>
                <Timer size={13} className={isStale ? 'text-amber-400' : 'text-emerald-400'} />
                <p className={cn('text-xs font-body', isStale ? 'text-amber-400' : 'text-slate-400')}>
                  {isStale ? 'Dados desatualizados — atualize' : `Atualizado ${formatDistanceToNow(saveTime, { addSuffix: true, locale: ptBR })}`}
                </p>
              </>
            ) : (
              <p className="text-slate-500 text-xs font-body">Nenhuma atualização enviada ainda</p>
            )}
          </div>
          <Button variant="primary" size="sm" leftIcon={saved ? <CheckCircle size={13} /> : <Save size={13} />} onClick={handleSave}>
            {saved ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
