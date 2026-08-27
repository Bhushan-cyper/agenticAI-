import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import Layout from '../../components/AppShell/Layout';
import DocumentUploader from '../../components/DocumentUploader/DocumentUploader';
import ProcessingStatusBadge from '../../components/ProcessingStatusBadge/ProcessingStatusBadge';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  FileText,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen,
} from 'lucide-react';

const DEPARTMENTS = ['All', 'Admissions', 'Accounts', 'Hostel', 'Placements', 'Academics', 'Library', 'General'];

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [reindexingId, setReindexingId] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Listen for live ingestion status events from Socket.IO
    const socket = getSocket();
    if (socket) {
      const handleStatus = (data) => {
        console.log('📡 Live Document Status Update:', data);
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc._id === data.documentId
              ? {
                  ...doc,
                  status: data.status,
                  pageCount: data.pageCount || doc.pageCount,
                  chunkCount: data.chunkCount || doc.chunkCount,
                  errorReason: data.error || null,
                }
              : doc
          )
        );
      };

      socket.on('document:status', handleStatus);
      return () => {
        socket.off('document:status', handleStatus);
      };
    }
  }, []);

  const handleReindex = async (id) => {
    setReindexingId(id);
    try {
      await api.post(`/documents/${id}/reindex`);
      fetchDocuments();
    } catch (err) {
      console.error('Reindex error:', err.message);
    } finally {
      setReindexingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}" and purge all its indexed vectors?`)) {
      return;
    }

    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error('Delete error:', err.message);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesDept = deptFilter === 'All' || doc.department === deptFilter;
    const matchesSearch =
      (doc.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (doc.department || '').toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <ProtectedRoute requireAdmin={true}>
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Document Management & Ingestion
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Upload college PDFs, monitor real-time vector embedding pipeline, re-index, or purge documents.
              </p>
            </div>

            <button
              onClick={fetchDocuments}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-navy-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Status
            </button>
          </div>

          {/* Uploader Section */}
          <div className="mb-8">
            <DocumentUploader onUploadSuccess={() => fetchDocuments()} />
          </div>

          {/* Document Table & Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-navy-950">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-navy-900/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Document Title</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Processing Pipeline Status</th>
                    <th className="px-5 py-3 font-semibold">Pages / Chunks</th>
                    <th className="px-5 py-3 font-semibold">Uploaded</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Loading documents...
                      </td>
                    </tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No documents found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-900/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {doc.title}
                              </span>
                              {doc.isOcrProcessed && (
                                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  OCR
                                </span>
                              )}
                              <p className="text-[11px] text-slate-400">{doc.originalFilename}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {doc.department}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <ProcessingStatusBadge status={doc.status} errorReason={doc.errorReason} />
                        </td>

                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {doc.pageCount} page(s) / <span className="font-semibold">{doc.chunkCount} chunks</span>
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReindex(doc._id)}
                              disabled={reindexingId === doc._id}
                              title="Re-index document"
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${reindexingId === doc._id ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleDelete(doc._id, doc.title)}
                              title="Delete document and purge vectors"
                              className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
