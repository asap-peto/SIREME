import { CareLine, CaseFormData, ClinicalCategory, TriageTag } from '../types';

interface CategoryScore {
  category: ClinicalCategory;
  score: number;
}

export function classifyCategory(data: CaseFormData): ClinicalCategory {
  const text = `${data.chiefComplaint} ${data.clinicalSuspicion} ${data.observations}`.toLowerCase();
  const age = data.age;
  const tagSet = new Set<TriageTag>(data.triageTags ?? []);

  // Pediatric check first
  if (age < 14) return 'pediatrico';
  if (tagSet.has('gestante_alto_risco')) return 'obstetrico';
  if (tagSet.has('politrauma_mecanismo')) return 'trauma';
  if (tagSet.has('deficit_focal_agudo')) return 'neurologico';
  if (tagSet.has('dor_toracica_isquemica')) return 'cardiologico';
  if (tagSet.has('sepse_provavel')) return 'infeccioso';

  const scores: CategoryScore[] = [
    {
      category: 'cardiologico',
      score: scoreKeywords(text, [
        ['infarto', 'iam', 'supra de st', 'icp', 'hemodinâmica', 'killip', 4],
        ['dor precordial', 'dor torácica', 'anginosa', 'síndrome coronariana', 3],
        ['arritmia', 'fibrilação atrial', 'flutter', 'taquicardia ventricular', 3],
        ['ic descompensada', 'edema agudo de pulmão', 'eap', 2],
        ['cardíaco', 'coronariana', 'revascularização', 1],
      ]),
    },
    {
      category: 'neurologico',
      score: scoreKeywords(text, [
        ['avc', 'acidente vascular cerebral', 'trombólise', 'nihss', 'hemiplegia', 4],
        ['afasia', 'disartria', 'déficit focal', 'oclusão de grande vaso', 3],
        ['tcg grave', 'tce', 'herniação', 'glasgow', 2],
        ['convulsão', 'epilepsia', 'status epiléptico', 2],
        ['neurológico', 'meningite', 'encefalite', 1],
      ]),
    },
    {
      category: 'trauma',
      score: scoreKeywords(text, [
        ['politrauma', 'politraumatizado', 'ejeção', 'colisão frontal', 4],
        ['tcg', 'tce grave', 'hemotórax', 'pneumotórax', 'tamponamento', 3],
        ['fratura instável', 'fratura de bacia', 'fratura exposta', 3],
        ['arma de fogo', 'arma branca', 'penetrante', 'ferimento', 2],
        ['trauma', 'queda de altura', 'atropelamento', 2],
      ]),
    },
    {
      category: 'infeccioso',
      score: scoreKeywords(text, [
        ['choque séptico', 'sepse grave', 'sofa', 'lactato', 4],
        ['sepse', 'bacteremia', 'sirs', 'hemocultura', 3],
        ['meningite', 'encefalite infecciosa', 'abscesso cerebral', 3],
        ['pneumonia grave', 'endocardite', 'pielonefrite complicada', 2],
        ['infecção', 'febre', 'infeccioso', 1],
      ]),
    },
    {
      category: 'obstetrico',
      score: scoreKeywords(text, [
        ['eclâmpsia', 'pré-eclâmpsia', 'hellp', 'sulfato de magnésio', 4],
        ['gestante', 'gestação', 'parto', 'grávida', 'semanas de gestação', 3],
        ['placenta', 'descolamento', 'rotura uterina', 'hemorragia pós-parto', 3],
        ['obstétrico', 'fetal', 'neonatal', 'puerpério', 2],
      ]),
    },
    {
      category: 'clinico_geral',
      score: 1,
    },
  ];

  // Force obstetric for adult female patients with pregnancy keywords
  if (data.sex === 'F' && age >= 14 && /gestante|grávida|gestação|semanas|parto|eclâmpsia/.test(text)) {
    return 'obstetrico';
  }

  scores.sort((a, b) => b.score - a.score);
  return scores[0].category;
}

type KeywordGroup = (string | number)[];

function scoreKeywords(text: string, groups: KeywordGroup[]): number {
  let total = 0;
  for (const group of groups) {
    const weight = typeof group[group.length - 1] === 'number' ? (group[group.length - 1] as number) : 1;
    const keywords = group.slice(0, -1) as string[];
    if (keywords.some(kw => text.includes(kw))) {
      total += weight;
    }
  }
  return total;
}

export const CATEGORY_LABELS: Record<ClinicalCategory, string> = {
  cardiologico: 'Cardiológico',
  neurologico: 'Neurológico',
  trauma: 'Trauma',
  infeccioso: 'Infeccioso',
  obstetrico: 'Obstétrico',
  pediatrico: 'Pediátrico',
  clinico_geral: 'Clínico Geral',
};

export function resolveCareLine(category: ClinicalCategory): CareLine {
  return {
    cardiologico: 'linha_cardio',
    neurologico: 'linha_neuro',
    trauma: 'linha_trauma',
    infeccioso: 'linha_infeccao',
    obstetrico: 'linha_materno_infantil',
    pediatrico: 'linha_pediatrica',
    clinico_geral: 'linha_clinica',
  }[category];
}

export const CARE_LINE_LABELS: Record<CareLine, string> = {
  linha_cardio: 'Linha Cardio',
  linha_neuro: 'Linha AVC / Neuro',
  linha_trauma: 'Linha Trauma',
  linha_infeccao: 'Linha Sepse / Infecção',
  linha_materno_infantil: 'Linha Materno-Infantil',
  linha_pediatrica: 'Linha Pediátrica',
  linha_clinica: 'Linha Clínica Geral',
};

export const CATEGORY_ICONS: Record<ClinicalCategory, string> = {
  cardiologico: '❤️',
  neurologico: '🧠',
  trauma: '🩹',
  infeccioso: '🦠',
  obstetrico: '🤱',
  pediatrico: '👶',
  clinico_geral: '🏥',
};
