import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Zap, AlertTriangle } from 'lucide-react';
import { CaseFormData, RecommendationResult } from '../types';
import { StepIndicator } from '../components/case/StepIndicator';
import { CaseStep1 } from '../components/case/CaseStep1';
import { CaseStep2 } from '../components/case/CaseStep2';
import { CaseStep3 } from '../components/case/CaseStep3';
import { Button, GravityBadge, Badge, PageLoader, Card } from '../components/ui';
import { useApp } from '../context/AppContext';
import { classifyCase } from '../services/classificationService';
import { runRecommendationEngine } from '../engine/recommendationEngine';
import { HOSPITALS } from '../mocks/hospitals';
import { generateCaseId, CATEGORY_LABELS, CARE_LINE_LABELS } from '../utils';
import { RESOURCE_LABELS } from '../rules/resourceRules';

const STEPS = [
  { label: 'Identificação', description: 'Paciente e origem' },
  { label: 'Dados Clínicos', description: 'Queixas e sinais vitais' },
  { label: 'Recursos', description: 'Necessidades assistenciais' },
  { label: 'Recomendação', description: 'Gerar análise' },
];

const DEFAULT_FORM: CaseFormData = {
  patientId: '',
  regulationCode: '',
  age: 0,
  sex: 'M',
  origin: '',
  originLat: -25.4296,
  originLng: -49.2719,
  transportType: 'USB',
  caseType: 'pre_hospitalar',
  chiefComplaint: '',
  clinicalSuspicion: '',
  vitalSigns: {},
  consciousnessLevel: 'alerta',
  triageTags: [],
  observations: '',
  requiredResources: [],
  desiredResources: [],
  freeNotes: '',
  startedAt: Date.now(),
};

function validateStep(step: number, data: CaseFormData): string[] {
  const errors: string[] = [];
  if (step === 0) {
    if (!data.patientId.trim()) errors.push('ID do paciente obrigatório');
    if (!data.age || data.age <= 0) errors.push('Idade inválida');
    if (!data.origin) errors.push('Ponto de origem obrigatório');
  }
  if (step === 1) {
    if (!data.chiefComplaint.trim()) errors.push('Queixa principal obrigatória');
    if (!data.clinicalSuspicion.trim()) errors.push('Suspeita clínica obrigatória');
  }
  return errors;
}

export function NewCasePage() {
  const navigate = useNavigate();
  const { setPendingResult } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CaseFormData>({ ...DEFAULT_FORM, startedAt: Date.now() });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof classifyCase> | null>(null);

  const update = (patch: Partial<CaseFormData>) => setForm(f => ({ ...f, ...patch }));

  const goNext = () => {
    const errs = validateStep(step, form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    if (step === 2) {
      // Preview classification before final step
      const cls = classifyCase(form);
      setPreview(cls);
    }
    setStep(s => s + 1);
  };

  const goBack = () => { setErrors([]); setStep(s => s - 1); };

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // realistic processing delay
    try {
      const classification = classifyCase(form);
      const engineResult = runRecommendationEngine(form, classification, HOSPITALS);
      const caseId = generateCaseId();
      const timestamp = new Date().toISOString();
      const timeToRecommendationMs = Date.now() - form.startedAt;

      const result: RecommendationResult = {
        caseId,
        timestamp,
        caseData: form,
        ...engineResult,
        processingTimeMs: Math.round(Math.random() * 200 + 100),
        timeToRecommendationMs,
      };

      setPendingResult(result);
      navigate('/recommendation');
    } catch (err) {
      setErrors([String(err)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-slate-100 font-bold font-display text-lg">Novo Caso</h1>
            <p className="text-slate-500 text-xs font-body">Regulação · {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step Indicator */}
        <StepIndicator steps={STEPS} current={step} />

        {/* Errors */}
        {errors.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <ul className="space-y-0.5">
              {errors.map((e, i) => <li key={i} className="text-red-400 text-xs font-body">{e}</li>)}
            </ul>
          </div>
        )}

        {/* Step Content */}
        {step === 0 && <CaseStep1 data={form} onChange={update} />}
        {step === 1 && <CaseStep2 data={form} onChange={update} />}
        {step === 2 && <CaseStep3 data={form} onChange={update} />}

        {/* Step 3 — Review & Generate */}
        {step === 3 && (
          <div className="space-y-4 animate-slide-up">
            {preview && (
              <Card glow="blue">
                <h3 className="font-display font-semibold text-slate-200 text-sm mb-3">Pré-classificação</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <GravityBadge gravity={preview.gravity} size="md" />
                  <Badge variant="primary" size="md">
                    {CATEGORY_LABELS[preview.category]}
                  </Badge>
                  <Badge variant="info" size="md">
                    {CARE_LINE_LABELS[preview.careLine]}
                  </Badge>
                </div>
                {preview.requiredResources.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-body mb-2">Recursos obrigatórios identificados:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {preview.requiredResources.map(r => (
                        <Badge key={r} variant="danger" size="xs">{RESOURCE_LABELS[r]}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preview.alerts.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {preview.alerts.slice(0, 2).map(a => (
                      <div key={a.code} className={`flex items-start gap-2 p-2 rounded-lg text-xs font-body ${
                        a.level === 'critical' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                        a.level === 'warning' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
                        'bg-slate-800/60 border border-slate-700/40 text-slate-400'
                      }`}>
                        <span className="flex-shrink-0">{a.level === 'critical' ? '🚨' : '⚠️'}</span>
                        {a.message}
                      </div>
                    ))}
                    {preview.alerts.length > 2 && (
                      <p className="text-slate-500 text-xs font-body">+{preview.alerts.length - 2} alertas adicionais na recomendação completa</p>
                    )}
                  </div>
                )}
              </Card>
            )}

            <Card>
              <p className="text-slate-400 text-sm font-body text-center mb-4">
                Pronto para gerar a recomendação hospitalar para este caso.
              </p>
              <p className="text-slate-500 text-xs font-body text-center mb-1">O motor analisará <strong className="text-slate-300">{HOSPITALS.length} unidades</strong> em Curitiba e Região</p>
              <p className="text-slate-600 text-xs font-body text-center">Critérios: gravidade · recursos · distância · lotação · especialidade</p>
            </Card>

            {errors.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-body">
                {errors[0]}
              </div>
            )}

            {loading ? (
              <PageLoader label="Analisando unidades disponíveis..." />
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                leftIcon={<Zap size={16} />}
                onClick={handleGenerate}
              >
                Gerar Recomendação
              </Button>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="md" onClick={goBack} disabled={step === 0} leftIcon={<ArrowLeft size={14} />}>
              Voltar
            </Button>
            <Button variant="primary" size="md" onClick={goNext} rightIcon={<ArrowRight size={14} />}>
              {step === 2 ? 'Revisar e Gerar' : 'Continuar'}
            </Button>
          </div>
        )}
        {step === 3 && !loading && (
          <Button variant="ghost" size="md" onClick={goBack} leftIcon={<ArrowLeft size={14} />}>
            Voltar e editar
          </Button>
        )}
      </div>
    </div>
  );
}
