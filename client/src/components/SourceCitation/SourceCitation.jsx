import { useState } from 'react';
import { FileText, ExternalLink, X, BookOpen, ShieldCheck, Tag } from 'lucide-react';

export default function SourceCitation({ sources = [] }) {
  const [activeSource, setActiveSource] = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
        <FileText className="h-3.5 w-3.5 text-brand-500" />
        <span>Grounded Knowledge Sources ({sources.length}):</span>
      </div>

      {/* Citation Chips */}
      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSource(src)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 transition-all dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:bg-brand-950/60 dark:hover:text-brand-300"
          >
            <BookOpen className="h-3 w-3 text-brand-500" />
            <span className="max-w-[160px] truncate">{src.documentTitle}</span>
            <span className="rounded bg-white/80 px-1 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              P.{src.pageNumber}
            </span>
          </button>
        ))}
      </div>

      {/* Modal / Drawer for inspecting source snippet */}
      {activeSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-navy-950">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-brand-100 p-2 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {activeSource.documentTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Page {activeSource.pageNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {activeSource.department || 'General'}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> {(activeSource.score * 100).toFixed(0)}% Relevance
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveSource(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Retrieved Context Excerpt
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-navy-900 dark:text-slate-200 max-h-72 overflow-y-auto">
                <p className="whitespace-pre-wrap">{activeSource.snippet}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveSource(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
