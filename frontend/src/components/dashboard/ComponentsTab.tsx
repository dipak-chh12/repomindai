import React from 'react';
import type { ComponentItem } from '../../types';
import { Box, Layers, FileCode2 } from 'lucide-react';

interface ComponentsTabProps {
  components: ComponentItem[];
}

export const ComponentsTab: React.FC<ComponentsTabProps> = ({ components }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <Box className="w-5 h-5 text-neutral-400" />
          <span>Core Components</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          AI-identified critical files driving the core logic, grouped by architectural category.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {components.map((comp, idx) => (
          <div key={idx} className="bg-black p-5 border border-neutral-800 space-y-3 relative">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5 bg-neutral-900 px-2.5 py-1 border border-neutral-800">
                <Layers className="w-3.5 h-3.5" />
                <span>{comp.category}</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400 bg-black px-2 py-0.5 border border-neutral-800">
                {comp.lines}
              </span>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center space-x-2 text-white font-mono text-xs font-bold">
                <FileCode2 className="w-4 h-4 text-neutral-500" />
                <span>{comp.file_path}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed pt-2 font-sans">
                {comp.explanation}
              </p>
            </div>
          </div>
        ))}
        {components.length === 0 && (
          <div className="col-span-full p-8 text-center text-neutral-500 bg-black border border-neutral-800 font-mono text-sm">
            No important components detected.
          </div>
        )}
      </div>
    </div>
  );
};
