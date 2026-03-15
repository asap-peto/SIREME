import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui';

export function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simulate latency
    const ok = login(email, password);
    setLoading(false);
    if (ok) navigate('/dashboard');
    else setError('Credenciais inválidas. Verifique e-mail e senha.');
  };

  const fillDemo = (idx: number) => {
    const users = [
      { email: 'r.silva@samu-cwb.gov.br', password: 'sireme2024' },
      { email: 'c.santos@samu-cwb.gov.br', password: 'sireme2024' },
    ];
    setEmail(users[idx].email);
    setPassword(users[idx].password);
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
        {/* Grid */}
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
              <label className="block text-xs font-medium text-slate-400 font-body mb-1.5">E-mail / CRM</label>
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

        {/* Demo users */}
        <div className="mt-4 bg-slate-900/50 rounded-xl border border-slate-800/60 p-4">
          <p className="text-slate-500 text-xs font-body text-center mb-3">Acesso demo — clique para preencher</p>
          <div className="space-y-2">
            <button onClick={() => fillDemo(0)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/60 transition-all group">
              <div className="w-7 h-7 rounded-full bg-blue-600/70 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">RS</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-slate-300 text-xs font-medium font-body">Dr. Ricardo Silva</p>
                <p className="text-slate-500 text-[10px] font-body">Médico Regulador · SAMU Curitiba</p>
              </div>
            </button>
            <button onClick={() => fillDemo(1)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/60 transition-all group">
              <div className="w-7 h-7 rounded-full bg-emerald-600/70 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-bold">CS</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-slate-300 text-xs font-medium font-body">Enf. Carla Santos</p>
                <p className="text-slate-500 text-[10px] font-body">Regulador · SAMU Curitiba</p>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs font-body mt-5">
          SIREME v0.1 · MVP · Dados simulados · Curitiba-PR
        </p>
      </div>
    </div>
  );
}
