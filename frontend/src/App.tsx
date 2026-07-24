import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { AnalysisProgress } from './components/AnalysisProgress';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { ArchitectureTab } from './components/dashboard/ArchitectureTab';
import { TechStackTab } from './components/dashboard/TechStackTab';
import { FolderExplorerTab } from './components/dashboard/FolderExplorerTab';
import { ComponentsTab } from './components/dashboard/ComponentsTab';
import { RequestFlowTab } from './components/dashboard/RequestFlowTab';
import { InsightsTab } from './components/dashboard/InsightsTab';
import { StatisticsTab } from './components/dashboard/StatisticsTab';
import { SearchTab } from './components/dashboard/SearchTab';
import { ChatTab } from './components/dashboard/ChatTab';

import type { RepositoryReport } from './types';
import { apiService } from './services/api';

const ANALYSIS_STAGES = [
  { progress: 10, stage: 'Initializing analysis pipeline...' },
  { progress: 20, stage: 'Cloning repository from GitHub...' },
  { progress: 40, stage: 'Parsing files, AST trees & functions...' },
  { progress: 65, stage: 'Generating embeddings & indexing vector store...' },
  { progress: 85, stage: 'Analyzing architecture, tech stack & code insights...' },
  { progress: 95, stage: 'Generating AI insights report...' },
];

export function App() {
  const [view, setView] = useState<'landing' | 'analyzing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<RepositoryReport | null>(null);

  // Animate progress while analysis is running (since backend runs synchronously)
  useEffect(() => {
    if (view !== 'analyzing') return;
    let stageIdx = 0;
    const tick = setInterval(() => {
      if (stageIdx < ANALYSIS_STAGES.length) {
        const s = ANALYSIS_STAGES[stageIdx];
        setProgress(s.progress);
        setStage(s.stage);
        stageIdx++;
      }
    }, 2200);
    return () => clearInterval(tick);
  }, [view]);

  const handleStartAnalysis = async (repoUrl: string) => {
    setView('analyzing');
    setProgress(5);
    setStage('Connecting to backend...');
    setError(null);
    setReport(null);

    try {
      // Analysis runs synchronously on the backend — full report returned in one call
      const data = await apiService.analyzeRepo(repoUrl);
      if (data.report) {
        setReport(data.report);
        setProgress(100);
        setStage('Analysis Complete!');
        // Small delay so user sees 100% before dashboard appears
        setTimeout(() => setView('dashboard'), 800);
      } else {
        throw new Error('Backend returned no report.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository');
    }
  };

  const handleReset = async () => {
    await apiService.resetRepository().catch(() => {});
    setReport(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black font-sans">
      <Header overview={report?.overview} onReset={handleReset} />

      {view === 'landing' && (
        <LandingPage onStartAnalysis={handleStartAnalysis} />
      )}

      {view === 'analyzing' && (
        <AnalysisProgress progress={progress} stage={stage} error={error} />
      )}

      {view === 'dashboard' && report && (
        <div className="flex flex-1">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 p-6 sm:p-8 overflow-y-auto min-h-[calc(100vh-4rem)] bg-black">
            {activeTab === 'overview' && (
              <OverviewTab overview={report.overview} />
            )}
            {activeTab === 'architecture' && (
              <ArchitectureTab patterns={report.architecture} />
            )}
            {activeTab === 'tech-stack' && (
              <TechStackTab techStack={report.tech_stack} />
            )}
            {activeTab === 'folder-explorer' && (
              <FolderExplorerTab explanations={report.folder_explanations} />
            )}
            {activeTab === 'components' && (
              <ComponentsTab components={report.important_components} />
            )}
            {activeTab === 'request-flow' && (
              <RequestFlowTab flowSteps={report.request_flow} />
            )}
            {activeTab === 'ai-insights' && (
              <InsightsTab insights={report.ai_insights} />
            )}
            {activeTab === 'statistics' && (
              <StatisticsTab stats={report.code_statistics} />
            )}
            {activeTab === 'search' && <SearchTab />}
            {activeTab === 'chat' && <ChatTab />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
