import type { RepositoryReport, SearchResultItem, Citation, SampleRepo } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const apiService = {
  async analyzeRepo(repoUrl: string): Promise<{
    task_id: string;
    status: string;
    progress: number;
    stage: string;
    report: RepositoryReport;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl })
    });
    if (!res.ok) {
      let msg = 'Failed to connect to backend server. Make sure backend is running.';
      try {
        const err = await res.json();
        msg = err.detail || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  },

  async summarizeRepo(repoUrl: string): Promise<{
    summary: string;
    tech_stack: Record<string, string[]>;
    architecture: Array<{ name: string; confidence: number; reasoning: string }>;
    request_flow: Array<{ step: string; layer: string; description: string }>;
    folder_explanations: Array<{ path: string; explanation: string }>;
    important_components: Array<{ category: string; file_path: string; lines: string; explanation: string }>;
    ai_insights: Record<string, string[]>;
  }> {
    const res = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl })
    });
    if (!res.ok) throw new Error('AI summary generation failed');
    return res.json();
  },

  async getRepositoryReport(): Promise<RepositoryReport> {
    const res = await fetch(`${API_BASE}/repository`);
    if (!res.ok) throw new Error('No analyzed repository report found');
    return res.json();
  },

  async searchCode(query: string, topK: number = 5): Promise<{ query: string; results: SearchResultItem[] }> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK })
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async chatWithRepo(question: string, repoUrl?: string): Promise<{
    answer: string;
    citations: Citation[];
    retrieved_chunks: SearchResultItem[];
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, ...(repoUrl ? { repo_url: repoUrl } : {}) })
    });
    if (!res.ok) throw new Error('Chat query failed');
    return res.json();
  },

  async resetRepository(): Promise<void> {
    await fetch(`${API_BASE}/repository`, { method: 'DELETE' }).catch(() => {});
  },

  async getSampleRepos(): Promise<SampleRepo[]> {
    const res = await fetch(`${API_BASE}/sample-repos`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.samples || [];
  }
};
