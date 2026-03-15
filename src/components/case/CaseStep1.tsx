import { CaseFormData, TransportType, CaseType } from '../../types';
import { Card } from '../ui';
import { CURITIBA_ORIGINS } from '../../mocks/hospitals';

interface Props {
  data: CaseFormData;
  onChange: (patch: Partial<CaseFormData>) => void;
}

const transportOptions: { value: TransportType; label: string }[] = [
  { value: 'USB', label: 'USB — Unidade de Suporte Básico' },
  { value: 'USA', label: 'USA — Unidade de Suporte Avançado' },
  { value: 'helicoptero', label: 'Helicóptero' },
  { value: 'particular', label: 'Veículo Particular' },
  { value: 'proprio', label: 'Meios Próprios / Pé' },
];

const caseTypeOptions: { value: CaseType; label: string; desc: string }[] = [
  { value: 'pre_hospitalar', label: 'Pré-Hospitalar', desc: 'Atendimento na cena' },
  { value: 'transferencia', label: 'Transferência', desc: 'Entre unidades' },
  { value: 'vaga_especializada', label: 'Vaga Especializada', desc: 'Recurso específico' },
  { value: 'avaliacao_inicial', label: 'Avaliação Inicial', desc: 'Triagem / UPA' },
];

const inputCls = 'w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 font-body placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-slate-400 font-body mb-1.5';

export function CaseStep1({ data, onChange }: Props) {
  return (
    <div className="space-y-5 animate-slide-up">
      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-4">Identificação do Paciente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>ID / Código do Paciente *</label>
            <input
              className={inputCls}
              placeholder="Ex: PAC-2024-0001"
              value={data.patientId}
              onChange={e => onChange({ patientId: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>REDS / Código de Regulação</label>
            <input
              className={inputCls}
              placeholder="Ex: REDS-CTBA-1042"
              value={data.regulationCode}
              onChange={e => onChange({ regulationCode: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Idade *</label>
            <input
              type="number"
              className={inputCls}
              placeholder="Anos"
              min={0} max={130}
              value={data.age || ''}
              onChange={e => onChange({ age: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={labelCls}>Sexo *</label>
            <div className="flex gap-2">
              {(['M', 'F'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onChange({ sex: s })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium font-body transition-all ${
                    data.sex === s
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {s === 'M' ? '♂ Masculino' : '♀ Feminino'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-4">Localização e Transporte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Ponto de Origem *</label>
            <select
              className={inputCls}
              value={data.origin}
              onChange={e => {
                const opt = CURITIBA_ORIGINS.find(o => o.name === e.target.value);
                onChange({
                  origin: e.target.value,
                  originLat: opt?.lat ?? -25.4296,
                  originLng: opt?.lng ?? -49.2719,
                });
              }}
            >
              <option value="">Selecionar ponto de origem...</option>
              {CURITIBA_ORIGINS.map(o => (
                <option key={o.name} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo de Transporte *</label>
            <select
              className={inputCls}
              value={data.transportType}
              onChange={e => onChange({ transportType: e.target.value as TransportType })}
            >
              <option value="">Selecionar...</option>
              {transportOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-4">Tipo de Regulação</h3>
        <div className="grid grid-cols-2 gap-3">
          {caseTypeOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ caseType: opt.value })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.caseType === opt.value
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <p className={`text-sm font-semibold font-display ${data.caseType === opt.value ? 'text-blue-300' : 'text-slate-300'}`}>
                {opt.label}
              </p>
              <p className="text-xs font-body text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
