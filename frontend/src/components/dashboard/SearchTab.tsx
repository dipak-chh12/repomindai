import React, { useState } from 'react';
import type { SearchResultItem } from '../../types';
import { apiService } from '../../services/api';
import { Search, Loader2, FileCode, ExternalLink, Sparkles, BookOpen, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const SearchTab: React.FC<{ repoUrl?: string }> = ({ repoUrl }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);

  const sampleSearches = [
    "Explain authentication and JWT login flow.",
    "Which file handles API endpoint routers?",
    "Show database schema definitions.",
    "Explain the startup initialization process.",
    "How does error handling work in this repo?",
    "Where are vector embeddings generated?"
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);
    setAiExplanation(null);
    setResults([]);

    try {
      // Execute AI Code Search using LLM RAG
      const chatResponse = await apiService.chatWithRepo(
        `Perform an AI Code Search for: "${searchQuery}". Explain the code logic, relevant files, functions, and how they work.`,
        repoUrl
      );
      
      // Clean follow-up questions from search tab explanation
      let cleanAnswer = chatResponse.answer;
      if (cleanAnswer.includes('---FOLLOW_UP_QUESTIONS---')) {
        cleanAnswer = cleanAnswer.split('---FOLLOW_UP_QUESTIONS---')[0].trim();
      }

      setAiExplanation(cleanAnswer);
      if (chatResponse.retrieved_chunks) {
        setResults(chatResponse.retrieved_chunks);
      }
    } catch (err) {
      console.error('AI Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <Search className="w-5 h-5 text-neutral-400" />
          <span>AI Code Search & Explainer</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Ask any question about codebase logic. Gemini 2.5 Flash retrieves code chunks and provides a comprehensive technical explanation.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="relative"
      >
        <div className="flex items-center bg-black border-2 border-neutral-800 focus-within:border-white transition-colors">
          <Search className="w-5 h-5 text-neutral-400 ml-4 shrink-0" />
          <input
            type="text"
            placeholder="Search code logic (e.g. 'Explain authentication logic')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-4 py-4 text-sm text-white placeholder-neutral-600 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-white hover:bg-neutral-200 text-black px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all shrink-0 border-l-2 border-neutral-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>AI Search</span>}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Try asking:
        </p>
        <div className="flex flex-wrap gap-2">
          {sampleSearches.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(sample)}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs border border-neutral-800 transition-all flex items-center space-x-1.5 font-mono"
            >
              <Sparkles className="w-3 h-3 text-neutral-400" />
              <span>{sample}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center bg-black border border-neutral-800 space-y-3">
          <Loader2 className="w-6 h-6 text-white animate-spin mx-auto" />
          <p className="text-xs text-neutral-400 font-mono">
            Gemini 2.5 Flash is searching vector chunks and generating code explanation...
          </p>
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-6 pt-2">
          {/* AI Explanation Card */}
          {aiExplanation && (
            <div className="bg-black p-6 border-2 border-neutral-800 space-y-4">
              <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
                <Cpu className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Code Explanation: "{query}"
                </h3>
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-code:text-white font-sans text-neutral-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiExplanation}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Code Chunks List */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Relevant Code Snippets & Files ({results.length}):</span>
            </div>

            {results.length === 0 && (
              <div className="p-6 text-center bg-black border border-neutral-800 text-neutral-500 font-mono text-xs">
                No matching code chunks retrieved.
              </div>
            )}

            {results.map((res, idx) => (
              <div key={idx} className="bg-black p-5 border border-neutral-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div className="flex items-center space-x-2 text-xs font-mono text-white font-bold">
                    <FileCode className="w-4 h-4 text-neutral-400" />
                    <span>{res.file_path}</span>
                    <span className="text-neutral-500 font-normal">
                      (L{res.start_line} - L{res.end_line})
                    </span>
                  </div>

                  <a
                    href={res.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-neutral-400 hover:text-white text-xs transition-colors font-mono uppercase tracking-widest"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {res.summary && (
                  <p className="text-xs text-neutral-400 font-mono">
                    {res.summary}
                  </p>
                )}

                <div className="bg-neutral-950 p-4 border border-neutral-800 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                    {res.code_content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
