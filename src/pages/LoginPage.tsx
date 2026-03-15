import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, AlertCircle, Hospital } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui';
import { cn } from '../utils';

type AccessMode = 'regulacao' | 'hospital';

const DEMO_REGULATORS = [
  { email: 'r.silva@samu-cwb.gov.br', password: 'sireme2024', name: 'Dr. Ricardo Silva', sub: 'Médico Regulador · SAMU', initials: 'RS', color: 'bg-blue-600' },
  { email: 'c.santos@samu-cwb.gov.br', password: 'sireme2024', name: 'Enf. Carla Santos', sub: 'Regulador · SAMU', initials: 'CS', color: 'bg-emerald-600' },
];

const DEMO_HOSPITALS = [
  { email: 'nir@evangelico.com.br',                   password: 'nir2024', name: 'H. Evangélico',  sub: 'Cardiologia · Bigorrilho', initials: 'HE', color: 'bg-violet-600' },
  { email: 'nir@upa-boavista.curitiba.pr.gov.br',     password: 'nir2024', name: 'UPA Boa Vista',  sub: 'UPA 24h · Norte',           initials: 'BV', color: 'bg-orange-500' },
  { email: 'nir@hc.ufpr.br',                          password: 'nir2024', name: 'HC-UFPR',        sub: 'Hospital Universitário',    initials: 'HC', color: 'bg-blue-700' },
  { email: 'nir@cajuru.pucpr.br',                     password: 'nir2024', name: 'HU Cajuru',      sub: 'Trauma · PUC-PR',           initials: 'CA', color: 'bg-rose-600' },
  { email: 'nir@trabalhador.pr.gov.br',               password: 'nir2024', name: 'H. Trabalhador', sub: 'Trauma · Novo Mundo',       initials: 'HT', color: 'bg-amber-600' },
  { email: 'nir@pequenoprincipe.org.br',              password: 'nir2024', name: 'Pequeno Príncipe',sub: 'Pediatria · Água Verde',   initials: 'PP', color: 'bg-pink-600' },
];

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AccessMode>('regulacao');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const loggedUser = login(email, password);
    setLoading(false);
    if (loggedUser) {
      navigate(loggedUser.role === 'hospital_nir' ? '/hospital-nir' : '/dashboard');
    } else {
      setError('Credenciais inválidas. Verifique e-mail e senha.');
    }
  };

  const fill = (u: { email: string; password: string }) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  const inputCls = 'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 font-body text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-3">
            <Activity size={24} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-100 tracking-tight">SIREME</h1>
          <p className="text-slate-500 text-xs font-body mt-1">Sistema Inteligente de Regulação Médica</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-slate-900/80 border border-slate-800/60 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setMode('regulacao'); setEmail(''); setPassword(''); setError(''); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold font-body transition-all',
              mode === 'regulacao'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Activity size={13} />
            Central de Regulação
          </button>
          <button
            onClick={() => { setMode('hospital'); setEmail(''); setPassword(''); setError(''); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold font-body transition-all',
              mode === 'hospital'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Hospital size={13} />
            Acesso Hospital / UPA
          </button>
        </div>

        {/* Login card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-2xl shadow-black/40 mb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 font-body mb-1.5">E-mail</label>
              <input
                type="email"
                className={inputCls}
                placeholder={mode === 'hospital' ? 'nir@hospital.com.br' : 'seu@samu.gov.br'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 font-body mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`${inputCls} pr-10`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-body">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className={cn('w-full rounded-xl', mode === 'hospital' && 'bg-violet-600 hover:bg-violet-500 border-violet-500/50 shadow-violet-500/20')}>
              {mode === 'hospital' ? 'Entrar como Hospital / UPA' : 'Entrar na Central'}
            </Button>
          </form>
        </div>

        {/* Demo profiles */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800/60 p-4">
          {mode === 'regulacao' ? (
            <>
              <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider mb-3">Perfis demo — Regulação</p>
              <div className="space-y-2">
                {DEMO_REGULATORS.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => fill(u)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/60 transition-all group text-left"
                  >
                    <div className={`w-8 h-8 rounded-full ${u.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{u.initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-300 text-xs font-medium font-body">{u.name}</p>
                      <p className="text-slate-500 text-[10px] font-body">{u.sub}</p>
                    </div>
                    <span className="ml-auto text-slate-700 text-[10px] font-body opacity-0 group-hover:opacity-100 transition-opacity">preencher →</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-500 text-[10px] font-body uppercase tracking-wider mb-3">Perfis demo — Hospital / UPA · senha: <span className="text-violet-400 font-semibold">nir2024</span></p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_HOSPITALS.map((u) => (
                  <button
                    key={u.email}
                    onClick={() => fill(u)}
                    className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-800/60 transition-all text-left border border-transparent hover:border-slate-700/50"
                  >
                    <div className={`w-7 h-7 rounded-lg ${u.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{u.initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-300 text-[11px] font-medium font-body leading-tight">{u.name}</p>
                      <p className="text-slate-600 text-[9px] font-body leading-tight">{u.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs font-body mt-4">
          SIREME v0.1 · MVP · Dados simulados · Curitiba-PR
        </p>
      </div>
    </div>
  );
}
