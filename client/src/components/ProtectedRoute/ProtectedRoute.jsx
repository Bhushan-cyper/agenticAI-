import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (requireAdmin && user?.role !== 'admin') {
        router.replace('/chat');
      }
    }
  }, [isAuthenticated, isLoading, user, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-navy-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading CampusMind AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && user?.role !== 'admin')) {
    return null;
  }

  return children;
}
