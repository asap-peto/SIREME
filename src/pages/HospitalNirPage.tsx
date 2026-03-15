import { useState, useEffect, useCallback } from 'react';
import {
  BedDouble, AlertTriangle, LogOut, CheckCircle, Clock,
  Plus, Trash2, Activity, Wrench, Save, RefreshCw, Hospital
} from 'lucide-react';
import { Card, Badge, Button, StatCard } from '../components/ui';
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
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PS_STATUS_CONFIG: Record<PsStatus, { label: string; color: string; badge: 'success' | 'warning' | 'danger' }> = {
  aberto: { label: 'Aberto', color: 'text-emerald-400', badge: 'success' },
  restrito: { label: 'Restrito', color: 'text-amber-400', badge: 'warning' },
  fechado: { label: 'Fechado', color: 'text-red-400', badge: 'danger' },
};

const IMPACT_CONFIG: Record<EquipmentImpact, { label: string; badge: 'info' | 'warning' | 'danger' }> = {
  baixo: { label: 'Baixo', badge: 'info' },
  medio: { label: 'Médio', badge: 'warning' },
  alto: { label: 'Alto', badge: 'danger' },
};

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-400 text-xs font-body">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-lg font-bold transition-colors"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          className="w-16 text-center bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-display font-semibold text-lg py-1 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-lg font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

