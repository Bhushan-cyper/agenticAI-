import { Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

export default function SuggestedQuestions({ questions = [], onSelectQuestion }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-lg shadow-brand-500/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          How can CampusMind help you today?
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Ask questions about admissions, hostel rules, fees, exams, placements, and clubs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {questions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(item.question, item.department)}
            className="group flex flex-col items-start justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-400 hover:shadow-md hover:shadow-brand-500/10 dark:border-slate-800 dark:bg-navy-950 dark:hover:border-brand-500"
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {item.category || item.department || 'Campus'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-brand-500" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {item.question}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
