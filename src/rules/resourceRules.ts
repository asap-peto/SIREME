import { CaseFormData, ClinicalCategory, GravityLevel, ResourceType } from '../types';

interface ResourceMap {
  required: ResourceType[];
  desired: ResourceType[];
}

export function determineResources(
  category: ClinicalCategory,
  gravity: GravityLevel,
  data?: CaseFormData
): ResourceMap {
  const baseMap: Record<ClinicalCategory, ResourceMap> = {
    cardiologico: {
      required: ['CARDIOLOGIA', 'BANCO_DE_SANGUE', 'TOMOGRAFIA'],
      desired: ['HEMODINAMICA', 'UTI_ADULTO', 'RESSONANCIA'],
    },
    neurologico: {
      required: ['TOMOGRAFIA', 'NEUROLOGIA'],
      desired: ['RESSONANCIA', 'NEUROCIRURGIA', 'UTI_ADULTO'],
    },
    trauma: {
      required: ['TRAUMA', 'BANCO_DE_SANGUE', 'TOMOGRAFIA'],
      desired: ['NEUROCIRURGIA', 'ORTOPEDIA', 'UTI_ADULTO', 'CIRURGIA_GERAL'],
    },
    infeccioso: {
      required: ['BANCO_DE_SANGUE'],
      desired: ['UTI_ADULTO', 'TOMOGRAFIA', 'DIALISE'],
    },
    obstetrico: {
      required: ['MATERNIDADE', 'BANCO_DE_SANGUE'],
      desired: ['UTI_NEONATAL', 'UTI_ADULTO'],
    },
    pediatrico: {
      required: ['PEDIATRIA'],
      desired: ['UTI_PEDIATRICA', 'BANCO_DE_SANGUE', 'TOMOGRAFIA'],
    },
    clinico_geral: {
      required: [],
      desired: ['UTI_ADULTO', 'TOMOGRAFIA', 'BANCO_DE_SANGUE'],
    },
  };

  const map = { ...baseMap[category] };
  const required = new Set(map.required);
  const desired = new Set(map.desired);

  // Gravity-based upgrades
  if (gravity === 'critico' || gravity === 'alto') {
    // Always need UTI for critical/high
    required.add('UTI_ADULTO');
    desired.add('BANCO_DE_SANGUE');
  }

  if (gravity === 'critico') {
    // Critical needs immediate surgical capacity
    if (category === 'cardiologico') {
      required.add('HEMODINAMICA');
      required.add('UTI_ADULTO');
    }
    if (category === 'neurologico') {
      required.add('NEUROCIRURGIA');
      required.add('UTI_ADULTO');
    }
    if (category === 'trauma') {
      required.add('NEUROCIRURGIA');
      required.add('UTI_ADULTO');
      required.add('CIRURGIA_GERAL');
    }
    if (category === 'infeccioso') {
      required.add('UTI_ADULTO');
    }
  }

  const tagSet = new Set(data?.triageTags ?? []);
  if (tagSet.has('dor_toracica_isquemica')) {
    required.add('CARDIOLOGIA');
    desired.add('HEMODINAMICA');
  }
  if (tagSet.has('deficit_focal_agudo')) {
    required.add('NEUROLOGIA');
    desired.add('NEUROCIRURGIA');
  }
  if (tagSet.has('insuficiencia_respiratoria')) {
    desired.add('UTI_ADULTO');
  }
  if (tagSet.has('choque_hipotensivo')) {
    required.add('BANCO_DE_SANGUE');
    desired.add('DIALISE');
  }
  if (tagSet.has('gestante_alto_risco')) {
    required.add('MATERNIDADE');
    desired.add('UTI_NEONATAL');
  }
  if (tagSet.has('crianca_risco')) {
    required.add('PEDIATRIA');
    desired.add('UTI_PEDIATRICA');
  }

  // Remove from desired what's already required
  required.forEach(r => desired.delete(r));

  return {
    required: Array.from(required),
    desired: Array.from(desired),
  };
}

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  UTI_ADULTO: 'UTI Adulto',
  UTI_PEDIATRICA: 'UTI Pediátrica',
  UTI_NEONATAL: 'UTI Neonatal',
  HEMODINAMICA: 'Hemodinâmica',
  NEUROCIRURGIA: 'Neurocirurgia',
  CIRURGIA_VASCULAR: 'Cirurgia Vascular',
  MATERNIDADE: 'Maternidade',
  BANCO_DE_SANGUE: 'Banco de Sangue',
  TOMOGRAFIA: 'Tomografia',
  RESSONANCIA: 'Ressonância',
  TRAUMA: 'Trauma',
  PEDIATRIA: 'Pediatria',
  CARDIOLOGIA: 'Cardiologia',
  NEUROLOGIA: 'Neurologia',
  ORTOPEDIA: 'Ortopedia',
  PSIQUIATRIA: 'Psiquiatria',
  QUEIMADOS: 'Queimados',
  DIALISE: 'Diálise',
  ENDOSCOPIA: 'Endoscopia',
  CIRURGIA_GERAL: 'Cirurgia Geral',
};

export const RESOURCE_ICONS: Partial<Record<ResourceType, string>> = {
  UTI_ADULTO: '🏥',
  UTI_PEDIATRICA: '👶',
  UTI_NEONATAL: '🍼',
  HEMODINAMICA: '❤️',
  NEUROCIRURGIA: '🧠',
  MATERNIDADE: '🤱',
  BANCO_DE_SANGUE: '🩸',
  TOMOGRAFIA: '📡',
  TRAUMA: '🩹',
};
