import { Hospital, CaseFormData, ClassificationResult, HospitalRecommendation, ExcludedHospital, RecommendationResult, ScoreBreakdown, ResourceType } from '../types';
import { getHospitalSnapshot } from '../services/hospitalService';

// Haversine distance formula
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTimeMin(distanceKm: number, gravity: string): number {
  // Base speed: 60 km/h urban, faster for critical (siren)
  const speedKmh = gravity === 'critico' ? 70 : gravity === 'alto' ? 60 : 50;
  const travelMin = (distanceKm / speedKmh) * 60;
  const handoffMin = 5; // avg handoff time
  return Math.round(travelMin + handoffMin);
}

function scoreOccupancy(occupancy: string): number {
  return { baixa: 20, media: 15, alta: 7, critica: 0 }[occupancy] ?? 0;
}

function scoreDistance(distanceKm: number): number {
  // 0km = 25pts, 30km = 0pts
  return Math.max(0, Math.round(25 - (distanceKm / 30) * 25));
}

function scoreResources(hospital: Hospital, required: ResourceType[], desired: ResourceType[]): number {
  if (required.length === 0) return 40;
  const requiredMet = required.filter(r => hospital.resources.includes(r)).length;
  const desiredMet = desired.filter(r => hospital.resources.includes(r)).length;
  const requiredScore = (requiredMet / required.length) * 36;
  const desiredBonus = desired.length > 0 ? (desiredMet / desired.length) * 4 : 4;
  return Math.round(requiredScore + desiredBonus);
}

function scoreSpecialty(hospital: Hospital, category: string): number {
  const categoryKeywords: Record<string, string[]> = {
    cardiologico: ['cardio', 'hemodinâmica', 'coronariana'],
    neurologico: ['neuro', 'avc', 'neurocirurgia'],
    trauma: ['trauma', 'politrauma', 'nível iv'],
    infeccioso: ['referência', 'infeccioso', 'uti'],
    obstetrico: ['maternidade', 'obstétrico', 'alto risco'],
    pediatrico: ['pediátric', 'pediatria', 'infantil'],
    clinico_geral: [],
  };

  const keywords = categoryKeywords[category] || [];
  if (keywords.length === 0) return 8;

  const allText = [...hospital.badges, ...hospital.specialties].join(' ').toLowerCase();
  const matches = keywords.filter(k => allText.includes(k)).length;
  return Math.min(15, matches * 5 + (hospital.type === 'hospital' ? 3 : 0));
}

function scoreOperational(hospital: Hospital): number {
  return Math.round(Math.max(2, Math.min(10, hospital.baseScore / 10)));
}

function checkExclusion(
  hospital: Hospital,
  snapshot: ReturnType<typeof getHospitalSnapshot>,
  classification: ClassificationResult,
  distanceKm: number,
  caseData: CaseFormData
): string[] {
  const reasons: string[] = [];
  const required = classification.requiredResources;
  const gravity = classification.gravity;
  const category = classification.category;

  // Missing required resources
  const missing = required.filter((r: ResourceType) => !hospital.resources.includes(r));
  if (missing.length > 0) {
    const labels: Record<string, string> = {
      UTI_ADULTO: 'UTI Adulto', UTI_PEDIATRICA: 'UTI Pediátrica', UTI_NEONATAL: 'UTI Neonatal',
      HEMODINAMICA: 'Hemodinâmica', NEUROCIRURGIA: 'Neurocirurgia', MATERNIDADE: 'Maternidade',
      BANCO_DE_SANGUE: 'Banco de Sangue', TOMOGRAFIA: 'Tomografia', TRAUMA: 'Trauma',
      CARDIOLOGIA: 'Cardiologia', NEUROLOGIA: 'Neurologia', CIRURGIA_GERAL: 'Cirurgia Geral',
      DIALISE: 'Diálise', PEDIATRIA: 'Pediatria',
    };
    const missingLabels = missing.map(r => labels[r] ?? r).join(', ');
    reasons.push(`Recursos obrigatórios ausentes: ${missingLabels}`);
  }

  // UPA cannot receive critical or ICU patients
  if (hospital.type === 'upa') {
    if (gravity === 'critico') {
      reasons.push('UPA não indicada para casos críticos — sem UTI');
    }
    if (required.includes('UTI_ADULTO') || required.includes('UTI_PEDIATRICA')) {
      reasons.push('UPA não dispõe de UTI conforme exigido pelo caso');
    }
    if (required.includes('HEMODINAMICA') || required.includes('NEUROCIRURGIA')) {
      reasons.push('UPA não realiza procedimentos de alta complexidade (hemodinâmica/neurocirurgia)');
    }
    if (caseData.caseType === 'transferencia' || caseData.caseType === 'vaga_especializada') {
      reasons.push('UPA não é destino definitivo para transferência regulada de maior complexidade');
    }
  }

  // Occupancy critical for critical/high cases
  if (snapshot.occupancy === 'critica' && (gravity === 'critico' || gravity === 'alto')) {
    reasons.push(`Lotação crítica (${snapshot.occupancyPercent}%) — risco de superlotação em caso urgente`);
  }

  // Pediatric specialty check
  if (category === 'pediatrico' && !hospital.resources.includes('UTI_PEDIATRICA') && !hospital.resources.includes('PEDIATRIA')) {
    if (!reasons.some(r => r.includes('Recursos obrigatórios'))) {
      reasons.push('Unidade sem estrutura pediátrica especializada');
    }
  }

  // Distance > 40km for critical
  if (distanceKm > 40 && gravity === 'critico') {
    reasons.push(`Distância de ${distanceKm.toFixed(1)} km considerada excessiva para caso crítico`);
  }

  if ((gravity === 'critico' || gravity === 'alto') && caseData.transportType === 'particular') {
    reasons.push('Transporte particular incompatível com gravidade alta/crítica para transferência segura');
  }

  return reasons;
}

