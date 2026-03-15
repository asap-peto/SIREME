import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils';

interface Step {
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold font-display transition-all',
                done ? 'bg-blue-600 border-blue-600 text-white' :
                active ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                  'bg-slate-800 border-slate-700 text-slate-500'
              )}>
                {done ? <Check size={14} /> : <span>{i + 1}</span>}
              </div>
              <div className="mt-1.5 text-center hidden sm:block">
                <p className={cn('text-xs font-medium font-display', active ? 'text-slate-200' : done ? 'text-slate-400' : 'text-slate-600')}>
                  {step.label}
                </p>
                <p className={cn('text-[10px] font-body hidden md:block', active ? 'text-slate-400' : 'text-slate-600')}>
                  {step.description}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mb-5 sm:mb-0 transition-all',
                i < current ? 'bg-blue-600' : 'bg-slate-800'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
