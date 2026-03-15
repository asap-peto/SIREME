import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Clock3, ShieldAlert, Building2, CheckCircle, AlertTriangle, Wrench, Activity } from 'lucide-react';
import { Card, Badge, StatCard } from '../components/ui';
import { HOSPITALS } from '../mocks/hospitals';
import { NIR_TRANSFER_REQUESTS } from '../mocks/nirData';
import { getHospitalSnapshot } from '../services/hospitalService';
import { getAllNirStatuses } from '../services/nirHospitalService';
import { HospitalNirStatus } from '../types';
import { RESOURCE_LABELS } from '../rules/resourceRules';
import { formatTime } from '../utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils';

function resourceBedEstimate(resourceCount: number, snapshotPercent: number, multiplier: number) {
  return Math.max(0, Math.round(resourceCount * multiplier * (100 - snapshotPercent) / 100));
}

const PS_STATUS_COLORS = {
  aberto: { badge: 'success' as const, dot: 'bg-emerald-400' },
  restrito: { badge: 'warning' as const, dot: 'bg-amber-400' },
  fechado: { badge: 'danger' as const, dot: 'bg-red-400' },
};

export function NirPage() {
  const [tick, setTick] = useState(() => Date.now());
  const [nirStatuses, setNirStatuses] = useState<Record<string, HospitalNirStatus>>({});

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 20000);
    return () => window.clearInterval(timer);
  }, []);

  // Reload NIR statuses on every tick
  useEffect(() => {
    setNirStatuses(getAllNirStatuses());
  }, [tick]);

  const network = useMemo(
    () => HOSPITALS.map((hospital) => ({ hospital, snapshot: getHospitalSnapshot(hospital, tick) })),
    [tick]
  );

  const nirBoard = useMemo(() => {
    return network
      .filter((item) => item.hospital.type === 'hospital')
      .map((item) => {
        const { hospital, snapshot } = item;
        const nirStatus = nirStatuses[hospital.id] ?? null;

        // Use real NIR data when available, otherwise fall back to simulation
        const adultIcu = nirStatus
          ? nirStatus.bedsIcuAdult
          : hospital.resources.includes('UTI_ADULTO') ? resourceBedEstimate(hospital.icuBeds || 8, snapshot.occupancyPercent, 1) : 0;
        const pedIcu = nirStatus
          ? nirStatus.bedsIcuPediatric
          : hospital.resources.includes('UTI_PEDIATRICA') ? resourceBedEstimate(Math.max(4, Math.round(hospital.icuBeds * 0.35)), snapshot.occupancyPercent, 0.9) : 0;
        const neoIcu = nirStatus
          ? nirStatus.bedsIcuNeonatal
          : hospital.resources.includes('UTI_NEONATAL') ? resourceBedEstimate(Math.max(4, Math.round(hospital.icuBeds * 0.45)), snapshot.occupancyPercent, 0.8) : 0;
        const monitored = nirStatus
          ? nirStatus.bedsGeneral
          : resourceBedEstimate(Math.max(6, Math.round(hospital.totalBeds * 0.12)), snapshot.occupancyPercent, 1.2);
        const surgeryWindow = hospital.resources.includes('CIRURGIA_GERAL') || hospital.resources.includes('HEMODINAMICA');

        return {
          hospital,
          snapshot,
          nirStatus,
          adultIcu,
          pedIcu,
          neoIcu,
          monitored,
          surgeryWindow,
          hasRealData: !!nirStatus,
        };
      })
      .sort((a, b) => {
        const aCapacity = a.adultIcu + a.pedIcu + a.neoIcu + a.monitored;
        const bCapacity = b.adultIcu + b.pedIcu + b.neoIcu + b.monitored;
        return bCapacity - aCapacity;
      });
  }, [network, nirStatuses]);

  const metrics = useMemo(() => {
    const adultBeds = nirBoard.reduce((sum, item) => sum + item.adultIcu, 0);
    const pedBeds = nirBoard.reduce((sum, item) => sum + item.pedIcu, 0);
    const neoBeds = nirBoard.reduce((sum, item) => sum + item.neoIcu, 0);
    const constrained = nirBoard.filter((item) => item.snapshot.occupancy === 'critica' || item.snapshot.occupancy === 'alta').length;
    const avgAcceptance = 11;
    const realDataCount = nirBoard.filter((item) => item.hasRealData).length;

    return { adultBeds, pedBeds, neoBeds, constrained, avgAcceptance, realDataCount };
  }, [nirBoard]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-6 py-5 border-b border-slate-800/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-slate-100 text-xl font-bold font-display">NIR / Painel de Leitos</h1>
            <p className="text-slate-500 text-xs font-body mt-0.5">Visão executiva de capacidade, fila regulada e gargalos da rede hospitalar</p>
          </div>
          {metrics.realDataCount > 0 && (
            <Badge variant="success" size="sm">
              <CheckCircle size={10} />
              {metrics.realDataCount} hospital{metrics.realDataCount > 1 ? 'is' : ''} com dados reais
            </Badge>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard label="UTI Adulto Livre" value={metrics.adultBeds} sub="leitos estimados" icon={<BedDouble />} color="blue" />
          <StatCard label="UTI Pediátrica" value={metrics.pedBeds} sub="leitos estimados" icon={<ShieldAlert />} color="green" />
          <StatCard label="UTI Neonatal" value={metrics.neoBeds} sub="leitos estimados" icon={<Building2 />} color="amber" />
          <StatCard label="Fila Regulada" value={NIR_TRANSFER_REQUESTS.length} sub="solicitações ativas" icon={<Clock3 />} color="red" />
          <StatCard label="Tempo Médio" value={`${metrics.avgAcceptance} min`} sub="até aceite" icon={<Clock3 />} color="blue" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-slate-100 font-semibold font-display text-sm">Painel de Leitos</h2>
                <p className="text-slate-500 text-xs font-body">
                  {metrics.realDataCount > 0
                    ? `${metrics.realDataCount} hospitais com atualização real · demais simulados`
                    : 'Atualização simulada a cada 20 segundos'}
                </p>
              </div>
              <Badge variant="warning" size="sm">{metrics.constrained} unidades pressionadas</Badge>
            </div>

            <div className="space-y-3">
              {nirBoard.map((item) => {
                const psConfig = item.nirStatus ? PS_STATUS_COLORS[item.nirStatus.psStatus] : null;

                return (
                  <Card key={item.hospital.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-slate-100 font-semibold font-display text-sm">{item.hospital.shortName}</p>
                          {item.hasRealData ? (
                            <Badge variant="success" size="xs">
                              <CheckCircle size={9} />
                              Dados reais NIR
                            </Badge>
                          ) : (
                            <Badge variant="info" size="xs">{item.snapshot.statusLabel}</Badge>
                          )}
                          {item.surgeryWindow && <Badge variant="default" size="xs">Janela cirúrgica</Badge>}
                          {/* PS status badge */}
                          {item.nirStatus && (
                            <Badge variant={psConfig!.badge} size="xs">
                              <span className={cn('w-1.5 h-1.5 rounded-full', psConfig!.dot)} />
                              PS {item.nirStatus.psStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs font-body mt-1">
                          {item.hospital.neighborhood}
                          {item.hasRealData
                            ? ` · atualizado ${formatDistanceToNow(new Date(item.nirStatus!.updatedAt), { addSuffix: true, locale: ptBR })}`
                            : ` · fila ${item.snapshot.emergencyQueue} · atualizado ${formatTime(item.snapshot.updatedAt)}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        {item.hasRealData && item.nirStatus?.psQueueSize !== undefined ? (
                          <>
                            <p className="text-slate-200 font-semibold font-display">{item.nirStatus!.psQueueSize} pac.</p>
                            <p className="text-slate-600 text-[10px] font-body">fila PS</p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-200 font-semibold font-display">{item.snapshot.occupancyPercent}%</p>
                            <p className="text-slate-600 text-[10px] font-body">ocupação</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="rounded-xl bg-slate-800/30 p-3">
                        <p className="text-slate-500 text-[10px] font-body uppercase">UTI adulto</p>
                        <p className="text-blue-300 font-semibold font-display text-lg mt-1">{item.adultIcu}</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/30 p-3">
                        <p className="text-slate-500 text-[10px] font-body uppercase">UTI pediátrica</p>
                        <p className="text-emerald-300 font-semibold font-display text-lg mt-1">{item.pedIcu}</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/30 p-3">
                        <p className="text-slate-500 text-[10px] font-body uppercase">UTI neo</p>
                        <p className="text-amber-300 font-semibold font-display text-lg mt-1">{item.neoIcu}</p>
                      </div>
                      <div className="rounded-xl bg-slate-800/30 p-3">
                        <p className="text-slate-500 text-[10px] font-body uppercase">{item.hasRealData ? 'Clínicos livres' : 'Monitorizados'}</p>
                        <p className="text-cyan-300 font-semibold font-display text-lg mt-1">{item.monitored}</p>
                      </div>
                    </div>

                    {/* Real NIR alerts */}
                    {item.nirStatus && (
                      <div className="mt-3 space-y-2">
                        {item.nirStatus.brokenEquipment.length > 0 && (
                          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                            <Wrench size={12} className="text-rose-400 flex-shrink-0" />
                            <p className="text-rose-300 text-xs font-body">
                              {item.nirStatus.brokenEquipment.length} equipamento{item.nirStatus.brokenEquipment.length > 1 ? 's' : ''} com problema:{' '}
                              {item.nirStatus.brokenEquipment.map((e) => e.name).join(', ')}
                            </p>
                          </div>
                        )}
                        {item.nirStatus.generalNotes && (
                          <div className="flex items-start gap-2 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2">
                            <AlertTriangle size={12} className="text-sky-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sky-300 text-xs font-body leading-relaxed">{item.nirStatus.generalNotes}</p>
                          </div>
                        )}
                        {item.nirStatus.psStatus !== 'aberto' && item.nirStatus.psWaitTimeMin > 0 && (
                          <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2">
                            <Activity size={12} className="text-slate-400 flex-shrink-0" />
                            <p className="text-slate-400 text-xs font-body">
                              Espera PS: ~{item.nirStatus.psWaitTimeMin} min
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!item.hasRealData && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {item.hospital.offers.slice(0, 4).map((offer) => (
                          <Badge key={offer} variant="ghost" size="xs">{offer}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-slate-100 font-semibold font-display text-sm">Fila de Solicitações</h2>
              <p className="text-slate-500 text-xs font-body">Pedidos monitorados pelo núcleo interno de regulação</p>
            </div>

            <div className="space-y-3">
              {NIR_TRANSFER_REQUESTS.map((request) => (
                <Card key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-slate-100 font-semibold font-display text-sm">{request.patientCode}</p>
                        <Badge
                          variant={request.priority === 'critica' ? 'danger' : request.priority === 'alta' ? 'warning' : 'info'}
                          size="xs"
                        >
                          {request.priority}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-xs font-body mt-1">{request.suspectedCategory}</p>
                    </div>
                    <Badge variant="default" size="xs">{request.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs font-body">
                    <p className="text-slate-500">Origem: <span className="text-slate-300">{request.originUnit}</span></p>
                    <p className="text-slate-500">Recurso: <span className="text-slate-300">{RESOURCE_LABELS[request.requestedResource]}</span></p>
                    <p className="text-slate-500">Solicitado às <span className="text-slate-300">{formatTime(request.requestedAt)}</span></p>
                    <p className="text-slate-400 leading-relaxed">{request.notes}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Card glow="red">
              <p className="text-slate-100 font-semibold font-display text-sm">Leitura da Rede</p>
              <div className="space-y-2 mt-3 text-xs font-body">
                <p className="text-slate-400">Trauma e neuro seguem concentrados em HC-UFPR, HU Cajuru e Hospital do Trabalhador.</p>
                <p className="text-slate-400">Linha materno-infantil permanece mais resiliente na Victor Ferreira e Pequeno Príncipe.</p>
                <p className="text-slate-400">Oportunidade de redistribuição: casos clínicos estáveis podem aliviar serviços de alta complexidade.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
