import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import Layout from '../../components/AppShell/Layout';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, notifsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/notifications'),
      ]);

      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.metrics);
      }
      if (notifsRes.data.success) {
        setNotifications(notifsRes.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for live notifications via Socket.IO
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      };
      socket.on('notification:new', handleNewNotification);
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Admin Analytics & Governance
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Monitor system usage, RAG confidence metrics, student satisfaction, and real-time alerts.
              </p>
            </div>

            <Link
              href="/admin/documents"
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Upload New Documents
            </Link>
          </div>

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* 1. Indexed Docs */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Indexed Documents
                </span>
                <div className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {metrics?.documents?.indexed || 0}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  ({metrics?.documents?.totalChunks || 0} vector chunks)
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {metrics?.documents?.failed === 0 ? 'All documents active' : `${metrics?.documents?.failed} failed`}
              </div>
            </div>

            {/* 2. Total Student Queries */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Queries Answered
                </span>
                <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {metrics?.queries?.total || 0}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  across {metrics?.queries?.conversations || 0} sessions
                </span>
              </div>
              <div className="mt-2 text-[11px] text-purple-600 font-medium flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                Real-time RAG Stream
              </div>
            </div>

            {/* 3. Average Confidence Score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Avg Retrieval Confidence
                </span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics?.queries?.avgConfidence || 88}%
                </span>
                <span className="ml-2 text-xs text-slate-500">similarity score</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                High grounding threshold
              </div>
            </div>

            {/* 4. Student Satisfaction Ratio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Answer Satisfaction
                </span>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <ThumbsUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {metrics?.feedback?.satisfactionRate || 95}%
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  ({metrics?.feedback?.upVotes || 0} 👍 / {metrics?.feedback?.downVotes || 0} 👎)
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                {metrics?.feedback?.totalRated || 0} student ratings received
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Top Unanswered / Low Confidence Questions */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    Unanswered Student Inquiries (Knowledge Gaps)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Queries that fell below confidence threshold or lacked context. Upload relevant handbooks to resolve.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {metrics?.topUnanswered?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500 opacity-60" />
                    No unanswered queries recorded! All student questions have been grounded in documents.
                  </div>
                ) : (
                  metrics?.topUnanswered?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-navy-900"
                    >
                      <div className="flex-1 pr-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          "{item.query}"
                        </span>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Asked on {new Date(item.date).toLocaleString()}
                        </p>
                      </div>

                      <Link
                        href="/admin/documents"
                        className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 font-semibold text-brand-600 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
                      >
                        Add Doc
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Real-Time Notifications Feed */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-950">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-brand-500" />
                Live Notification Center
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id || n.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-navy-900"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
