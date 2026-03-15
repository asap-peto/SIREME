import { CaseFormData, ResourceType } from '../../types';
import { Card, Badge } from '../ui';
import { RESOURCE_LABELS } from '../../rules/resourceRules';

interface Props {
  data: CaseFormData;
  onChange: (patch: Partial<CaseFormData>) => void;
}

const ALL_RESOURCES: ResourceType[] = [
  'UTI_ADULTO', 'UTI_PEDIATRICA', 'UTI_NEONATAL', 'HEMODINAMICA',
  'NEUROCIRURGIA', 'CIRURGIA_VASCULAR', 'MATERNIDADE', 'BANCO_DE_SANGUE',
  'TOMOGRAFIA', 'RESSONANCIA', 'TRAUMA', 'PEDIATRIA', 'CARDIOLOGIA',
  'NEUROLOGIA', 'ORTOPEDIA', 'PSIQUIATRIA', 'QUEIMADOS', 'DIALISE',
  'ENDOSCOPIA', 'CIRURGIA_GERAL',
];

const inputCls = 'w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200 font-body placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-slate-400 font-body mb-1.5';

function ResourceSelector({
  title, subtitle, selected, onChange, exclude, variant,
}: {
  title: string; subtitle: string; selected: ResourceType[];
  onChange: (r: ResourceType[]) => void; exclude: ResourceType[]; variant: 'required' | 'desired';
}) {
  const toggle = (r: ResourceType) => {
    onChange(selected.includes(r) ? selected.filter(x => x !== r) : [...selected, r]);
  };
  const available = ALL_RESOURCES.filter(r => !exclude.includes(r));

  return (
    <div>
      <div className="mb-3">
        <h4 className={`text-sm font-semibold font-display ${variant === 'required' ? 'text-red-300' : 'text-blue-300'}`}>
          {title}
        </h4>
        <p className="text-xs text-slate-500 font-body mt-0.5">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map(r => {
          const active = selected.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => toggle(r)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium font-body transition-all ${
                active
                  ? variant === 'required'
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {RESOURCE_LABELS[r]}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map(r => (
            <Badge key={r} variant={variant === 'required' ? 'danger' : 'primary'} size="xs">
              {RESOURCE_LABELS[r]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function CaseStep3({ data, onChange }: Props) {
  return (
    <div className="space-y-5 animate-slide-up">
      <Card>
        <p className="text-xs text-slate-500 font-body mb-5 p-3 bg-slate-800/40 rounded-lg border border-slate-700/40">
          💡 <strong className="text-slate-300">Recursos automáticos:</strong> O sistema determinará recursos com base nos dados clínicos. Aqui você pode refinar ou adicionar requisitos específicos do caso.
        </p>
        <div className="space-y-6">
          <ResourceSelector
            title="⚠ Recursos Obrigatórios"
            subtitle="Hospital sem estes recursos será EXCLUÍDO da recomendação"
            selected={data.requiredResources}
            onChange={r => onChange({ requiredResources: r })}
            exclude={data.desiredResources}
            variant="required"
          />
          <hr className="border-slate-800/60" />
          <ResourceSelector
            title="✦ Recursos Desejáveis"
            subtitle="Presença destes recursos aumenta o score do hospital"
            selected={data.desiredResources}
            onChange={r => onChange({ desiredResources: r })}
            exclude={data.requiredResources}
            variant="desired"
          />
        </div>
      </Card>

      <Card>
        <label className={labelCls}>Observações Livres para o Regulador</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={4}
          placeholder="Informações adicionais, contexto clínico relevante, contatos realizados..."
          value={data.freeNotes}
          onChange={e => onChange({ freeNotes: e.target.value })}
        />
      </Card>
    </div>
  );
}
