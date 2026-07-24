import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Cpu,
  FolderTree,
  Box,
  GitCommit,
  Lightbulb,
  BarChart3,
  Search,
  MessageSquareText
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'architecture'
  | 'tech-stack'
  | 'folder-explorer'
  | 'components'
  | 'request-flow'
  | 'ai-insights'
  | 'statistics'
  | 'search'
  | 'chat';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Repository Overview', icon: LayoutDashboard },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'tech-stack', label: 'Tech Stack', icon: Cpu },
    { id: 'folder-explorer', label: 'Folder Explorer', icon: FolderTree },
    { id: 'components', label: 'Key Components', icon: Box },
    { id: 'request-flow', label: 'Request Flow', icon: GitCommit },
    { id: 'ai-insights', label: 'AI Insights', icon: Lightbulb },
    { id: 'statistics', label: 'Code Statistics', icon: BarChart3 },
    { id: 'search', label: 'Natural Language Search', icon: Search },
    { id: 'chat', label: 'AI Chat Assistant', icon: MessageSquareText },
  ];

  return (
    <aside className="w-64 border-r border-neutral-800 bg-black p-4 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
          Codebase Insights
        </p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center space-x-3 px-3 py-3 text-xs font-mono transition-colors border-l-2 ${
                  isActive
                    ? 'bg-neutral-900 text-white border-white font-bold'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-500 font-mono">
        <p className="font-bold text-white mb-1 uppercase tracking-wider">AI Inference Engine</p>
        <p>RAG vector search & AST code parsing active.</p>
      </div>
    </aside>
  );
};
