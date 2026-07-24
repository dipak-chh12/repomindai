import React from 'react';
import type { AIInsights } from '../../types';
import { Lightbulb, ShieldAlert, CheckCircle2, AlertTriangle, ListTodo, Sparkles } from 'lucide-react';

interface InsightsTabProps {
  insights: AIInsights;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ insights }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2 uppercase tracking-tight">
          <Lightbulb className="w-5 h-5 text-neutral-400" />
          <span>AI Codebase Insights & Quality Review</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Automated code quality evaluation, security audit observations, design strengths, and actionable technical recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black p-5 border border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-800 pb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Repository Strengths</span>
          </h3>
          <ul className="space-y-2 text-xs text-neutral-300 font-mono">
            {insights.strengths?.map((item, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-neutral-500 shrink-0">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-800 pb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Potential Code Smells</span>
          </h3>
          <ul className="space-y-2 text-xs text-neutral-300 font-mono">
            {insights.potential_code_smells?.map((item, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-neutral-500 shrink-0">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-800 pb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Large Modules & Duplicate Logic</span>
          </h3>
          <div className="space-y-2 text-xs text-neutral-300 font-mono">
            <p className="font-bold text-white">Large Classes / Modules:</p>
            <ul className="pl-2 space-y-1 text-neutral-400">
              {insights.large_classes?.map((item, i) => (
                <li key={i} className="flex space-x-2">
                  <span className="text-neutral-600">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-bold text-white pt-2">Duplicate Patterns:</p>
            <ul className="pl-2 space-y-1 text-neutral-400">
              {insights.duplicate_logic?.map((item, i) => (
                <li key={i} className="flex space-x-2">
                  <span className="text-neutral-600">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-black p-5 border border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-neutral-800 pb-2">
            <ListTodo className="w-4 h-4" />
            <span>TODOs & Documentation Gaps</span>
          </h3>
          <div className="space-y-2 text-xs text-neutral-300 font-mono">
            <p className="font-bold text-white">Flagged TODOs:</p>
            <ul className="pl-2 space-y-1 text-neutral-400">
              {insights.todo_comments?.map((item, i) => (
                <li key={i} className="flex space-x-2">
                  <span className="text-neutral-600">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-bold text-white pt-2">Missing Docs:</p>
            <ul className="pl-2 space-y-1 text-neutral-400">
              {insights.missing_documentation?.map((item, i) => (
                <li key={i} className="flex space-x-2">
                  <span className="text-neutral-600">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-black p-6 border-2 border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span>Recommended Engineering Action Items</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {insights.suggested_improvements?.map((imp, idx) => (
            <div key={idx} className="p-4 bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-mono">
              <span className="font-bold text-white block mb-2 underline decoration-neutral-500 underline-offset-4">ACTION 0{idx + 1}</span>
              {imp}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
