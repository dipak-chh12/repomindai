import React, { useState } from 'react';
import type { ChatMessage } from '../../types';
import { apiService } from '../../services/api';
import { MessageSquareText, Send, Loader2, Bot, User, ExternalLink, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatTab: React.FC<{ repoUrl?: string }> = ({ repoUrl }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Codebase Explainer. Ask me anything about this repository, and I will explain using exact source code citations with line numbers.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.chatWithRepo(queryText.trim(), repoUrl);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString(),
        citations: response.citations,
        retrieved_chunks: response.retrieved_chunks
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, an error occurred while searching vector index and generating the RAG response.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const parseMessageContent = (content: string) => {
    if (!content.includes('---FOLLOW_UP_QUESTIONS---')) {
      return { mainContent: content, followUps: [] };
    }

    const parts = content.split('---FOLLOW_UP_QUESTIONS---');
    const mainContent = parts[0].trim();
    const rawFollowUps = parts[1] ? parts[1].trim() : '';

    const followUps = rawFollowUps
      .split('\n')
      .map((line: string) => line.replace(/^[\s\-\*\d\.]+/, '').trim())
      .filter((line: string) => line.length > 5);

    return { mainContent, followUps };
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
            <MessageSquareText className="w-5 h-5 text-neutral-400" />
            <span>AI Codebase Chat Assistant</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Grounded in indexed vector context. Answers cite source files and line ranges.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 p-6 bg-black border border-neutral-800">
        {messages.map((msg) => {
          const { mainContent, followUps } = msg.role === 'assistant' ? parseMessageContent(msg.content) : { mainContent: msg.content, followUps: [] };

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl space-y-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`p-5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white text-black border border-white font-medium'
                      : 'bg-black text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    mainContent
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-code:text-white">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {mainContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Follow-up questions buttons */}
                {msg.role === 'assistant' && followUps.length > 0 && (
                  <div className="p-4 bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
                    <div className="flex items-center space-x-1.5 text-white font-bold uppercase tracking-wider text-[10px]">
                      <HelpCircle className="w-3.5 h-3.5 text-white" />
                      <span>Suggested Follow-Up Questions:</span>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {followUps.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(q)}
                          className="text-left px-3 py-2 bg-black hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs flex items-center space-x-2 transition-colors group"
                        >
                          <Sparkles className="w-3 h-3 text-neutral-400 group-hover:text-white shrink-0" />
                          <span className="truncate">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="p-4 bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
                    <div className="flex items-center space-x-1.5 text-white font-bold uppercase tracking-wider text-[10px]">
                      <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Source Citations ({msg.citations.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cit, idx) => (
                        <a
                          key={idx}
                          href={cit.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-black hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-mono text-[10px] flex items-center space-x-1.5 transition-colors"
                        >
                          <span>
                            [{cit.source_id}] {cit.file_path}:L{cit.start_line}-{cit.end_line}
                          </span>
                          <ExternalLink className="w-3 h-3 text-neutral-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center space-x-3 text-neutral-500 text-xs p-2 font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>AI is analyzing codebase context...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative pt-2">
        <div className="flex items-center bg-black border-2 border-neutral-800 focus-within:border-white transition-colors">
          <input
            type="text"
            placeholder="Ask a question about the indexed repository..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder-neutral-600 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-white hover:bg-neutral-200 text-black px-6 py-4 font-bold uppercase tracking-widest text-xs sm:text-sm transition-colors border-l-2 border-neutral-800 shrink-0 disabled:opacity-50"
          >
            <span className="hidden sm:inline mr-2">Send</span>
            <Send className="w-4 h-4 inline" />
          </button>
        </div>
      </form>
    </div>
  );
};
