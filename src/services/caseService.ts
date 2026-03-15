import { SavedCase, RecommendationResult, CaseFormData, CaseTimeline } from '../types';

const STORAGE_KEY = 'sireme_cases';

export function getAllCases(): SavedCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCase(params: {
  caseData: CaseFormData;
  recommendation: RecommendationResult;
  finalHospitalId: string;
  finalHospitalName: string;
  divergedFromSuggestion: boolean;
  overrideReason?: string;
  regulatorName: string;
}): SavedCase {
  const cases = getAllCases();
  const now = new Date().toISOString();

  const timeline: CaseTimeline[] = [
    {
      at: new Date(params.caseData.startedAt).toISOString(),
      label: 'Caso criado',
      detail: `Origem: ${params.caseData.origin}`,
      type: 'create',
    },
    {
      at: params.recommendation.timestamp,
      label: 'Classificação gerada',
      detail: `${params.recommendation.classification.gravity.toUpperCase()} — ${params.recommendation.classification.category} · ${params.recommendation.classification.careLine}`,
      type: 'classify',
    },
    {
      at: params.recommendation.timestamp,
      label: 'Recomendação gerada',
      detail: `${params.recommendation.recommended.hospital.shortName} (Score ${params.recommendation.recommended.finalScore})`,
      type: 'recommend',
    },
    {
      at: now,
      label: params.divergedFromSuggestion ? 'Regulador divergiu da sugestão' : 'Regulador confirmou recomendação',
      detail: `Destino final: ${params.finalHospitalName}${params.overrideReason ? ` — Motivo: ${params.overrideReason}` : ''}`,
      type: 'decide',
    },
  ];

  const saved: SavedCase = {
    id: params.recommendation.caseId,
    caseData: params.caseData,
    recommendation: params.recommendation,
    finalHospitalId: params.finalHospitalId,
    finalHospitalName: params.finalHospitalName,
    divergedFromSuggestion: params.divergedFromSuggestion,
    overrideReason: params.overrideReason,
    savedAt: now,
    regulatorName: params.regulatorName,
    timeline,
  };

  cases.unshift(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases.slice(0, 200)));
  return saved;
}

export function getCaseById(id: string): SavedCase | undefined {
  return getAllCases().find(c => c.id === id);
}

export function clearAllCases(): void {
  localStorage.removeItem(STORAGE_KEY);
}
