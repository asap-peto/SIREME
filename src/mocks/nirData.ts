import { ResourceType } from '../types';

export interface NirTransferRequest {
  id: string;
  patientCode: string;
  originUnit: string;
  requestedResource: ResourceType;
  priority: 'critica' | 'alta' | 'moderada';
  suspectedCategory: string;
  requestedAt: string;
  status: 'aguardando' | 'contato' | 'aceite_parcial';
  notes: string;
}

export const NIR_TRANSFER_REQUESTS: NirTransferRequest[] = [
  {
    id: 'nir-001',
    patientCode: 'REDS-CTBA-1842',
    originUnit: 'UPA Boqueirão',
    requestedResource: 'UTI_ADULTO',
    priority: 'critica',
    suspectedCategory: 'Choque séptico',
    requestedAt: '2026-03-15T14:08:00-03:00',
    status: 'contato',
    notes: 'Paciente em noradrenalina, aguardando aceite com leito e ventilação.',
  },
  {
    id: 'nir-002',
    patientCode: 'REDS-CTBA-1846',
    originUnit: 'UPA Cajuru',
    requestedResource: 'NEUROCIRURGIA',
    priority: 'alta',
    suspectedCategory: 'TCE grave',
    requestedAt: '2026-03-15T14:18:00-03:00',
    status: 'aguardando',
    notes: 'Necessita retaguarda com TC repetida e potencial intervenção cirúrgica.',
  },
  {
    id: 'nir-003',
    patientCode: 'REDS-CTBA-1849',
    originUnit: 'UPA CIC',
    requestedResource: 'HEMODINAMICA',
    priority: 'critica',
    suspectedCategory: 'IAM com supra',
    requestedAt: '2026-03-15T14:24:00-03:00',
    status: 'aceite_parcial',
    notes: 'Contato positivo, aguardando confirmação de sala e equipe intervencionista.',
  },
  {
    id: 'nir-004',
    patientCode: 'REDS-CTBA-1854',
    originUnit: 'Maternidade Bairro Novo',
    requestedResource: 'UTI_NEONATAL',
    priority: 'alta',
    suspectedCategory: 'Prematuridade extrema',
    requestedAt: '2026-03-15T14:32:00-03:00',
    status: 'aguardando',
    notes: 'Gemelar, 29 semanas, necessidade neonatal imediata.',
  },
  {
    id: 'nir-005',
    patientCode: 'REDS-CTBA-1859',
    originUnit: 'UPA Fazendinha',
    requestedResource: 'UTI_PEDIATRICA',
    priority: 'moderada',
    suspectedCategory: 'Bronquiolite grave',
    requestedAt: '2026-03-15T14:41:00-03:00',
    status: 'contato',
    notes: 'Escalonando para unidade pediátrica com leito monitorado.',
  },
];
