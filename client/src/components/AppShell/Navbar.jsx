import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import {
  GraduationCap,
  MessageSquare,
  FileText,
  LayoutDashboard,
  FolderKanban,
  Settings,
  Sun,
  Moon,
  LogOut,
  Shield,
  User as UserIcon,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, theme, toggleTheme } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-navy-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              CampusMind<span className="text-brand-500">_AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              RAG v1.0
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/chat"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/chat')
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  href="/admin/documents"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin/documents')
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Documents
                </Link>

                <Link
                  href="/admin/collections"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin/collections')
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <FolderKanban className="h-4 w-4" />
                  Collections
                </Link>
              </>
            )}

            <Link
              href="/settings"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        )}

        {/* Right Actions: Theme Toggle, User Profile, Auth Buttons */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</span>
                <span className="flex items-center justify-end gap-1 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  {user?.role === 'admin' ? (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-emerald-500">
                      <UserIcon className="h-3 w-3" /> Student
                    </span>
                  )}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
