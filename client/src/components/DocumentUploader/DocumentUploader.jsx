import { useState, useRef } from 'react';
import api from '../../services/api';
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const DEPARTMENTS = ['Admissions', 'Accounts', 'Hostel', 'Placements', 'Academics', 'Library', 'General'];

export default function DocumentUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Admissions');
  const [collectionTag, setCollectionTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        // Strip extension for title suggestion
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('department', department);
    formData.append('collectionTag', collectionTag || department);

    try {
      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSuccessMsg(`"${title || file.name}" uploaded and queued for processing!`);
        setFile(null);
        setTitle('');
        setCollectionTag('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onUploadSuccess) onUploadSuccess(res.data.document);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-navy-950">
      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <UploadCloud className="h-5 w-5 text-brand-500" />
        Upload & Ingest Campus Document
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Upload PDF circulars, handbooks, fee policies, or rules. The file will be extracted, chunked, and embedded into the vector store.
      </p>

      <form onSubmit={handleUpload} className="mt-4 space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-brand-500 hover:bg-brand-50/30 transition-all dark:border-slate-700 dark:bg-navy-900 dark:hover:border-brand-500"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-sm">
              <File className="h-5 w-5" />
              <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          ) : (
            <>
              <UploadCloud className="mb-2 h-8 w-8 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click or drag and drop document here
              </p>
              <p className="mt-1 text-[11px] text-slate-400">PDF, TXT, or Markdown (Max 25MB)</p>
            </>
          )}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Admission Guidelines 2025"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Collection Tag</label>
            <input
              type="text"
              value={collectionTag}
              onChange={(e) => setCollectionTag(e.target.value)}
              placeholder="Optional tag (defaults to dept)"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-navy-900 dark:text-white"
            />
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isUploading}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all ${
              file && !isUploading
                ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading & Queuing...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Start Ingestion
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
