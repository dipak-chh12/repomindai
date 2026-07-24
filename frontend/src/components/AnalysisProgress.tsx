import React from 'react';
import { Loader2, CheckCircle2, GitBranch, Code, Database, Cpu, Sparkles } from 'lucide-react';

interface AnalysisProgressProps {
  progress: number;
  stage: string;
  error?: string | null;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress, stage, error }) => {
  const steps = [
    { label: 'Cloning Repository', icon: GitBranch, minProgress: 15 },
    { label: 'AST & Code Parsing', icon: Code, minProgress: 35 },
    { label: 'Embedding & FAISS Indexing', icon: Database, minProgress: 60 },
    { label: 'AI Architecture Detection', icon: Cpu, minProgress: 85 },
    { label: 'Generating Insights Report', icon: Sparkles, minProgress: 100 }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black flex items-center justify-center p-6 relative">
      <div className="max-w-xl w-full bg-black p-8 border-2 border-neutral-800 space-y-8 text-center relative">
        <div className="w-14 h-14 bg-neutral-900 border border-neutral-700 flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Analyzing Codebase</h2>
          <p className="text-xs text-neutral-400 font-mono">{stage || 'Ingesting repository metadata...'}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-neutral-900 border border-neutral-800 p-0.5">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 font-mono font-bold">
            <span className="uppercase">Progress</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="space-y-2 text-left pt-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = progress >= step.minProgress;
            const isCurrent = progress < step.minProgress && (idx === 0 || progress >= steps[idx - 1].minProgress);

            return (
              <div
                key={idx}
                className={`flex items-center space-x-3 p-3 border font-mono transition-all ${
                  isDone
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    : isCurrent
                    ? 'bg-neutral-900 border-white text-white font-bold'
                    : 'bg-black border-neutral-900 text-neutral-600'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 text-neutral-600 shrink-0" />
                )}
                <span className={`text-xs ${isDone ? 'text-neutral-300' : isCurrent ? 'text-white font-bold' : 'text-neutral-600'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-4 bg-black border border-red-800 text-red-400 text-xs text-left font-mono">
            <p className="font-bold mb-1 uppercase">Analysis Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
