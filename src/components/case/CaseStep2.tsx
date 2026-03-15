import { CaseFormData, ConsciousnessLevel, TriageTag, VitalSigns } from '../../types';
import { Card } from '../ui';

interface Props {
  data: CaseFormData;
  onChange: (patch: Partial<CaseFormData>) => void;
}

const consciousnessOptions: { value: ConsciousnessLevel; label: string; color: string }[] = [
  { value: 'alerta', label: 'Alerta (15)', color: 'text-emerald-400' },
  { value: 'confuso', label: 'Confuso (13–14)', color: 'text-amber-400' },
  { value: 'soporoso', label: 'Soporoso (9–12)', color: 'text-orange-400' },
  { value: 'inconsciente', label: 'Inconsciente (<9)', color: 'text-red-400' },
  { value: 'glasgow', label: 'Glasgow Manual', color: 'text-blue-400' },
];

const inputCls = 'w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 font-body placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-slate-400 font-body mb-1.5';

const triageOptions: { value: TriageTag; label: string; tone: string }[] = [
  { value: 'dor_toracica_isquemica', label: 'Dor torácica isquêmica', tone: 'text-rose-300' },
  { value: 'deficit_focal_agudo', label: 'Déficit focal agudo', tone: 'text-sky-300' },
  { value: 'insuficiencia_respiratoria', label: 'Insuficiência respiratória', tone: 'text-cyan-300' },
  { value: 'choque_hipotensivo', label: 'Choque / hipotensão', tone: 'text-amber-300' },
  { value: 'politrauma_mecanismo', label: 'Politrauma / mecanismo maior', tone: 'text-orange-300' },
  { value: 'gestante_alto_risco', label: 'Gestante alto risco', tone: 'text-pink-300' },
  { value: 'sepse_provavel', label: 'Sepse provável', tone: 'text-lime-300' },
  { value: 'crianca_risco', label: 'Criança em risco', tone: 'text-emerald-300' },
];

function VitalInput({ label, unit, value, onChange, placeholder, min, max, warn }: {
  label: string; unit: string; value: number | undefined; onChange: (v: number | undefined) => void;
  placeholder?: string; min?: number; max?: number; warn?: boolean;
}) {
  return (
    <div>
      <label className={labelCls}>{label} <span className="text-slate-600">({unit})</span></label>
      <div className="relative">
        <input
          type="number"
          className={`${inputCls} ${warn ? 'border-amber-500/50 focus:border-amber-500/70' : ''}`}
          placeholder={placeholder}
          min={min} max={max}
          value={value ?? ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
        {warn && value !== undefined && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 text-xs">⚠</span>
        )}
      </div>
    </div>
  );
}

export function CaseStep2({ data, onChange }: Props) {
  const updateVital = (key: keyof VitalSigns, val: number | undefined) => {
    onChange({ vitalSigns: { ...data.vitalSigns, [key]: val } });
  };
  const toggleTriage = (value: TriageTag) => {
    const active = data.triageTags.includes(value);
    onChange({ triageTags: active ? data.triageTags.filter((tag) => tag !== value) : [...data.triageTags, value] });
  };

  const v = data.vitalSigns;
  const spO2Warn = v.saturacaoO2 !== undefined && v.saturacaoO2 < 94;
  const bpWarn = v.pressuraSistolica !== undefined && v.pressuraSistolica < 90;
  const hrWarn = v.frequenciaCardiaca !== undefined && (v.frequenciaCardiaca > 130 || v.frequenciaCardiaca < 50);

  return (
    <div className="space-y-5 animate-slide-up">
      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-4">Dados Clínicos</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Queixa Principal *</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Descreva a queixa principal do paciente..."
              value={data.chiefComplaint}
              onChange={e => onChange({ chiefComplaint: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Suspeita Clínica *</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Ex: Suspeita de IAM com supra de ST em V1-V4, Killip II..."
              value={data.clinicalSuspicion}
              onChange={e => onChange({ clinicalSuspicion: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-1">Sinais Vitais</h3>
        <p className="text-slate-500 text-xs font-body mb-4">Campos marcados com ⚠ indicam valor fora do padrão</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>PA Sistólica <span className="text-slate-600">(mmHg)</span></label>
            <div className="flex gap-1.5 items-center">
              <input
                type="number" className={`${inputCls} ${bpWarn ? 'border-amber-500/50' : ''}`}
                placeholder="120" min={0} max={300}
                value={v.pressuraSistolica ?? ''}
                onChange={e => updateVital('pressuraSistolica', e.target.value ? Number(e.target.value) : undefined)}
              />
              <span className="text-slate-600 text-sm">/</span>
              <input
                type="number" className={inputCls}
                placeholder="80" min={0} max={200}
                value={v.pressuraDiastolica ?? ''}
                onChange={e => updateVital('pressuraDiastolica', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>
          <VitalInput label="FC" unit="bpm" value={v.frequenciaCardiaca} onChange={v => updateVital('frequenciaCardiaca', v)} placeholder="80" min={0} max={300} warn={hrWarn} />
          <VitalInput label="FR" unit="ipm" value={v.frequenciaRespiratoria} onChange={v => updateVital('frequenciaRespiratoria', v)} placeholder="18" min={0} max={60} />
          <VitalInput label="SpO₂" unit="%" value={v.saturacaoO2} onChange={v => updateVital('saturacaoO2', v)} placeholder="97" min={0} max={100} warn={spO2Warn} />
          <VitalInput label="Temperatura" unit="°C" value={v.temperatura} onChange={v => updateVital('temperatura', v)} placeholder="36.5" />
          <VitalInput label="Glicemia" unit="mg/dL" value={v.glicemia} onChange={v => updateVital('glicemia', v)} placeholder="100" />
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-4">Nível de Consciência</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {consciousnessOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ consciousnessLevel: opt.value })}
              className={`p-2.5 rounded-lg border text-left text-xs font-medium font-body transition-all ${
                data.consciousnessLevel === opt.value
                  ? 'bg-blue-500/15 border-blue-500/40'
                  : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600'
              }`}
            >
              <span className={data.consciousnessLevel === opt.value ? 'text-blue-300' : opt.color}>{opt.label}</span>
            </button>
          ))}
        </div>
        {data.consciousnessLevel === 'glasgow' && (
          <VitalInput label="Glasgow" unit="pts" value={v.glasgow} onChange={v => updateVital('glasgow', v)} placeholder="15" min={3} max={15} warn={(v.glasgow ?? 15) <= 8} />
        )}
        <div className="mt-4">
          <label className={labelCls}>Observações Estruturadas</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="ECG, achados de exame físico, condutas já realizadas..."
            value={data.observations}
            onChange={e => onChange({ observations: e.target.value })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-display font-semibold text-slate-200 text-sm mb-1">Mini Triagem Guiada</h3>
        <p className="text-slate-500 text-xs font-body mb-4">Ative os sinais de prioridade percebidos pela equipe para estabilizar a classificação entre reguladores.</p>
        <div className="flex flex-wrap gap-2">
          {triageOptions.map((option) => {
            const active = data.triageTags.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleTriage(option.value)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium font-body transition-all ${
                  active
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-200'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className={active ? 'text-blue-200' : option.tone}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
