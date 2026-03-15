import { Hospital, HospitalOperationalSnapshot, OccupancyLevel } from '../types';

function occupancyFromPercent(percent: number): OccupancyLevel {
  if (percent >= 90) return 'critica';
  if (percent >= 75) return 'alta';
  if (percent >= 55) return 'media';
  return 'baixa';
}

export function getHospitalSnapshot(hospital: Hospital, seed = Date.now()): HospitalOperationalSnapshot {
  const minuteBucket = Math.floor(seed / 60000);
  const wave = Math.sin((minuteBucket + hospital.loadFactor) / 2.4) * 7;
  const pulse = Math.cos((minuteBucket + hospital.loadFactor) / 3.7) * 4;
  const percent = Math.max(28, Math.min(98, Math.round(hospital.occupancyPercent + wave + pulse)));
  const occupancy = occupancyFromPercent(percent);
  const availableBeds = Math.max(0, Math.round(hospital.totalBeds * (100 - percent) / 100));
  const emergencyQueue = Math.max(1, Math.round((percent / 12) + hospital.loadFactor));

  const statusLabel =
    occupancy === 'critica'
      ? 'Fluxo tensionado'
      : occupancy === 'alta'
      ? 'Capacidade monitorada'
      : occupancy === 'media'
      ? 'Operação estável'
      : 'Boa disponibilidade';

  return {
    occupancyPercent: percent,
    occupancy,
    availableBeds,
    emergencyQueue,
    statusLabel,
    updatedAt: new Date(seed).toISOString(),
  };
}

export function getHospitalNetwork(hospitals: Hospital[], seed = Date.now()) {
  return hospitals.map((hospital) => ({
    hospital,
    snapshot: getHospitalSnapshot(hospital, seed),
  }));
}
