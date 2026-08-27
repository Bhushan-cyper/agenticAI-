import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageSquare, Plus, Trash2, Search, Sparkles, BookOpen } from 'lucide-react';

export default function Sidebar({ onCloseMobile }) {
  const {
    conversations,
    currentConversation,
    selectConversation,
    startNewChat,
    deleteConversation,
    loadConversations,
  } = useChatStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-navy-950/60">
      {/* New Chat Button */}
      <button
        onClick={() => {
          startNewChat();
          if (onCloseMobile) onCloseMobile();
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:from-brand-700 hover:to-brand-600 transition-all hover:scale-[1.01]"
      >
        <Plus className="h-4 w-4" />
        New Question
      </button>

      {/* Search Filter */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history..."
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-navy-900 dark:text-white"
        />
      </div>

      {/* Conversations List */}
      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
          Recent Consultations
        </div>

        {filteredConversations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conv) => {
              const isSelected = currentConversation?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    selectConversation(conv._id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-500/10 text-brand-600 border border-brand-500/30 dark:bg-brand-950/50 dark:text-brand-300'
                      : 'text-slate-700 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? 'text-brand-500' : 'text-slate-400'}`} />
                    <span className="truncate">{conv.title || 'Conversation'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv._id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 text-slate-400 transition-opacity p-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info Card */}
      <div className="mt-auto border-t border-slate-200 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 p-2.5 text-[11px] text-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-brand-500" />
          <span>Answers grounded in official campus handbooks & PDFs.</span>
        </div>
      </div>
    </aside>
  );
}
