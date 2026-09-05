import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Loader2, XCircle, Sparkles, Clock } from 'lucide-react';
import { analyzeResume, type AnalysisResult } from '../lib/api';
import { AnalysisResults } from './AnalysisResults';

type Status = 'idle' | 'loading' | 'success' | 'error';

export const LiveDemo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateAndSetFile = (selected: File): boolean => {
    if (selected.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.');
      setStatus('error');
      return false;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds the 5 MB limit. Please compress your PDF.');
      setStatus('error');
      return false;
    }
    setFile(selected);
    if (status === 'error') { setStatus('idle'); setErrorMsg(''); }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  }, [status]);

  const handleAnalyze = async () => {
    if (cooldown > 0 || status === 'loading') return;
    if (!file) { setErrorMsg('Please upload your resume (PDF).'); setStatus('error'); return; }
    if (!jobDescription.trim()) { setErrorMsg('Please paste a job description.'); setStatus('error'); return; }
    if (jobDescription.trim().length < 20) { setErrorMsg('Job description is too short.'); setStatus('error'); return; }

    setStatus('loading');
    setErrorMsg('');
    setResult(null); // Clear previous results immediately
    try {
      const res = await analyzeResume(file, jobDescription);
      // Validate that the API returned the expected response structure
if (
  !res ||
  !res.metadata ||
  !res.analysis ||
  !res.recommendations ||
  !Array.isArray(res.analysis.matched_skills) ||
  !Array.isArray(res.analysis.missing_skills)
) {
  throw new Error("Invalid analysis received. Please try again.");
}

      setResult(res);
      setStatus('success');
      setCooldown(30); 
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (err: any) {
      console.error("ANALYSIS ERROR:", err);
      setErrorMsg(err.message || 'System busy, please try again shortly');
      setStatus('error');
      setCooldown(10);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobDescription('');
    setResult(null);
    setStatus('idle');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="demo" className="py-20 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900 dark:text-gray-100">
            Analyze Your Resume
          </h2>
          <p className="text-slate-600 dark:text-gray-400 max-w-xl mx-auto">
            Optimized for fast performance and reliable AI analysis.
          </p>
        </div>

        {/* Input Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col gap-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-800 dark:text-gray-100">1 · Upload Resume</label>
              {file && status !== 'loading' && <button onClick={() => setFile(null)} className="text-xs text-red-500 font-medium">Remove</button>}
            </div>
            <div
              onDragEnter={() => setIsDragOver(true)}
              onDragLeave={() => setIsDragOver(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => status !== 'loading' && fileInputRef.current?.click()}
              className={[
                'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                status === 'loading' ? 'opacity-50 cursor-not-allowed' : '',
                isDragOver ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-600 hover:border-primary',
                file ? 'border-primary bg-primary/5' : '',
              ].join(' ')}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} disabled={status === 'loading'} />
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-10 h-10 text-primary mb-2" />
                  <span className="font-semibold text-sm truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(0)} KB · PDF</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <UploadCloud className="w-10 h-10 mb-2 opacity-60" />
                  <p className="font-semibold text-sm">Click or drag & drop</p>
                  <p className="text-xs mt-1">PDF only · max 5 MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex flex-col gap-4">
            <label className="text-sm font-semibold text-slate-800 dark:text-gray-100">2 · Paste Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              disabled={status === 'loading'}
              placeholder="Paste the job listing here..."
              className="flex-1 min-h-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/20 rounded-xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={status === 'loading' || cooldown > 0}
            className="flex-1 sm:flex-none sm:px-10 py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing resume…</>
            ) : cooldown > 0 ? (
              <><Clock className="w-5 h-5" /> Wait {cooldown}s</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Analyze Resume Match</>
            )}
          </button>
        </div>

        <AnimatePresence>
          {status === 'error' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl border border-red-200 dark:border-red-900/60"
            >
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex flex-col items-center gap-3 text-slate-500 text-sm font-medium">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p>Analyzing resume… please wait a few seconds</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {result && status === 'success' && (
          <motion.div id="results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnalysisResults data={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
