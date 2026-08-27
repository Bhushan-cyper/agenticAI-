import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import MessageBubble from '../MessageBubble/MessageBubble';
import SuggestedQuestions from './SuggestedQuestions';
import {
  Send,
  Sparkles,
  Filter,
  Loader2,
  Paperclip,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';

const DEPARTMENTS = ['All', 'Admissions', 'Accounts', 'Hostel', 'Placements', 'Academics', 'Library'];

export default function ChatWindow() {
  const {
    messages,
    sendMessage,
    isStreaming,
    streamingMessage,
    activeDepartmentFilter,
    setDepartmentFilter,
    suggestedQuestions,
    loadSuggestedQuestions,
    submitFeedback,
  } = useChatStore();

  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadSuggestedQuestions();
  }, [loadSuggestedQuestions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || isStreaming) return;
    const q = inputQuery;
    setInputQuery('');
    sendMessage(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggested = (question, department) => {
    if (department && department !== activeDepartmentFilter) {
      setDepartmentFilter(department);
    }
    sendMessage(question);
  };

  const showEmptyState = messages.length === 0 && !streamingMessage;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50 dark:bg-navy-900">
      {/* Top Header Bar with Department Filter */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-2.5 backdrop-blur-sm dark:border-slate-800 dark:bg-navy-950/80">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            RAG Knowledge Base Connected
          </span>
        </div>

        {/* Department Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">Department Scope:</span>
          <select
            value={activeDepartmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? '🌐 All Departments' : `📁 ${dept}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {showEmptyState ? (
            <SuggestedQuestions
              questions={suggestedQuestions}
              onSelectQuestion={handleSelectSuggested}
            />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} onFeedback={submitFeedback} />
              ))}

              {/* Streaming AI preview bubble */}
              {isStreaming && streamingMessage && (
                <MessageBubble
                  message={{
                    _id: 'streaming-active',
                    query: streamingMessage.query,
                    answer: streamingMessage.answer,
                    sources: streamingMessage.sources,
                    confidenceScore: streamingMessage.confidenceScore || 0.85,
                    providerUsed: 'streaming...',
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Box Area */}
      <div className="border-t border-slate-200 bg-white/90 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-navy-950/90">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-2 shadow-inner focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-navy-900">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about admissions, hostel rules, fees, exams, placements..."
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isStreaming}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-semibold transition-all ${
                inputQuery.trim() && !isStreaming
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 hover:scale-105'
                  : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
            CampusMind AI retrieves and cites source context from college handbooks. Responses are strictly grounded in uploaded documents.
          </p>
        </div>
      </div>
    </div>
  );
}
