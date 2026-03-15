export type GravityLevel = 'baixo' | 'moderado' | 'alto' | 'critico';

export type ClinicalCategory =
  | 'cardiologico'
  | 'neurologico'
  | 'trauma'
  | 'infeccioso'
  | 'obstetrico'
  | 'pediatrico'
  | 'clinico_geral';

export type CareLine =
  | 'linha_cardio'
  | 'linha_neuro'
  | 'linha_trauma'
  | 'linha_infeccao'
  | 'linha_materno_infantil'
  | 'linha_pediatrica'
  | 'linha_clinica';

export type CaseType =
  | 'pre_hospitalar'
  | 'transferencia'
  | 'vaga_especializada'
  | 'avaliacao_inicial';

export type TransportType = 'USB' | 'USA' | 'helicoptero' | 'particular' | 'proprio';
export type ConsciousnessLevel = 'alerta' | 'confuso' | 'soporoso' | 'inconsciente' | 'glasgow';

export type ResourceType =
  | 'UTI_ADULTO'
  | 'UTI_PEDIATRICA'
  | 'UTI_NEONATAL'
  | 'HEMODINAMICA'
  | 'NEUROCIRURGIA'
  | 'CIRURGIA_VASCULAR'
  | 'MATERNIDADE'
  | 'BANCO_DE_SANGUE'
  | 'TOMOGRAFIA'
  | 'RESSONANCIA'
  | 'TRAUMA'
  | 'PEDIATRIA'
  | 'CARDIOLOGIA'
  | 'NEUROLOGIA'
  | 'ORTOPEDIA'
  | 'PSIQUIATRIA'
  | 'QUEIMADOS'
  | 'DIALISE'
  | 'ENDOSCOPIA'
  | 'CIRURGIA_GERAL';

export type OccupancyLevel = 'baixa' | 'media' | 'alta' | 'critica';
export type HospitalType = 'hospital' | 'upa' | 'ubs';
export type TriageTag =
  | 'dor_toracica_isquemica'
  | 'deficit_focal_agudo'
  | 'insuficiencia_respiratoria'
  | 'choque_hipotensivo'
  | 'politrauma_mecanismo'
  | 'gestante_alto_risco'
  | 'sepse_provavel'
  | 'crianca_risco';

export interface VitalSigns {
  pressuraSistolica?: number;
  pressuraDiastolica?: number;
  frequenciaCardiaca?: number;
  frequenciaRespiratoria?: number;
  saturacaoO2?: number;
  temperatura?: number;
  glicemia?: number;
  glasgow?: number;
}

export interface CaseFormData {
  patientId: string;
  regulationCode: string;
  age: number;
  sex: 'M' | 'F';
  origin: string;
  originLat: number;
  originLng: number;
  transportType: TransportType;
  caseType: CaseType;
  chiefComplaint: string;
  clinicalSuspicion: string;
  vitalSigns: VitalSigns;
  consciousnessLevel: ConsciousnessLevel;
  triageTags: TriageTag[];
  observations: string;
  requiredResources: ResourceType[];
  desiredResources: ResourceType[];
  freeNotes: string;
  startedAt: number;
}

export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  type: HospitalType;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  resources: ResourceType[];
  specialties: string[];
  occupancy: OccupancyLevel;
  occupancyPercent: number;
  baseScore: number;
  totalBeds: number;
  icuBeds: number;
  cnes: string;
  badges: string[];
  offers: string[];
  careLines: CareLine[];
  regulationNotes: string;
  phone: string;
  color: string;
  loadFactor: number;
}

export interface ScoreBreakdown {
  resource: number;
  distance: number;
  occupancy: number;
  specialty: number;
  operational: number;
  total: number;
}

export interface HospitalOperationalSnapshot {
  occupancyPercent: number;
  occupancy: OccupancyLevel;
  availableBeds: number;
  emergencyQueue: number;
  statusLabel: string;
  updatedAt: string;
}

export interface HospitalRecommendation {
  hospital: Hospital;
  snapshot: HospitalOperationalSnapshot;
  score: ScoreBreakdown;
  finalScore: number;
  confidence: number;
  confidenceLabel: 'Alta' | 'Média' | 'Baixa';
  justification: string[];
  distanceKm: number;
  estimatedTimeMin: number;
  rank: number;
}

export interface ExcludedHospital {
  hospital: Hospital;
  reasons: string[];
}

export interface ClinicalAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  code: string;
}

export interface ClassificationResult {
  gravity: GravityLevel;
  category: ClinicalCategory;
  careLine: CareLine;
  requiredResources: ResourceType[];
  desiredResources: ResourceType[];
  alerts: ClinicalAlert[];
}

export interface RecommendationResult {
  caseId: string;
  timestamp: string;
  caseData: CaseFormData;
  classification: ClassificationResult;
  recommended: HospitalRecommendation;
  alternatives: HospitalRecommendation[];
  excluded: ExcludedHospital[];
  processingTimeMs: number;
  timeToRecommendationMs: number;
}

export interface CaseTimeline {
  at: string;
  label: string;
  detail?: string;
  type: 'create' | 'classify' | 'recommend' | 'decide';
}

export interface SavedCase {
  id: string;
  caseData: CaseFormData;
  recommendation: RecommendationResult;
  finalHospitalId: string;
  finalHospitalName: string;
  divergedFromSuggestion: boolean;
  overrideReason?: string;
  savedAt: string;
  regulatorName: string;
  timeline: CaseTimeline[];
}

export interface User {
  id: string;
  name: string;
  role: 'regulador' | 'medico_regulador' | 'admin';
  crm?: string;
  initials: string;
  regionCode: string;
}

export interface OriginOption {
  name: string;
  lat: number;
  lng: number;
}
