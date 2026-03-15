import { CaseFormData, ClinicalAlert, GravityLevel, ClinicalCategory } from '../types';

export function generateAlerts(
  data: CaseFormData,
  gravity: GravityLevel,
  category: ClinicalCategory
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const v = data.vitalSigns;
  const text = `${data.chiefComplaint} ${data.clinicalSuspicion}`.toLowerCase();
  const tagSet = new Set(data.triageTags ?? []);

  // Critical gravity
  if (gravity === 'critico') {
    alerts.push({
      level: 'critical',
      code: 'GRAV-001',
      message: 'Caso CRÍTICO — Prioridade máxima de encaminhamento. Notificar hospital destino imediatamente.',
    });
  }

  // SpO2 critical
  if (v.saturacaoO2 !== undefined && v.saturacaoO2 < 90) {
    alerts.push({
      level: 'critical',
      code: 'RESP-001',
      message: `SpO₂ ${v.saturacaoO2}% — Hipoxemia severa. Verificar via aérea e suporte ventilatório.`,
    });
  } else if (v.saturacaoO2 !== undefined && v.saturacaoO2 < 94) {
    alerts.push({
      level: 'warning',
      code: 'RESP-002',
      message: `SpO₂ ${v.saturacaoO2}% — Hipoxemia moderada. Monitorar via aérea.`,
    });
  }

  // Hemodynamic shock
  if (v.pressuraSistolica !== undefined && v.pressuraSistolica < 90) {
    alerts.push({
      level: 'critical',
      code: 'HEMO-001',
      message: `PA ${v.pressuraSistolica}/${v.pressuraDiastolica ?? '?'} mmHg — Hipotensão grave. Risco de choque.`,
    });
  }

  // Tachycardia
  if (v.frequenciaCardiaca !== undefined && v.frequenciaCardiaca > 130) {
    alerts.push({
      level: 'warning',
      code: 'CARD-001',
      message: `FC ${v.frequenciaCardiaca} bpm — Taquicardia intensa. Investigar etiologia (choque, arritmia, sepse).`,
    });
  }

  // Bradycardia
  if (v.frequenciaCardiaca !== undefined && v.frequenciaCardiaca < 50) {
    alerts.push({
      level: 'critical',
      code: 'CARD-002',
      message: `FC ${v.frequenciaCardiaca} bpm — Bradicardia grave. Risco de BAV ou parada.`,
    });
  }

  // Low GCS
  if (v.glasgow !== undefined && v.glasgow <= 8) {
    alerts.push({
      level: 'critical',
      code: 'NEURO-001',
      message: `Glasgow ${v.glasgow} — Rebaixamento grave. Risco de perda de via aérea. IOT indicada.`,
    });
  } else if (data.consciousnessLevel === 'inconsciente') {
    alerts.push({
      level: 'critical',
      code: 'NEURO-002',
      message: 'Paciente inconsciente — Proteção de via aérea obrigatória.',
    });
  }

  // Fever + hypotension = sepsis
  if (v.temperatura !== undefined && v.temperatura > 38.5 &&
      v.pressuraSistolica !== undefined && v.pressuraSistolica < 100) {
    alerts.push({
      level: 'critical',
      code: 'SEP-001',
      message: 'Febre + hipotensão — Critérios de sepse/choque séptico. Protocolo Bundle Sepse deve ser ativado.',
    });
  }

  // Cardiac category — time window
  if (category === 'cardiologico' && /supra de st|iam/.test(text)) {
    alerts.push({
      level: 'critical',
      code: 'TIME-001',
      message: 'Suspeita de IAM com supra — Tempo porta-balão alvo ≤ 90 min. ICP primária prioritária.',
    });
  }

  // Neurological — stroke window
  if (category === 'neurologico' && /avc|trombólise|nihss|déficit focal/.test(text)) {
    alerts.push({
      level: 'critical',
      code: 'TIME-002',
      message: 'Suspeita de AVC isquêmico — Janela terapêutica para rt-PA até 4,5h do início. AngioTC urgente.',
    });
  }

  // Obstetric
  if (category === 'obstetrico') {
    alerts.push({
      level: 'warning',
      code: 'OBS-001',
      message: 'Caso obstétrico — Encaminhar exclusivamente para unidade com Maternidade + UTI Neonatal disponível.',
    });
    if (/eclâmpsia/.test(text)) {
      alerts.push({
        level: 'critical',
        code: 'OBS-002',
        message: 'Eclâmpsia confirmada — Magnésio em infusão. Parto de urgência pode ser necessário. Neonatologista de sobreaviso.',
      });
    }
  }

  if (tagSet.has('choque_hipotensivo')) {
    alerts.push({
      level: 'critical',
      code: 'TRI-001',
      message: 'Triagem sinaliza choque/hipoperfusão. Priorizar destino com retaguarda intensiva e banco de sangue.',
    });
  }

  if (tagSet.has('insuficiencia_respiratoria')) {
    alerts.push({
      level: 'warning',
      code: 'TRI-002',
      message: 'Triagem sinaliza insuficiência respiratória. Garantir oxigenoterapia, via aérea avançada e leito monitorado.',
    });
  }

  if (tagSet.has('politrauma_mecanismo')) {
    alerts.push({
      level: 'critical',
      code: 'TRI-003',
      message: 'Mecanismo de trauma maior informado. Direcionar para serviço com trauma, TC e equipe cirúrgica.',
    });
  }

  // Pediatric
  if (category === 'pediatrico') {
    alerts.push({
      level: 'warning',
      code: 'PED-001',
      message: 'Caso pediátrico — Encaminhar para unidade com UTI Pediátrica ou Pediatria especializada.',
    });
  }

  // High temperature
  if (v.temperatura !== undefined && v.temperatura > 40) {
    alerts.push({
      level: 'warning',
      code: 'TEMP-001',
      message: `Temperatura ${v.temperatura}°C — Hipertermia grave. Investigar causa (sepse, golpe de calor).`,
    });
  }

  // Extreme glycemia
  if (v.glicemia !== undefined) {
    if (v.glicemia < 50) {
      alerts.push({
        level: 'critical',
        code: 'METAB-001',
        message: `Glicemia ${v.glicemia} mg/dL — Hipoglicemia grave. Tratar imediatamente com glicose EV.`,
      });
    } else if (v.glicemia > 400) {
      alerts.push({
        level: 'warning',
        code: 'METAB-002',
        message: `Glicemia ${v.glicemia} mg/dL — Hiperglicemia grave. Suspeitar de CAD/EHHNC.`,
      });
    }
  }

  // Occupancy warning (from case type)
  if (data.caseType === 'transferencia') {
    alerts.push({
      level: 'info',
      code: 'LOG-001',
      message: 'Caso de transferência — Confirmar disponibilidade e aceite formal do hospital destino antes do transporte.',
    });
  }

  return alerts;
}
