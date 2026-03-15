import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, AlertCircle, Hospital, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui';

const DEMO_REGULATORS = [
  { email: 'r.silva@samu-cwb.gov.br', password: 'sireme2024', name: 'Dr. Ricardo Silva', role: 'Médico Regulador · SAMU Curitiba', initials: 'RS', color: 'bg-blue-600/70' },
  { email: 'c.santos@samu-cwb.gov.br', password: 'sireme2024', name: 'Enf. Carla Santos', role: 'Regulador · SAMU Curitiba', initials: 'CS', color: 'bg-emerald-600/70' },
];

const DEMO_HOSPITALS = [
  { email: 'nir@hc.ufpr.br', password: 'nir2024', name: 'NIR HC-UFPR', role: 'Hospital · NIR', initials: 'HC', color: 'bg-violet-600/70' },
  { email: 'nir@trabalhador.pr.gov.br', password: 'nir2024', name: 'NIR H. Trabalhador', role: 'Hospital · NIR', initials: 'HT', color: 'bg-orange-600/70' },
  { email: 'nir@cajuru.pucpr.br', password: 'nir2024', name: 'NIR HU Cajuru', role: 'Hospital · NIR', initials: 'CA', color: 'bg-rose-600/70' },
];

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate latency
    const loggedUser = login(email, password);
    setLoading(false);
    if (loggedUser) {
      navigate(loggedUser.role === 'hospital_nir' ? '/hospital-nir' : '/dashboard');
    } else {
      setError('Credenciais inválidas. Verifique e-mail e senha.');
    }
  };

  const fillCredentials = (u: { email: string; password: string }) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  const inputCls = 'w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-slate-200 font-body text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition-all';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-cyan-600/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <Activity size={28} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-100 tracking-tight">SIREME</h1>
          <p className="text-slate-500 text-sm font-body mt-1">Sistema Inteligente de Regulação Médica</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-2xl shadow-black/40">
          <h2 className="font-display font-semibold text-slate-200 mb-5 text-sm">Acesso ao sistema</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 font-body mb-1.5">E-mail</label>
              <input
                type="email"
                className={inputCls}
                placeholder="seu@email.gov.br"
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

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full rounded-xl">
              Entrar no sistema
            </Button>
          </form>
        </div>

        {/* Demo users - Regulação */}
        <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-800/60 p-4">
          <p className="text-slate-500 text-xs font-body text-center mb-3">Central de Regulação — acesso demo</p>
          <div className="space-y-2">
            {DEMO_REGULATORS.map((u) => (
              <button key={u.email} onClick={() => fillCredentials(u)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/60 transition-all">
                <div className={`w-7 h-7 rounded-full ${u.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-[10px] font-bold">{u.initials}</span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-slate-300 text-xs font-medium font-body">{u.name}</p>
                  <p className="text-slate-500 text-[10px] font-body">{u.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo users - Hospitais NIR */}
        <div className="mt-3 bg-slate-900/50 rounded-xl border border-slate-800/60 overflow-hidden">
          <button
            onClick={() => setShowHospitals(!showHospitals)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-800/40 transition-all"
          >
            <div className="flex items-center gap-2">
              <Hospital size={13} className="text-violet-400" />
              <p className="text-slate-500 text-xs font-body">Modo NIR Hospitalar — acesso demo</p>
            </div>
            {showHospitals ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
          </button>

          {showHospitals && (
            <div className="px-4 pb-4 space-y-2 border-t border-slate-800/60 pt-3">
              {DEMO_HOSPITALS.map((u) => (
                <button key={u.email} onClick={() => fillCredentials(u)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/60 transition-all">
                  <div className={`w-7 h-7 rounded-full ${u.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[10px] font-bold">{u.initials}</span>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-slate-300 text-xs font-medium font-body">{u.name}</p>
                    <p className="text-slate-500 text-[10px] font-body">{u.role} · senha: nir2024</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs font-body mt-5">
          SIREME v0.1 · MVP · Dados simulados · Curitiba-PR
        </p>
      </div>
    </div>
  );
}
