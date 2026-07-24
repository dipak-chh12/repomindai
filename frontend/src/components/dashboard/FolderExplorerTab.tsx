import React, { useState } from 'react';
import type { FolderExplanation } from '../../types';
import { FolderTree, Folder, ArrowRight } from 'lucide-react';

interface FolderExplorerTabProps {
  explanations: FolderExplanation[];
}

export const FolderExplorerTab: React.FC<FolderExplorerTabProps> = ({ explanations }) => {
  const [selectedFolder, setSelectedFolder] = useState<FolderExplanation | null>(
    explanations.length > 0 ? explanations[0] : null
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <FolderTree className="w-5 h-5 text-neutral-400" />
          <span>Folder Explorer</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Explore key directories and their responsibilities within the architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="bg-black p-4 border border-neutral-800 space-y-2 h-[450px] overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-2">
            Directories
          </p>
          {explanations.map((folder, idx) => {
            const isSelected = selectedFolder?.path === folder.path;
            return (
              <button
                key={idx}
                onClick={() => setSelectedFolder(folder)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs font-mono text-left transition-all border border-transparent ${
                  isSelected
                    ? 'bg-neutral-900 text-white font-bold border-neutral-700'
                    : 'text-neutral-500 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-neutral-500'}`} />
                <span className="truncate">{folder.path}</span>
              </button>
            );
          })}
          {explanations.length === 0 && (
            <p className="text-xs text-neutral-600 px-2 italic">No folders found.</p>
          )}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-2 bg-black p-6 border border-neutral-800 space-y-4 flex flex-col justify-between">
          {selectedFolder ? (
            <div>
              <div className="flex items-center space-x-3 border-b border-neutral-800 pb-3">
                <Folder className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white font-mono">{selectedFolder.path}</h3>
              </div>
              <div className="mt-4">
                <p className="text-[11px] text-neutral-500 uppercase font-bold tracking-widest mb-2">Directory Responsibility</p>
                <div className="p-4 bg-neutral-900 border border-neutral-800 space-y-2 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                  {selectedFolder.explanation}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-600 text-sm font-mono">
              Select a folder to view its explanation.
            </div>
          )}

          <div className="p-3 bg-black border border-neutral-800 text-[11px] text-neutral-500 flex items-center space-x-2 font-mono">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>AI automatically infers directory purpose based on file contents and names.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
