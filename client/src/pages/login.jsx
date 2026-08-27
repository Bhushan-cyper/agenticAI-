import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/AppShell/Layout';
import { useAuthStore } from '../store/authStore';
import { GraduationCap, Lock, Mail, Loader2, ArrowRight, Shield, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/chat');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await login({ email, password });
    if (!res.success) {
      setErrorMessage(res.message);
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setSubmitting(true);
    setErrorMessage('');
    login({ email: demoEmail, password: demoPassword }).then((res) => {
      if (!res.success) {
        setErrorMessage(res.message);
        setSubmitting(false);
      }
    });
  };

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-navy-950">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-md shadow-brand-500/25">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Sign in to consult the CampusMind RAG assistant
              </p>
            </div>

            {/* Demo Quick Logins */}
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-navy-900/60">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2">
                ⚡ 1-Click Demo Accounts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@campusmind.edu', 'Admin@123456')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Demo Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student@campusmind.edu', 'Student@123456')}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <User className="h-3.5 w-3.5" />
                  Demo Student
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@campusmind.edu"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand-500/25 hover:bg-brand-700 transition-all hover:scale-[1.01]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Register as Student
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
