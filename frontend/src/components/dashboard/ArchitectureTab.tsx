import React from 'react';
import type { ArchitecturePattern } from '../../types';
import { Layers, CheckCircle, HelpCircle } from 'lucide-react';

interface ArchitectureTabProps {
  patterns: ArchitecturePattern[];
}

export const ArchitectureTab: React.FC<ArchitectureTabProps> = ({ patterns }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
            <Layers className="w-5 h-5 text-neutral-400" />
            <span>Architecture Patterns Detected</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            AI analyzed project imports, directory structures, and dependencies to determine core design patterns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pattern, idx) => (
          <div key={idx} className="bg-black p-5 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-white" />
                <span>{pattern.name}</span>
              </span>
              <span className="px-2 py-0.5 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest">
                {pattern.confidence}% CONF
              </span>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-sans">
              <p className="font-bold text-white mb-2 uppercase tracking-wider flex items-center space-x-1.5 text-[10px]">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                <span>Why AI identified this pattern:</span>
              </p>
              <p className="text-neutral-400">{pattern.reasoning}</p>
            </div>
          </div>
        ))}
        {patterns.length === 0 && (
          <div className="col-span-full p-8 text-center text-neutral-500 bg-black border border-neutral-800 font-mono text-sm">
            No recognizable architecture patterns detected.
          </div>
        )}
      </div>
    </div>
  );
};
