import React from 'react';
import type { RequestFlowStep } from '../../types';
import { GitCommit, ArrowDown } from 'lucide-react';

interface RequestFlowTabProps {
  flowSteps: RequestFlowStep[];
}

export const RequestFlowTab: React.FC<RequestFlowTabProps> = ({ flowSteps }) => {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <GitCommit className="w-5 h-5 text-neutral-400" />
          <span>Request Flow Execution</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Step-by-step breakdown of how data moves through the architecture layers.
        </p>
      </div>

      <div className="relative pt-4">
        <div className="space-y-4 relative z-10">
          {flowSteps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="bg-black w-full p-4 border border-neutral-800 flex items-start space-x-4">
                <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white font-bold font-mono text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex justify-between items-center">
                    <span>{step.step.replace(/^\d+\.\s*/, '')}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono tracking-widest">
                      {step.layer}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {idx < flowSteps.length - 1 && (
                <div className="my-2 text-neutral-600">
                  <ArrowDown className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          {flowSteps.length === 0 && (
            <div className="p-8 text-center text-neutral-500 bg-black border border-neutral-800 font-mono text-sm">
              No request flow steps generated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