function buildJustification(
  hospital: Hospital,
  score: ScoreBreakdown,
  classification: ClassificationResult,
  distanceKm: number,
  occupancyPercent: number
): string[] {
  const lines: string[] = [];
  const { gravity, category } = classification;
  const required = classification.requiredResources;

  const metRequired = required.filter((r: ResourceType) => hospital.resources.includes(r));
  if (metRequired.length > 0 && metRequired.length === required.length) {
    lines.push(`Todos os ${required.length} recursos obrigatórios disponíveis`);
  }

  if (score.distance >= 20) lines.push(`Proximidade favorável: ${distanceKm.toFixed(1)} km do ponto de origem`);
  if (score.occupancy >= 15) lines.push(`Lotação dentro do limite seguro (${occupancyPercent}%)`);
  if (score.specialty >= 10) lines.push(`Perfil assistencial compatível com categoria ${category}`);

  if (gravity === 'critico' && hospital.icuBeds > 0) {
    lines.push(`UTI disponível com ${hospital.icuBeds} leitos`);
  }

  if (hospital.badges.length > 0) {
    lines.push(`Certificações relevantes: ${hospital.badges.slice(0, 2).join(', ')}`);
  }

  return lines;
}

export function runRecommendationEngine(
  caseData: CaseFormData,
  classification: ClassificationResult,
  hospitals: Hospital[]
): Omit<RecommendationResult, 'caseId' | 'timestamp' | 'caseData' | 'processingTimeMs' | 'timeToRecommendationMs'> {
  const origin = { lat: caseData.originLat, lng: caseData.originLng };
  const allRequired: ResourceType[] = [
    ...new Set([...classification.requiredResources, ...caseData.requiredResources])
  ];
  const allDesired: ResourceType[] = [
    ...[...new Set([...classification.desiredResources, ...caseData.desiredResources])]
  ].filter((r): r is ResourceType => !allRequired.includes(r as ResourceType));

  const enrichedClassification = {
    ...classification,
    requiredResources: allRequired,
    desiredResources: allDesired,
  };

  const eligible: HospitalRecommendation[] = [];
  const excluded: ExcludedHospital[] = [];

  for (const hospital of hospitals) {
    const distanceKm = haversineKm(origin.lat, origin.lng, hospital.lat, hospital.lng);
    const snapshot = getHospitalSnapshot(hospital);
    const exclusionReasons = checkExclusion(hospital, snapshot, enrichedClassification, distanceKm, caseData);

    if (exclusionReasons.length > 0) {
      excluded.push({ hospital, reasons: exclusionReasons });
      continue;
    }

    const resourceScore = scoreResources(hospital, allRequired, allDesired);
    const distanceScore = scoreDistance(distanceKm);
    const occupancyScore = scoreOccupancy(snapshot.occupancy);
    const specialtyScore = scoreSpecialty(hospital, classification.category);
    const operationalScore = scoreOperational(hospital);

    const scoreBreakdown: ScoreBreakdown = {
      resource: resourceScore,
      distance: distanceScore,
      occupancy: occupancyScore,
      specialty: specialtyScore,
      operational: operationalScore,
      total: resourceScore + distanceScore + occupancyScore + specialtyScore + operationalScore,
    };

    const estimatedTime = estimateTimeMin(distanceKm, classification.gravity);
    const justification = buildJustification(hospital, scoreBreakdown, enrichedClassification, distanceKm, snapshot.occupancyPercent);

    eligible.push({
      hospital,
      snapshot,
      score: scoreBreakdown,
      finalScore: scoreBreakdown.total,
      confidence: 0, // calculated after ranking
      confidenceLabel: 'Média',
      justification,
      distanceKm: Math.round(distanceKm * 10) / 10,
      estimatedTimeMin: estimatedTime,
      rank: 0,
    });
  }

  // Sort by score descending
  eligible.sort((a, b) => b.finalScore - a.finalScore);

  // Assign ranks and confidence
  const topScore = eligible[0]?.finalScore ?? 0;
  const secondScore = eligible[1]?.finalScore ?? 0;
  const gap = topScore - secondScore;

  eligible.forEach((rec, i) => {
    rec.rank = i + 1;
    if (i === 0) {
      const confNum = gap > 15 ? 0.92 : gap > 8 ? 0.78 : 0.62;
      rec.confidence = confNum;
      rec.confidenceLabel = confNum >= 0.85 ? 'Alta' : confNum >= 0.70 ? 'Média' : 'Baixa';
    } else {
      rec.confidence = Math.max(0.30, (rec.finalScore / topScore) * 0.8);
      rec.confidenceLabel = rec.confidence >= 0.70 ? 'Alta' : rec.confidence >= 0.50 ? 'Média' : 'Baixa';
    }
  });

  if (eligible.length === 0) {
    throw new Error('Nenhum hospital elegível encontrado para os critérios informados.');
  }

  return {
    classification: enrichedClassification,
    recommended: eligible[0],
    alternatives: eligible.slice(1, 4),
    excluded,
  };
}
