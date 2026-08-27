import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import Layout from '../components/AppShell/Layout';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  Settings as SettingsIcon,
  Activity,
  Database,
  Cpu,
  Sparkles,
  Shield,
  User,
  CheckCircle2,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Health check failed:', err.message);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Settings & System Health
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                View your user account information and diagnostic provider status.
              </p>
            </div>

            <button
              onClick={fetchHealth}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-navy-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
              Re-check Health
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* User Profile Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{user?.name}</h3>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Role</span>
                  <span className="font-bold uppercase text-brand-600 dark:text-brand-400">
                    {user?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Account ID</span>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                    {user?.id || user?._id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Session Status</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active JWT
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Health & Architecture (2 cols) */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-emerald-500" />
                RAG Pipeline & Provider Diagnostics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Database */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-navy-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Database className="h-4 w-4 text-brand-500" />
                    MongoDB Database
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {health?.services?.database?.status || 'Active'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Type: {health?.services?.database?.type || 'Standard MongoDB'}
                  </div>
                </div>

                {/* Vector Store */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-navy-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Server className="h-4 w-4 text-cyan-500" />
                    Vector Database
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                    {health?.services?.vectorStore?.provider || 'Cosine Similarity Store'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Status: {health?.services?.vectorStore?.status || 'operational'}
                    {health?.services?.vectorStore?.totalVectors !== undefined &&
                      ` (${health.services.vectorStore.totalVectors} vectors)`}
                  </div>
                </div>

                {/* Embeddings Provider */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-navy-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Layers className="h-4 w-4 text-purple-500" />
                    Embedding Model
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {health?.services?.providers?.embedding || 'Local Dense Vectorizer'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Fallback Chain: OpenAI $\rightarrow$ Gemini $\rightarrow$ Local Hashing
                  </div>
                </div>

                {/* LLM Generation Engine */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-navy-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Cpu className="h-4 w-4 text-amber-500" />
                    Generation LLM
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {health?.services?.providers?.llm || 'Extractive Synthesizer'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    LangChain Pipeline: {health?.services?.ragPipeline || 'available'}
                  </div>
                </div>
              </div>

              {/* Server Metadata */}
              <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                <span>Node Version: {health?.system?.nodeVersion || 'v22.x'}</span>
                <span>Server Uptime: {Math.round(health?.system?.uptime || 0)} seconds</span>
                <span>Health Timestamp: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
