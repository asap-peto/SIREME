import { CaseFormData, GravityLevel } from '../types';

export function classifyGravity(data: CaseFormData): GravityLevel {
  const { vitalSigns: v, consciousnessLevel, age } = data;
  const tagSet = new Set(data.triageTags ?? []);

  let score = 0;

  // Consciousness level
  if (consciousnessLevel === 'inconsciente') score += 4;
  else if (consciousnessLevel === 'soporoso') score += 3;
  else if (consciousnessLevel === 'confuso') score += 2;
  else if (consciousnessLevel === 'glasgow' && v.glasgow !== undefined) {
    if (v.glasgow <= 8) score += 4;
    else if (v.glasgow <= 12) score += 2;
    else if (v.glasgow <= 14) score += 1;
  }

  // SpO2
  if (v.saturacaoO2 !== undefined) {
    if (v.saturacaoO2 < 85) score += 4;
    else if (v.saturacaoO2 < 90) score += 3;
    else if (v.saturacaoO2 < 94) score += 2;
    else if (v.saturacaoO2 < 96) score += 1;
  }

  // Systolic BP
  if (v.pressuraSistolica !== undefined) {
    if (v.pressuraSistolica < 80) score += 4;
    else if (v.pressuraSistolica < 90) score += 3;
    else if (v.pressuraSistolica < 100) score += 2;
    else if (v.pressuraSistolica > 200) score += 2;
    else if (v.pressuraSistolica > 180) score += 1;
  }

  // Heart rate
  if (v.frequenciaCardiaca !== undefined) {
    if (v.frequenciaCardiaca > 150 || v.frequenciaCardiaca < 40) score += 3;
    else if (v.frequenciaCardiaca > 130 || v.frequenciaCardiaca < 50) score += 2;
    else if (v.frequenciaCardiaca > 110) score += 1;
  }

  // Respiratory rate
  if (v.frequenciaRespiratoria !== undefined) {
    if (v.frequenciaRespiratoria > 30 || v.frequenciaRespiratoria < 8) score += 3;
    else if (v.frequenciaRespiratoria > 25 || v.frequenciaRespiratoria < 12) score += 2;
    else if (v.frequenciaRespiratoria > 20) score += 1;
  }

  // Extremes of age
  if (age < 1 || age > 85) score += 1;
  else if (age < 5 || age > 75) score += 0.5;

  // Complaint keywords boosting gravity
  const complaint = (data.chiefComplaint + ' ' + data.clinicalSuspicion).toLowerCase();
  if (/parada card|pcrh|fibrilaç|supra de st|iam/.test(complaint)) score += 3;
  if (/tcg grave|politrauma|ejeção|gcs [0-7]/.test(complaint)) score += 3;
  if (/choque sép|sepse grave|eclâmpsia|hernia.*cerebral/.test(complaint)) score += 3;
  if (/avc|acidente vascular|hemiplegia|afasia/.test(complaint)) score += 2;
  if (/sepse|infarto|stroke|tep|embolia/.test(complaint)) score += 1;

  if (tagSet.has('choque_hipotensivo')) score += 3;
  if (tagSet.has('insuficiencia_respiratoria')) score += 3;
  if (tagSet.has('politrauma_mecanismo')) score += 3;
  if (tagSet.has('dor_toracica_isquemica')) score += 2;
  if (tagSet.has('deficit_focal_agudo')) score += 2;
  if (tagSet.has('sepse_provavel')) score += 2;
  if (tagSet.has('gestante_alto_risco')) score += 2;
  if (tagSet.has('crianca_risco')) score += 2;

  if (score >= 8) return 'critico';
  if (score >= 5) return 'alto';
  if (score >= 2) return 'moderado';
  return 'baixo';
}

export const GRAVITY_LABELS: Record<GravityLevel, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  moderado: 'Moderado',
  baixo: 'Baixo',
};

export const GRAVITY_COLORS: Record<GravityLevel, string> = {
  critico: 'text-red-400',
  alto: 'text-orange-400',
  moderado: 'text-amber-400',
  baixo: 'text-emerald-400',
};

export const GRAVITY_BG: Record<GravityLevel, string> = {
  critico: 'bg-red-500/20 border-red-500/40 text-red-300',
  alto: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  moderado: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  baixo: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
};
