import { User } from '../types';

export const MOCK_USERS: Array<User & { password: string; email: string }> = [
  {
    id: 'usr-001',
    name: 'Dr. Ricardo Silva',
    email: 'r.silva@samu-cwb.gov.br',
    password: 'sireme2024',
    role: 'medico_regulador',
    crm: 'CRM/PR 28.441',
    initials: 'RS',
    regionCode: 'RMC-01',
  },
  {
    id: 'usr-002',
    name: 'Enf. Carla Santos',
    email: 'c.santos@samu-cwb.gov.br',
    password: 'sireme2024',
    role: 'regulador',
    initials: 'CS',
    regionCode: 'RMC-01',
  },
  {
    id: 'usr-003',
    name: 'Admin Sistema',
    email: 'admin@sireme.health',
    password: 'admin2024',
    role: 'admin',
    initials: 'AS',
    regionCode: 'RMC-00',
  },
];
