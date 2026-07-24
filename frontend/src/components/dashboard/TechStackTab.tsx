import React from 'react';
import type { TechStack } from '../../types';
import { Cpu, Server, Monitor, Database, Wrench, TestTube2, CloudCog, Sparkles, Terminal, BookOpen, Layers } from 'lucide-react';

interface TechStackTabProps {
  techStack: TechStack;
}

export const TechStackTab: React.FC<TechStackTabProps> = ({ techStack }) => {
  const categories = [
    { title: 'Frontend & UI', items: techStack.frontend, icon: Monitor },
    { title: 'Backend & APIs', items: techStack.backend, icon: Server },
    { title: 'Core Frameworks', items: techStack.frameworks, icon: Layers },
    { title: 'Data & Storage', items: techStack.database, icon: Database },
    { title: 'DevOps & Infra', items: techStack.devops, icon: CloudCog },
    { title: 'Testing & QA', items: techStack.testing, icon: TestTube2 },
    { title: 'AI & ML Libraries', items: techStack.ai_libraries, icon: Sparkles },
    { title: 'Package Managers', items: techStack.package_managers, icon: Terminal },
    { title: 'Build Tools', items: techStack.build_tools, icon: Wrench },
    { title: 'Utility Libraries', items: techStack.libraries, icon: BookOpen }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <Cpu className="w-5 h-5 text-neutral-400" />
          <span>Technology Stack Detection</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Automatically extracted frameworks, languages, and core libraries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="bg-black p-5 border border-neutral-800 space-y-3">
              <div className="flex items-center space-x-2 mb-3 border-b border-neutral-800 pb-2">
                <Icon className="w-4 h-4 text-white" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">{cat.title}</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {cat.items && cat.items.length > 0 ? (
                  cat.items.map((item, i) => (
                    <span 
                      key={i} 
                      className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-white text-xs font-mono font-medium flex items-center space-x-1"
                    >
                      <span className="w-1.5 h-1.5 bg-white shrink-0" />
                      <span>{item}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-500 italic font-mono">None detected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
