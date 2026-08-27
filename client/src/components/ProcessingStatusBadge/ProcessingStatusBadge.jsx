import { Loader2, CheckCircle2, AlertTriangle, Clock, Layers, Sparkles } from 'lucide-react';

export default function ProcessingStatusBadge({ status, errorReason }) {
  const configs = {
    UPLOADED: {
      label: 'Uploaded',
      bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      icon: <Clock className="h-3 w-3" />,
    },
    EXTRACTING: {
      label: 'Extracting Text',
      bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    CHUNKING: {
      label: 'Chunking Content',
      bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800 animate-pulse',
      icon: <Layers className="h-3 w-3" />,
    },
    EMBEDDING: {
      label: 'Generating Vectors',
      bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800 animate-pulse',
      icon: <Sparkles className="h-3 w-3 animate-spin" />,
    },
    INDEXED: {
      label: 'Indexed & Ready',
      bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    FAILED: {
      label: 'Processing Failed',
      bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const current = configs[status] || configs.UPLOADED;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        title={errorReason || current.label}
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${current.bg}`}
      >
        {current.icon}
        {current.label}
      </span>
      {status === 'FAILED' && errorReason && (
        <span className="text-[11px] text-rose-500 max-w-[180px] truncate" title={errorReason}>
          {errorReason}
        </span>
      )}
    </div>
  );
}
