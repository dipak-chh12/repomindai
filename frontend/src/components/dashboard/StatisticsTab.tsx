import React from 'react';
import type { CodeStatistics } from '../../types';
import { BarChart3, Database, FileCode, Search, Server, Cpu, Layers } from 'lucide-react';

interface StatisticsTabProps {
  stats: CodeStatistics;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ stats }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <BarChart3 className="w-5 h-5 text-neutral-400" />
          <span>Codebase Statistics & Indexing</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Metrics on vector generation, parsing, and application size.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black p-4 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Files Indexed</span>
            <Database className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.files_indexed}</p>
        </div>
        
        <div className="bg-black p-4 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Vector Chunks</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.chunks_created}</p>
        </div>

        <div className="bg-black p-4 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Functions / Methods</span>
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.functions_detected}</p>
        </div>

        <div className="bg-black p-4 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Classes Detected</span>
            <Server className="w-3.5 h-3.5" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.classes_detected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black p-5 border border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
            Language Distribution
          </h3>
          <div className="space-y-3 pt-2">
            {Object.entries(stats.languages).sort((a, b) => b[1] - a[1]).map(([lang, count]) => {
              const total = Object.values(stats.languages).reduce((a, b) => a + b, 0);
              const percentage = ((count / (total || 1)) * 100).toFixed(1);
              return (
                <div key={lang} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-neutral-300">
                    <span>{lang}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-900 overflow-hidden border border-neutral-800">
                    <div 
                      className="h-full bg-white" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
            Engine Configuration
          </h3>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800">
              <div className="flex items-center space-x-2 text-neutral-400">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Embedding Model</span>
              </div>
              <span className="text-xs text-white font-mono font-bold">{stats.embedding_model}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800">
              <div className="flex items-center space-x-2 text-neutral-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Avg Chunk Size</span>
              </div>
              <span className="text-xs text-white font-mono font-bold">{stats.average_chunk_size} LOC</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800">
              <div className="flex items-center space-x-2 text-neutral-400">
                <Search className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">FAISS Retrieval Time</span>
              </div>
              <span className="text-xs text-white font-mono font-bold">{stats.retrieval_time_ms} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
