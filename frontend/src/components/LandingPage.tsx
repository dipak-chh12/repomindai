import React, { useState, useEffect } from 'react';
import { ArrowRight, GitBranch, Cpu, Code2, Zap } from 'lucide-react';
import type { SampleRepo } from '../types';
import { apiService } from '../services/api';

interface LandingPageProps {
  onStartAnalysis: (repoUrl: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAnalysis }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [sampleRepos, setSampleRepos] = useState<SampleRepo[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getSampleRepos().then(setSampleRepos).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setError('');
    onStartAnalysis(repoUrl.trim());
  };

  const handleSelectSample = (sampleUrl: string) => {
    setRepoUrl(sampleUrl);
    onStartAnalysis(sampleUrl);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-4xl w-full text-center space-y-8 z-10 my-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-neutral-900 border border-neutral-800 text-xs text-white font-medium tracking-wide">
          <Cpu className="w-3.5 h-3.5 text-white" />
          <span>Powered by Advanced AI & Vector Search</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white leading-tight uppercase">
            Understand Any Codebase <br />
            <span className="text-neutral-500">In Minutes</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-mono">
            RepoMind automatically clones, parses AST structures, detects architectural patterns, and generates comprehensive codebase explanations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-3">
          <div className="relative flex items-center bg-black border-2 border-neutral-800 focus-within:border-white transition-colors">
            <div className="pl-4 text-neutral-500">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Paste GitHub Repository URL (e.g. https://github.com/fastapi/fastapi)..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-transparent px-4 py-4 text-sm text-white placeholder-neutral-600 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-black font-bold px-6 py-4 text-xs sm:text-sm transition-colors shrink-0 uppercase tracking-widest border-l-2 border-neutral-800"
            >
              <span>Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-xs text-red-500 font-mono text-left px-2 uppercase">{error}</p>}
        </form>

        <div className="pt-8 max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
            Or try these sample repositories:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sampleRepos.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample.url)}
                className="bg-neutral-900 p-4 text-left border border-neutral-800 hover:border-white group transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white font-mono truncate">
                    {sample.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-black text-neutral-400 font-bold uppercase tracking-wider border border-neutral-800">
                    {sample.framework}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed font-mono">
                  {sample.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 border-t border-neutral-900 max-w-4xl mx-auto text-left">
          <div className="p-5 bg-black border border-neutral-800 space-y-3">
            <Code2 className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Smart Code AST Chunking</h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              No fixed-length splitting. Chunks by functions, classes, and modules preserving exact start and end line ranges.
            </p>
          </div>
          <div className="p-5 bg-black border border-neutral-800 space-y-3">
            <Cpu className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Architecture Recognition</h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              Automatically detects Clean Architecture, Layered pattern, Dependency Injection, MVC, and ORM usage in code.
            </p>
          </div>
          <div className="p-5 bg-black border border-neutral-800 space-y-3">
            <Zap className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Instant RAG Search</h3>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
              Every answer features exact source citations with line ranges and clickable links directly to GitHub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
