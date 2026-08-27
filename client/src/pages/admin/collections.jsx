import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import Layout from '../../components/AppShell/Layout';
import api from '../../services/api';
import {
  FolderKanban,
  Plus,
  BookOpen,
  FileText,
  Trash2,
  Edit,
  GraduationCap,
  Building2,
  Briefcase,
  Receipt,
  Calendar,
  X,
} from 'lucide-react';

const ICON_MAP = {
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Receipt: <Receipt className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Calendar: <Calendar className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Admissions');
  const [description, setDescription] = useState('');

  const fetchCollections = async () => {
    try {
      const res = await api.get('/collections');
      if (res.data.success) {
        setCollections(res.data.collections || []);
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !department) return;

    try {
      await api.post('/collections', {
        name,
        department,
        description,
        icon: 'BookOpen',
      });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchCollections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create collection');
    }
  };

  const handleDelete = async (id, colName) => {
    if (!confirm(`Delete collection "${colName}"?`)) return;
    try {
      await api.delete(`/collections/${id}`);
      setCollections((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error('Failed to delete collection:', err.message);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Knowledge Base Collections
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Organize college documents by department to facilitate targeted semantic search.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </button>
          </div>

          {/* Collection Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <div
                key={col._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-950 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      {ICON_MAP[col.icon] || <FolderKanban className="h-5 w-5" />}
                    </div>
                    <button
                      onClick={() => handleDelete(col._id, col.name)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    {col.name}
                  </h3>
                  <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Dept: {col.department}
                  </span>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {col.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>{col.documentIds?.length || 0} Linked Document(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-navy-950">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Create Knowledge Collection
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Postgraduate Admissions"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Admissions, Hostel, Academics"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what questions this collection answers..."
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
