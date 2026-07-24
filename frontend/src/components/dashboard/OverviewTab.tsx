import React from 'react';
import type { RepositoryOverview } from '../../types';
import { BookOpen, FolderOpen, Code2, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OverviewTabProps {
  overview: RepositoryOverview;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ overview }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Repo Stats */}
        <div className="bg-black p-5 border border-neutral-800 space-y-2 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-neutral-500 uppercase tracking-widest text-[10px] font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Repository</span>
          </div>
          <div className="font-mono text-white text-sm break-all font-bold">
            {overview.full_name}
          </div>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-2 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-neutral-500 uppercase tracking-widest text-[10px] font-bold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Primary Language</span>
          </div>
          <div className="font-mono text-white text-sm font-bold">
            {overview.primary_language || 'Mixed'}
          </div>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-2 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-neutral-500 uppercase tracking-widest text-[10px] font-bold">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Total Files</span>
          </div>
          <div className="font-mono text-white text-sm font-bold">
            {overview.total_files.toLocaleString()}
          </div>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-2 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-neutral-500 uppercase tracking-widest text-[10px] font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Framework</span>
          </div>
          <div className="font-mono text-white text-sm font-bold">
            {overview.framework || 'Unknown'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="bg-black p-6 border border-neutral-800">
            <div className="flex items-center space-x-2 mb-4 border-b border-neutral-800 pb-3">
              <BookOpen className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                AI Repository Summary
              </h2>
            </div>
            {overview.ai_summary ? (
              <div className="text-sm text-neutral-300 leading-relaxed font-sans">
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-code:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {overview.ai_summary}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500 font-mono italic">
                AI summary is currently being generated or not available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