function AddEquipmentModal({
  onAdd,
  onClose,
}: {
  onAdd: (item: Omit<BrokenEquipmentItem, 'id'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [impact, setImpact] = useState<EquipmentImpact>('medio');
  const [expectedReturn, setExpectedReturn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      since: new Date().toISOString(),
      impact,
      expectedReturn: expectedReturn || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h3 className="text-slate-100 font-semibold font-display text-base mb-4">Registrar Equipamento com Problema</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-body">Nome / descrição do equipamento</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tomógrafo 1, Respirador 5, Hemodinâmica..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 px-3 py-2 text-sm font-body focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-body">Impacto operacional</label>
            <div className="flex gap-2">
              {(['baixo', 'medio', 'alto'] as EquipmentImpact[]).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImpact(i)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-xs font-medium font-body transition-all',
                    impact === i
                      ? i === 'alto'
                        ? 'bg-red-500/20 border-red-500/40 text-red-300'
                        : i === 'medio'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  )}
                >
                  {IMPACT_CONFIG[i].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-body">Previsão de retorno (opcional)</label>
            <input
              type="datetime-local"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 px-3 py-2 text-sm font-body focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={!name.trim()}>
              Registrar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function HospitalNirPage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const hospital = HOSPITALS.find((h) => h.id === user?.hospitalId);

  const [status, setStatus] = useState<HospitalNirStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  useEffect(() => {
    if (!user?.hospitalId || !hospital) return;
    const existing = getNirStatus(user.hospitalId);
    if (existing) {
      setStatus(existing);
    } else {
      const def = createDefaultStatus(user.hospitalId, user.name, hospital.totalBeds, hospital.icuBeds);
      setStatus(def);
    }
  }, [user, hospital]);

  const handleSave = useCallback(() => {
    if (!status) return;
    saveNirStatus({ ...status, updatedBy: user?.name ?? 'NIR', updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [status, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddEquipment = (item: Omit<BrokenEquipmentItem, 'id'>) => {
    if (!status) return;
    const newItem: BrokenEquipmentItem = { ...item, id: `eq-${Date.now()}` };
    setStatus((prev) => prev ? { ...prev, brokenEquipment: [...prev.brokenEquipment, newItem] } : prev);
  };

  const handleRemoveEquipment = (id: string) => {
    if (!status || !user?.hospitalId) return;
    removeBrokenEquipment(user.hospitalId, id);
    setStatus((prev) => prev ? { ...prev, brokenEquipment: prev.brokenEquipment.filter((e) => e.id !== id) } : prev);
  };

  if (!hospital || !status) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 font-body">Carregando...</p>
      </div>
    );
  }

  const totalAvailable =
    status.bedsGeneral + status.bedsIcuAdult + status.bedsIcuPediatric + status.bedsIcuNeonatal + status.bedsObstetric;

  const psConfig = PS_STATUS_CONFIG[status.psStatus];

  return (
    <div className="min-h-screen bg-slate-950">
      {showAddEquipment && (
        <AddEquipmentModal onAdd={handleAddEquipment} onClose={() => setShowAddEquipment(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/60 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hospital.color + '22', border: `1px solid ${hospital.color}44` }}>
              <Hospital size={18} style={{ color: hospital.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-slate-100 font-bold font-display text-sm leading-tight truncate">{hospital.shortName}</p>
              <p className="text-slate-500 text-[10px] font-body leading-tight">Modo NIR · Atualização de Capacidade</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-xs font-body">
                <CheckCircle size={14} />
                Salvo
              </span>
            )}
            <Button variant="primary" size="sm" leftIcon={<Save size={14} />} onClick={handleSave}>
              Salvar
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<LogOut size={14} />} onClick={handleLogout}>
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Leitos Disponíveis" value={totalAvailable} sub="total geral" icon={<BedDouble />} color="blue" />
          <StatCard label="Status do PS" value={psConfig.label} sub={`Fila: ${status.psQueueSize} pac.`} icon={<Activity />} color={status.psStatus === 'aberto' ? 'green' : status.psStatus === 'restrito' ? 'amber' : 'red'} />
          <StatCard label="Equipamentos" value={status.brokenEquipment.length} sub="com problema" icon={<Wrench />} color={status.brokenEquipment.length > 0 ? 'amber' : 'green'} />
          <StatCard
            label="Última atualização"
            value={formatDistanceToNow(new Date(status.updatedAt), { addSuffix: true, locale: ptBR })}
            sub={status.updatedBy}
            icon={<Clock />}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Leitos disponíveis */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <BedDouble size={16} className="text-blue-400" />
              <h2 className="text-slate-100 font-semibold font-display text-sm">Leitos Disponíveis</h2>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <NumberInput
                label="Clínicos / Gerais"
                value={status.bedsGeneral}
                onChange={(v) => setStatus((p) => p ? { ...p, bedsGeneral: v } : p)}
              />
              {hospital.resources.includes('UTI_ADULTO') && (
                <NumberInput
                  label="UTI Adulto"
                  value={status.bedsIcuAdult}
                  onChange={(v) => setStatus((p) => p ? { ...p, bedsIcuAdult: v } : p)}
                />
              )}
              {hospital.resources.includes('UTI_PEDIATRICA') && (
                <NumberInput
                  label="UTI Pediátrica"
                  value={status.bedsIcuPediatric}
                  onChange={(v) => setStatus((p) => p ? { ...p, bedsIcuPediatric: v } : p)}
                />
              )}
              {hospital.resources.includes('UTI_NEONATAL') && (
                <NumberInput
                  label="UTI Neonatal"
                  value={status.bedsIcuNeonatal}
                  onChange={(v) => setStatus((p) => p ? { ...p, bedsIcuNeonatal: v } : p)}
                />
              )}
              {hospital.resources.includes('MATERNIDADE') && (
                <NumberInput
                  label="Obstétricos"
                  value={status.bedsObstetric}
                  onChange={(v) => setStatus((p) => p ? { ...p, bedsObstetric: v } : p)}
                />
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/60">
              <div className="flex justify-between text-xs font-body mb-1">
                <span className="text-slate-400">Referência: total de leitos</span>
                <span className="text-slate-300">{hospital.totalBeds} leitos · {hospital.icuBeds} UTI</span>
              </div>
            </div>
          </Card>

          {/* Pronto-Socorro */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-amber-400" />
              <h2 className="text-slate-100 font-semibold font-display text-sm">Pronto-Socorro / Emergência</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-body">Status do PS</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['aberto', 'restrito', 'fechado'] as PsStatus[]).map((s) => {
                    const cfg = PS_STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus((p) => p ? { ...p, psStatus: s } : p)}
                        className={cn(
                          'py-2.5 rounded-xl border text-xs font-semibold font-body transition-all',
                          status.psStatus === s
                            ? s === 'aberto'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : s === 'restrito'
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Pacientes na fila"
                  value={status.psQueueSize}
                  onChange={(v) => setStatus((p) => p ? { ...p, psQueueSize: v } : p)}
                />
                <NumberInput
                  label="Espera estimada (min)"
                  value={status.psWaitTimeMin}
                  onChange={(v) => setStatus((p) => p ? { ...p, psWaitTimeMin: v } : p)}
                  max={999}
                />
              </div>

              {status.psStatus === 'fechado' && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs font-body">PS fechado será visível para toda a central de regulação.</p>
                </div>
              )}
              {status.psStatus === 'restrito' && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <p className="text-amber-300 text-xs font-body">PS restrito: apenas casos selecionados serão direcionados.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Equipamentos */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-rose-400" />
                <h2 className="text-slate-100 font-semibold font-display text-sm">Equipamentos com Problema</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAddEquipment(true)}
              >
                Registrar
              </Button>
            </div>

            {status.brokenEquipment.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <CheckCircle size={28} className="text-emerald-500/60" />
                <p className="text-slate-500 text-sm font-body">Nenhum equipamento com problema registrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {status.brokenEquipment.map((item) => {
                  const impactCfg = IMPACT_CONFIG[item.impact];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/40"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-slate-200 font-medium font-body text-sm">{item.name}</p>
                          <Badge variant={impactCfg.badge} size="xs">Impacto {impactCfg.label}</Badge>
                        </div>
                        <p className="text-slate-500 text-xs font-body">
                          Desde {formatDistanceToNow(new Date(item.since), { addSuffix: true, locale: ptBR })}
                        </p>
                        {item.expectedReturn && (
                          <p className="text-slate-400 text-xs font-body flex items-center gap-1">
                            <RefreshCw size={10} />
                            Previsão: {new Date(item.expectedReturn).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(item.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                        title="Remover (equipamento resolvido)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Observações gerais */}
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-sky-400" />
              <h2 className="text-slate-100 font-semibold font-display text-sm">Observações Gerais / Alertas ao NIR</h2>
            </div>
            <textarea
              value={status.generalNotes}
              onChange={(e) => setStatus((p) => p ? { ...p, generalNotes: e.target.value } : p)}
              placeholder="Informe restrições operacionais, alertas de capacidade, situações especiais que a central de regulação precisa saber..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-200 px-4 py-3 text-sm font-body focus:outline-none focus:border-blue-500 placeholder:text-slate-600 resize-none"
            />
          </Card>
        </div>

        {/* Save bottom bar */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/60 rounded-xl px-5 py-4">
          <div>
            <p className="text-slate-300 text-sm font-body font-medium">Pronto para enviar?</p>
            <p className="text-slate-500 text-xs font-body">Os dados serão disponibilizados imediatamente para a central de regulação.</p>
          </div>
          <Button variant="primary" size="md" leftIcon={saved ? <CheckCircle size={16} /> : <Save size={16} />} onClick={handleSave}>
            {saved ? 'Salvo!' : 'Salvar atualização'}
          </Button>
        </div>
      </div>
    </div>
  );
}
