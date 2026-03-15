import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, ChevronRight } from 'lucide-react';
import { SIMULATION_CASES } from '../mocks/simulationCases';
import { Card, Button, Badge } from '../components/ui';
import { useApp } from '../context/AppContext';
import { classifyCase } from '../services/classificationService';
import { runRecommendationEngine } from '../engine/recommendationEngine';
import { HOSPITALS } from '../mocks/hospitals';
import { RecommendationResult } from '../types';
import { generateCaseId } from '../utils';

export function SimulationPage() {
  const navigate = useNavigate();
  const { setPendingResult } = useApp();
  const [loading, setLoading] = useState<string | null>(null);

  const runSimulation = async (simId: string) => {
    const sim = SIMULATION_CASES.find(s => s.id === simId);
    if (!sim) return;

    setLoading(simId);
    await new Promise(r => setTimeout(r, 1400));

    const caseData = { ...sim.data, startedAt: Date.now() - Math.floor(Math.random() * 300000 + 60000) };
    const classification = classifyCase(caseData);
    const engineResult = runRecommendationEngine(caseData, classification, HOSPITALS);

    const result: RecommendationResult = {
      caseId: generateCaseId(),
      timestamp: new Date().toISOString(),
      caseData,
      ...engineResult,
      processingTimeMs: Math.round(Math.random() * 200 + 80),
      timeToRecommendationMs: Date.now() - caseData.startedAt,
    };

    setPendingResult(result);
    setLoading(null);
    navigate('/recommendation');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="px-6 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <FlaskConical size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-slate-100 text-xl font-bold font-display">Modo Simulação</h1>
            <p className="text-slate-500 text-xs font-body mt-0.5">5 casos clínicos pré-construídos para demonstração do sistema</p>
          </div>
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6 text-sm font-body text-purple-300">
            <strong className="font-display">Como usar:</strong> Selecione um caso abaixo. O SIREME aplicará as regras clínicas, classificará a gravidade, e gerará a recomendação hospitalar completa para Curitiba.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SIMULATION_CASES.map(sim => {
              const isLoading = loading === sim.id;
              return (
                <Card key={sim.id} className="hover:border-slate-700 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl flex-shrink-0">{sim.icon}</span>
                    <div className="min-w-0">
                      <h3 className="text-slate-100 font-semibold font-display text-base leading-tight">{sim.title}</h3>
                      <p className="text-slate-500 text-xs font-body mt-0.5">{sim.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs font-body leading-relaxed mb-4">{sim.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4 p-2.5 bg-slate-800/40 rounded-lg">
                    <div className="text-xs font-body text-slate-500">
                      Paciente: <span className="text-slate-300">{sim.data.age}a, {sim.data.sex === 'M' ? 'Masc' : 'Fem'}</span>
                    </div>
                    <div className="text-xs font-body text-slate-500">
                      Via: <span className="text-slate-300">{sim.data.transportType}</span>
                    </div>
                    <div className="text-xs font-body text-slate-500">
                      Origem: <span className="text-slate-300">{sim.data.origin.split('—')[0].trim()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="default" size="xs">{sim.expectedCategory}</Badge>
                      <Badge
                        variant={
                          sim.expectedGravity === 'Crítico' ? 'danger' :
                          sim.expectedGravity === 'Alto' ? 'warning' : 'info'
                        }
                        size="xs"
                      >
                        {sim.expectedGravity}
                      </Badge>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isLoading}
                      onClick={() => runSimulation(sim.id)}
                      rightIcon={<ChevronRight size={13} />}
                    >
                      {isLoading ? 'Processando...' : 'Simular'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {loading && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-200 font-semibold font-display">Processando caso clínico</p>
                <p className="text-slate-500 text-sm font-body mt-1">Aplicando regras e motor de recomendação...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
