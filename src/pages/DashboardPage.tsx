import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Building2, History, FlaskConical, Clock, AlertTriangle, CheckCircle2, BedDouble } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllCases } from '../services/caseService';
import { Card, StatCard, GravityBadge, Badge, Button } from '../components/ui';
import { formatDate, formatDuration, GRAVITY_STYLES } from '../utils';
import { HOSPITALS } from '../mocks/hospitals';
import { getHospitalSnapshot } from '../services/hospitalService';

function PageHeader({ title, subtitle, user }: { title: string; subtitle: string; user: any }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
      <div>
        <p className="text-slate-500 text-xs font-body">{greeting}, {user?.name?.split(' ')[0]}</p>
        <h1 className="text-slate-100 text-xl font-bold font-display mt-0.5">{title}</h1>
        <p className="text-slate-500 text-xs font-body mt-0.5">{subtitle}</p>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-body">
        <Clock size={12} />
        {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
        {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [nowTick, setNowTick] = useState(() => Date.now());
  const cases = useMemo(() => getAllCases(), []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 20000);
    return () => window.clearInterval(timer);
  }, []);

  const today = new Date().toDateString();
  const todayCases = cases.filter(c => new Date(c.savedAt).toDateString() === today);
  const criticalCases = cases.filter(c => c.recommendation.classification.gravity === 'critico');
  const diverged = cases.filter(c => c.divergedFromSuggestion);

  const avgTime = cases.length > 0
    ? cases.reduce((sum, c) => sum + c.recommendation.timeToRecommendationMs, 0) / cases.length
    : 0;

  const topHospital = useMemo(() => {
    const freq: Record<string, number> = {};
    cases.forEach(c => { freq[c.recommendation.recommended.hospital.shortName] = (freq[c.recommendation.recommended.hospital.shortName] ?? 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [cases]);

  const recentCases = cases.slice(0, 5);
  const liveHospitals = useMemo(() => HOSPITALS.map((hospital) => ({ hospital, snapshot: getHospitalSnapshot(hospital, nowTick) })), [nowTick]);
  const constrainedUnits = liveHospitals.filter((unit) => unit.snapshot.occupancy === 'critica').length;

  return (
    <div className="min-h-screen bg-slate-950">
      <PageHeader
        title="Dashboard"
        subtitle={`Central de Regulação · ${user?.regionCode}`}
        user={user}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Casos Hoje"
            value={todayCases.length || 0}
            sub="registrados no dia"
            icon={<CheckCircle2 />}
            color="blue"
          />
          <StatCard
            label="Casos Críticos"
            value={criticalCases.length || 0}
            sub="no histórico total"
            icon={<AlertTriangle />}
            color="red"
          />
          <StatCard
            label="Tempo Médio"
            value={avgTime > 0 ? formatDuration(avgTime) : '—'}
            sub="até recomendação"
            icon={<Clock />}
            color="amber"
          />
          <StatCard
            label="Top Hospital"
            value={topHospital.split(' ').slice(0, 2).join(' ')}
            sub="mais recomendado"
            icon={<Building2 />}
            color="green"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-slate-400 text-xs font-medium font-body uppercase tracking-wider mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: PlusCircle, label: 'Novo Caso', sub: 'Iniciar regulação', to: '/cases/new', primary: true },
              { icon: Building2, label: 'Hospitais', sub: 'Painel + mapa', to: '/hospitals', primary: false },
              { icon: History, label: 'Histórico', sub: `${cases.length} casos`, to: '/history', primary: false },
              { icon: BedDouble, label: 'NIR / Leitos', sub: 'Capacidade da rede', to: '/nir', primary: false },
              { icon: FlaskConical, label: 'Simulação', sub: '5 casos demo', to: '/simulation', primary: false },
            ].map(item => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`p-4 rounded-xl border text-left transition-all group ${
                  item.primary
                    ? 'bg-blue-600/20 border-blue-500/30 hover:bg-blue-600/30'
                    : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <item.icon size={20} className={item.primary ? 'text-blue-400 mb-2' : 'text-slate-400 mb-2 group-hover:text-slate-300'} />
                <p className={`font-semibold font-display text-sm ${item.primary ? 'text-blue-300' : 'text-slate-200'}`}>{item.label}</p>
                <p className="text-slate-500 text-xs font-body mt-0.5">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Cases */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-200 font-semibold font-display text-sm">Casos Recentes</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>Ver todos</Button>
            </div>
            <Card noPadding>
              {recentCases.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-500 text-sm font-body">Nenhum caso registrado ainda.</p>
                  <Button variant="primary" size="sm" className="mt-4" onClick={() => navigate('/cases/new')}>
                    Criar primeiro caso
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {recentCases.map(c => (
                    <div key={c.id} className="px-4 py-3 hover:bg-slate-800/30 transition-all cursor-pointer" onClick={() => navigate('/history')}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-200 text-xs font-mono">{c.id}</span>
                            <GravityBadge gravity={c.recommendation.classification.gravity} size="xs" />
                            {c.divergedFromSuggestion && (
                              <Badge variant="warning" size="xs">Override</Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs font-body mt-0.5 truncate">
                            {c.finalHospitalName} · {c.regulatorName}
                          </p>
                        </div>
                        <span className="text-slate-500 text-[10px] font-body flex-shrink-0">
                          {formatDate(c.savedAt).split(' ')[1]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Indicators */}
          <div className="space-y-4">
            <h2 className="text-slate-200 font-semibold font-display text-sm">Indicadores</h2>
            <Card>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-body mb-1.5">
                    <span className="text-slate-400">Aderência à sugestão</span>
                    <span className="text-slate-200 font-medium">
                      {cases.length > 0 ? `${Math.round(((cases.length - diverged.length) / cases.length) * 100)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: cases.length > 0 ? `${((cases.length - diverged.length) / cases.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-body mb-1.5">
                    <span className="text-slate-400">Divergências</span>
                    <span className="text-amber-400 font-medium">{diverged.length}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: cases.length > 0 ? `${(diverged.length / cases.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800/60">
                  <p className="text-slate-500 text-xs font-body">Total de casos: <span className="text-slate-200 font-medium">{cases.length}</span></p>
                  {cases.length > 0 && (
                    <p className="text-slate-500 text-xs font-body mt-1">
                      Mais recente: <span className="text-slate-200">{formatDate(cases[0].savedAt)}</span>
                    </p>
                  )}
                  <p className="text-slate-500 text-xs font-body mt-1">
                    Unidades sob pressão: <span className="text-amber-300">{constrainedUnits}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Gravity distribution */}
            <Card>
              <p className="text-slate-400 text-xs font-body font-medium mb-3">Distribuição por Gravidade</p>
              {(['critico', 'alto', 'moderado', 'baixo'] as const).map(g => {
                const count = cases.filter(c => c.recommendation.classification.gravity === g).length;
                const pct = cases.length > 0 ? (count / cases.length) * 100 : 0;
                const s = GRAVITY_STYLES[g];
                return (
                  <div key={g} className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                    <span className={`text-xs font-body w-16 ${s.text}`}>{g.charAt(0).toUpperCase() + g.slice(1)}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-slate-500 text-xs font-body w-4">{count}</span>
                  </div>
                );
              })}
              {cases.length === 0 && <p className="text-slate-600 text-xs font-body text-center py-2">Sem dados</p>}
            </Card>

            <Card>
              <p className="text-slate-400 text-xs font-body font-medium mb-3">Rede em Tempo Simulado</p>
              <div className="space-y-3">
                {liveHospitals
                  .sort((a, b) => a.snapshot.occupancyPercent - b.snapshot.occupancyPercent)
                  .slice(0, 3)
                  .map((unit) => (
                    <div key={unit.hospital.id} className="rounded-lg bg-slate-800/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-slate-200 text-xs font-semibold font-display">{unit.hospital.shortName}</p>
                        <Badge variant="info" size="xs">{unit.snapshot.statusLabel}</Badge>
                      </div>
                      <p className="text-slate-500 text-[11px] font-body mt-1">
                        {unit.snapshot.availableBeds} leitos livres · fila urgência {unit.snapshot.emergencyQueue}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
