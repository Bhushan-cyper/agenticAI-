import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import SourceCitation from '../SourceCitation/SourceCitation';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Sparkles,
  Bot,
  User as UserIcon,
  Gauge,
  Clock,
  Send,
} from 'lucide-react';

export default function MessageBubble({ message, onFeedback }) {
  const [copied, setCopied] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [commentText, setCommentText] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.answer || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = (type) => {
    if (type === 'down') {
      setFeedbackType('down');
      setShowCommentModal(true);
    } else {
      if (onFeedback) onFeedback(message._id, 'up', '');
    }
  };

  const submitComment = () => {
    if (onFeedback && feedbackType) {
      onFeedback(message._id, feedbackType, commentText);
    }
    setShowCommentModal(false);
    setCommentText('');
  };

  const confidencePct = Math.round((message.confidenceScore || 0) * 100);

  return (
    <div className="space-y-4 py-2">
      {/* 1. Student User Question Bubble */}
      {message.query && (
        <div className="flex justify-end">
          <div className="flex max-w-2xl items-start gap-3 flex-row-reverse">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-white dark:bg-slate-700">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tr-none bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
              <p className="whitespace-pre-wrap">{message.query}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CampusMind AI Answer Bubble */}
      <div className="flex justify-start">
        <div className="flex max-w-3xl items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-sm">
            <Bot className="h-4 w-4" />
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl rounded-tl-none border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-950">
            {/* Header info / Confidence Meter */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                  CampusMind Assistant
                </span>

                {message.providerUsed && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {message.providerUsed}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                {message.confidenceScore !== undefined && message.confidenceScore > 0 && (
                  <div className="flex items-center gap-1 font-semibold">
                    <Gauge className="h-3 w-3 text-emerald-500" />
                    <span className={confidencePct >= 70 ? 'text-emerald-500' : 'text-amber-500'}>
                      {confidencePct}% Confidence
                    </span>
                  </div>
                )}

                {message.latencyMs ? (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{message.latencyMs}ms</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Markdown Answer Content */}
            <div className="prose prose-sm max-w-none text-slate-800 dark:prose-invert dark:text-slate-200 leading-relaxed">
              {message.answer ? (
                <ReactMarkdown>{message.answer}</ReactMarkdown>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                  <div className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
                  Generating verified answer from campus documents...
                </div>
              )}
            </div>

            {/* Source Citations */}
            {message.sources && message.sources.length > 0 && (
              <SourceCitation sources={message.sources} />
            )}

            {/* Action Bar (Copy, Thumbs Up / Down) */}
            {message.answer && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVote('up')}
                    title="Good answer"
                    className={`flex items-center gap-1 rounded-md p-1.5 transition-colors ${
                      message.feedback === 'up'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleVote('down')}
                    title="Poor answer or inaccurate citation"
                    className={`flex items-center gap-1 rounded-md p-1.5 transition-colors ${
                      message.feedback === 'down'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>

                  {message.feedbackComment && (
                    <span className="text-[11px] italic text-slate-400 max-w-[200px] truncate ml-1">
                      "{message.feedbackComment}"
                    </span>
                  )}
                </div>

                <button
                  onClick={handleCopy}
                  title="Copy answer"
                  className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Comment Dialog */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-navy-950">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Help us improve CampusMind AI</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              What was missing or inaccurate about this response?
            </p>
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="E.g., Outdated fee amount, or missing library weekend hours..."
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-900 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCommentModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Skip
              </button>
              <button
                onClick={submitComment}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                <Send className="h-3 w-3" /> Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
