import { HospitalNirStatus, BrokenEquipmentItem } from '../types';

const STORAGE_KEY = 'sireme_hospital_nir_status';

function loadAll(): Record<string, HospitalNirStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, HospitalNirStatus>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getNirStatus(hospitalId: string): HospitalNirStatus | null {
  const all = loadAll();
  return all[hospitalId] ?? null;
}

export function getAllNirStatuses(): Record<string, HospitalNirStatus> {
  return loadAll();
}

export function saveNirStatus(status: HospitalNirStatus): void {
  const all = loadAll();
  all[status.hospitalId] = { ...status, updatedAt: new Date().toISOString() };
  saveAll(all);
}

export function addBrokenEquipment(
  hospitalId: string,
  item: Omit<BrokenEquipmentItem, 'id'>
): void {
  const all = loadAll();
  const status = all[hospitalId];
  if (!status) return;
  const newItem: BrokenEquipmentItem = {
    ...item,
    id: `eq-${Date.now()}`,
  };
  status.brokenEquipment = [...(status.brokenEquipment ?? []), newItem];
  status.updatedAt = new Date().toISOString();
  all[hospitalId] = status;
  saveAll(all);
}

export function removeBrokenEquipment(hospitalId: string, itemId: string): void {
  const all = loadAll();
  const status = all[hospitalId];
  if (!status) return;
  status.brokenEquipment = status.brokenEquipment.filter((e) => e.id !== itemId);
  status.updatedAt = new Date().toISOString();
  all[hospitalId] = status;
  saveAll(all);
}

export function createDefaultStatus(
  hospitalId: string,
  updatedBy: string,
  totalBeds: number,
  icuBeds: number
): HospitalNirStatus {
  return {
    hospitalId,
    updatedAt: new Date().toISOString(),
    updatedBy,
    bedsGeneral: Math.round(totalBeds * 0.2),
    bedsIcuAdult: Math.round(icuBeds * 0.3),
    bedsIcuPediatric: 0,
    bedsIcuNeonatal: 0,
    bedsObstetric: 0,
    psStatus: 'aberto',
    psQueueSize: 5,
    psWaitTimeMin: 20,
    brokenEquipment: [],
    generalNotes: '',
  };
}
