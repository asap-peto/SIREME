import { useEffect, useState } from 'react';
import { MapPin, Phone } from 'lucide-react';
import { HOSPITALS } from '../mocks/hospitals';
import { Hospital, HospitalType } from '../types';
import { Card, Badge, OccupancyBar, Button } from '../components/ui';
import { RESOURCE_LABELS } from '../rules/resourceRules';
import { HospitalMap } from '../components/map/HospitalMap';
import { getHospitalSnapshot } from '../services/hospitalService';
import { CARE_LINE_LABELS } from '../utils';

function HospitalPanel({ h, tick }: { h: Hospital; tick: number }) {
  const snapshot = getHospitalSnapshot(h, tick);
  const typeLabel: Record<HospitalType, string> = { hospital: 'Hospital', upa: 'UPA 24h', ubs: 'UBS' };
  const typeColor: Record<HospitalType, string> = {
    hospital: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    upa: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
    ubs: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  };

  return (
    <Card className="hover:border-slate-700/60 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold font-body ${typeColor[h.type]}`}>
              {typeLabel[h.type]}
            </span>
            <span className="text-slate-600 font-mono text-[10px]">CNES {h.cnes}</span>
          </div>
          <h3 className="text-slate-100 font-semibold font-display text-sm">{h.name}</h3>
          <p className="text-slate-500 text-xs font-body mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {h.address}, {h.neighborhood}
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-blue-300 font-bold font-display text-lg">{h.baseScore}</p>
          <p className="text-slate-600 text-[10px] font-body">score base</p>
        </div>
      </div>

      <OccupancyBar percent={snapshot.occupancyPercent} level={snapshot.occupancy} />

      <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs font-body">
        <div className="p-1.5 bg-slate-800/40 rounded-lg">
          <p className="text-slate-500">Leitos</p>
          <p className="text-slate-200 font-semibold font-display">{h.totalBeds}</p>
        </div>
        <div className="p-1.5 bg-slate-800/40 rounded-lg">
          <p className="text-slate-500">UTI</p>
          <p className={`font-semibold font-display ${h.icuBeds > 0 ? 'text-blue-300' : 'text-slate-500'}`}>{h.icuBeds || '—'}</p>
        </div>
        <div className="p-1.5 bg-slate-800/40 rounded-lg">
          <p className="text-slate-500">Recursos</p>
          <p className="text-emerald-300 font-semibold font-display">{h.resources.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs font-body">
        <div className="p-1.5 bg-slate-800/40 rounded-lg">
          <p className="text-slate-500">Fila</p>
          <p className="text-slate-200 font-semibold font-display">{snapshot.emergencyQueue}</p>
        </div>
        <div className="p-1.5 bg-slate-800/40 rounded-lg">
          <p className="text-slate-500">Livres</p>
          <p className="text-cyan-300 font-semibold font-display">{snapshot.availableBeds}</p>
        </div>
        <div className="p-1.5 bg-slate-800/40 rounded-lg">
          <p className="text-slate-500">Status</p>
          <p className="text-slate-200 font-semibold font-display text-[11px]">{snapshot.statusLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {h.badges.map(b => <Badge key={b} variant="default" size="xs">{b}</Badge>)}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {h.careLines.map((line) => <Badge key={line} variant="info" size="xs">{CARE_LINE_LABELS[line]}</Badge>)}
      </div>

      <div className="border-t border-slate-800/60 pt-3">
        <p className="text-slate-600 text-[10px] font-body uppercase tracking-wider mb-2">O que oferece</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {h.offers.map((offer) => (
            <span key={offer} className="text-[10px] font-body px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-200">
              {offer}
            </span>
          ))}
        </div>
        <p className="text-slate-600 text-[10px] font-body uppercase tracking-wider mb-2">Recursos disponíveis</p>
        <div className="flex flex-wrap gap-1">
          {h.resources.map(r => (
            <span key={r} className="text-[10px] font-body px-1.5 py-0.5 bg-slate-800/60 border border-slate-700/40 rounded text-slate-400">
              {RESOURCE_LABELS[r]}
            </span>
          ))}
        </div>
        <p className="text-slate-500 text-[11px] font-body mt-3">{h.regulationNotes}</p>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 font-body">
        <Phone size={11} />
        {h.phone}
      </div>
    </Card>
  );
}

export function HospitalsPage() {
  const [tick, setTick] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<'all' | 'hospital' | 'upa'>('all');

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = filter === 'all' ? HOSPITALS : HOSPITALS.filter(h => h.type === filter);
  const selected = HOSPITALS.find(h => h.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-6 py-5 border-b border-slate-800/60">
        <h1 className="text-slate-100 text-xl font-bold font-display">Painel Hospitalar</h1>
        <p className="text-slate-500 text-xs font-body mt-0.5">
          {HOSPITALS.length} unidades · Curitiba e Região Metropolitana · oferta assistencial mockada
        </p>
      </div>

      <div className="p-4 lg:p-6 space-y-5 animate-fade-in">
        {/* Map */}
        <div className="rounded-xl overflow-hidden border border-slate-800/60">
          <HospitalMap
            hospitals={HOSPITALS}
            selectedId={selectedId}
            onSelect={id => setSelectedId(id === selectedId ? undefined : id)}
            height="360px"
          />
        </div>

        {selected && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
            <p className="text-blue-300 text-sm font-body">
              <strong className="font-display">{selected.shortName}</strong> selecionado no mapa
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(undefined)}>Limpar</Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          {([
            { v: 'all', label: `Todos (${HOSPITALS.length})` },
            { v: 'hospital', label: `Hospitais (${HOSPITALS.filter(h => h.type === 'hospital').length})` },
            { v: 'upa', label: `UPAs (${HOSPITALS.filter(h => h.type === 'upa').length})` },
          ] as const).map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body border transition-all ${
                filter === f.v
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(h => (
            <div key={h.id} onClick={() => setSelectedId(h.id)} className="cursor-pointer">
              <HospitalPanel h={h} tick={tick} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
