import React from 'react';
import { Cpu, RefreshCw, BookOpen, GitBranch } from 'lucide-react';
import type { RepositoryOverview } from '../types';

interface HeaderProps {
  overview?: RepositoryOverview;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ overview, onReset }) => {
  return (
    <header className="h-16 border-b border-neutral-800 bg-black px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={onReset}>
        <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-tight text-white">RepoMind</span>
            <span className="text-xs px-2 py-0.5 bg-neutral-900 text-white font-semibold border border-neutral-800">
              AI
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium tracking-tight">Codebase Explainer</p>
        </div>
      </div>

      {/* Active Repo Badge & Actions */}
      <div className="flex items-center space-x-4">
        {overview && (
          <div className="hidden sm:flex items-center space-x-3 bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300">
            <BookOpen className="w-4 h-4 text-white" />
            <span className="font-mono text-white font-semibold">{overview.full_name}</span>
            <span className="px-2 py-0.5 bg-black text-neutral-400 text-[10px] font-mono uppercase border border-neutral-800">
              {overview.primary_language}
            </span>
          </div>
        )}

        {overview && (
          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 px-3 py-1.5 text-xs font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Repository</span>
          </button>
        )}

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
          title="GitHub"
        >
          <GitBranch className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
