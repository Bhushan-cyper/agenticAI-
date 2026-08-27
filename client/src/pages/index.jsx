import Link from 'next/link';
import Layout from '../components/AppShell/Layout';
import { useAuthStore } from '../store/authStore';
import {
  GraduationCap,
  Sparkles,
  Bot,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Layers,
  Database,
  Cpu,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();

  const features = [
    {
      icon: <Database className="h-6 w-6 text-brand-500" />,
      title: 'Real Vector Store Retrieval',
      desc: 'Embeds and queries documents via Pinecone or in-memory cosine similarity, eliminating LLM hallucinations.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      title: 'Verified Source Citations',
      desc: 'Every AI answer cites exact document names and page numbers with interactive excerpt inspection.',
    },
    {
      icon: <Cpu className="h-6 w-6 text-purple-500" />,
      title: 'Multi-LLM Fallback Chain',
      desc: 'Seamless provider failover: OpenAI/OpenRouter -> Google Gemini -> Zero-API-key Extractive Synthesizer.',
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      title: 'Live Real-Time Streaming',
      desc: 'Socket.IO token streaming delivers answers at ultra-low latency while updating admin ingestion pipelines live.',
    },
  ];

  const sampleQuestions = [
    'What is the eligibility criteria for B.Tech CSE?',
    'What are the hostel mess timings and curfew rules?',
    'What was the highest placement package last season?',
    'When do mid-semester examinations begin?',
  ];

  return (
    <Layout>
      <div className="relative overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand-600/20 to-cyan-400/20 blur-3xl" />

        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Next-Gen RAG College Assistant
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
            Instant, Grounded Answers for <br />
            <span className="bg-gradient-to-r from-brand-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Every Campus Question
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            CampusMind AI reads college handbooks, fee rules, placement brochures, and exam schedules to provide 100% source-cited answers with real vector search.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? '/chat' : '/login'}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:from-brand-700 hover:to-brand-600 transition-all hover:scale-105"
            >
              <Bot className="h-4 w-4" />
              {isAuthenticated ? 'Open Campus Chat' : 'Start Asking Questions'}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {isAuthenticated && user?.role === 'admin' ? (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Admin Dashboard
              </Link>
            ) : !isAuthenticated ? (
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Student Registration
              </Link>
            ) : null}
          </div>

          {/* Quick Query Preview Box */}
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-navy-950/90 text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              Try Asking CampusMind About:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sampleQuestions.map((q, i) => (
                <Link
                  key={i}
                  href="/chat"
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-all dark:border-slate-800/80 dark:bg-navy-900 dark:text-slate-300 dark:hover:border-brand-500"
                >
                  <span className="truncate">{q}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-slate-200 bg-slate-100/50 py-16 dark:border-slate-800 dark:bg-navy-950/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Engineered for Complete Accuracy & Trust
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                A purpose-built Retrieval-Augmented Generation architecture with comprehensive audit trails.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-navy-900"
                >
                  <div className="mb-4 inline-block rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
