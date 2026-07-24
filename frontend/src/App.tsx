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

export function App() {
  const [view, setView] = useState<'landing' | 'analyzing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<RepositoryReport | null>(null);

  useEffect(() => {
    apiService.getRepositoryReport()
      .then((rep) => {
        setReport(rep);
        setView('dashboard');
      })
      .catch(() => {
        setView('landing');
      });
  }, []);

  useEffect(() => {
    if (!taskId || view !== 'analyzing') return;

    const interval = setInterval(async () => {
      try {
        const res = await apiService.getTaskStatus(taskId);
        setProgress(res.progress);
        setStage(res.stage);

        if (res.status === 'completed' && res.report) {
          setReport(res.report);
          setView('dashboard');
          clearInterval(interval);
        } else if (res.status === 'failed') {
          setError(res.error || 'Failed to analyze repository');
          clearInterval(interval);
        }
      } catch (e) {
        setError('Failed to query status');
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [taskId, view]);

  const handleStartAnalysis = async (repoUrl: string) => {
    setView('analyzing');
    setProgress(5);
    setStage('Initializing analysis pipeline...');
    setError(null);

    try {
      const data = await apiService.analyzeRepo(repoUrl);
      setTaskId(data.task_id);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
    }
  };

  const handleReset = async () => {
    await apiService.resetRepository().catch(() => {});
    setReport(null);
    setTaskId(null);
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
