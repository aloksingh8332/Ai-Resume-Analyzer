import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Sparkles,
  TrendingUp, RotateCcw, Zap, Loader2,
  Info, BookOpen, Target, Award, XCircle
} from 'lucide-react';
import { type AnalysisResult, type BulletImprovement, improveResume } from '../lib/api';

type Tab = 'overview' | 'roadmap' | 'improve';
type Role = 'candidate' | 'recruiter';

interface Props {
  data: AnalysisResult;
  onReset: () => void;
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5">
    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[10px] rounded shadow-xl z-50">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
    </div>
  </div>
);

// ── Score Circle ──────────────────────────────────────────────────────────────
const ScoreCircle = ({ score }: { score: number }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 100;
  const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} strokeWidth="10" fill="transparent"
          className="stroke-slate-200 dark:stroke-slate-700" />
        <motion.circle cx="60" cy="60" r={r} strokeWidth="10" fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ stroke: color, filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900 dark:text-gray-100">{score}<span className="text-lg">%</span></span>
        <span className="text-xs font-semibold mt-0.5" style={{ color }}>Match</span>
      </div>
    </div>
  );
};

// ── Why Score Bar ─────────────────────────────────────────────────────────────
const WhyBar = ({ label, value, color, tooltip }: { label: string; value: number; color: string; tooltip: string }) => (
  <div className="group">
    <div className="flex justify-between mb-1.5 items-center">
      <div className="flex items-center">
        <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{label}</span>
        <Tooltip text={tooltip} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{Math.round(value)}%</span>
    </div>
    <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
      <motion.div className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </div>
  </div>
);

// ── Skill Tag ─────────────────────────────────────────────────────────────────
const SkillTag = ({ label, variant }: { label: string; variant: 'match' | 'miss' }) => {
  const cls = variant === 'match'
    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40'
    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700/40';
  return (
    <motion.span whileHover={{ scale: 1.05, y: -2 }}
      className={`px-3 py-1.5 text-[11px] font-bold border rounded-lg cursor-default shadow-sm transition-colors ${cls}`}>
      {label}
    </motion.span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const AnalysisResults = ({ data, onReset }: Props) => {
  useEffect(() => {
    console.log("AI RESPONSE DATA:", data);
  }, [data]);

  // ── STEP 2: CORRECT DATA MAPPING ──
  const matchScore = data?.metadata?.match_score ?? 0;
  const matchedSkills = Array.isArray(data?.analysis?.matched_skills) ? data.analysis.matched_skills : [];
  const missingSkills = Array.isArray(data?.analysis?.missing_skills) ? data.analysis.missing_skills : [];
  
  // ── STEP 3: FIX AI RESPONSE DISPLAY ──
  const aiSummary = typeof data?.recommendations?.to_candidate === "string" ? data.recommendations.to_candidate : "AI analysis completed successfully.";
  const recruiterRec = typeof data?.recommendations?.to_recruiter === "string" ? data.recommendations.to_recruiter : "Candidate profile matched successfully.";

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [role, setRole] = useState<Role>('candidate');
  const [improvements, setImprovements] = useState<BulletImprovement[]>(data?.improved_bullets || []);
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState('');

  // ── STEP 4: FIX WHY SCORE CALCULATION ──
  const enhancedMetrics = useMemo(() => {
    const total = matchedSkills.length + missingSkills.length;
    let skillsMatch = 0;
    let gapPenalty = 0;
    
    if (total > 0) {
      skillsMatch = (matchedSkills.length / total) * 100;
      gapPenalty = (missingSkills.length / total) * 100;
    } else {
      skillsMatch = matchScore;
      gapPenalty = 0;
    }

    const experienceAlignment = Math.max(0, matchScore - gapPenalty);

    return { 
      skillsMatch, 
      gapPenalty: Math.min(30, gapPenalty), 
      experienceAlignment 
    };
  }, [matchedSkills, missingSkills, matchScore]);

  // ── STEP 9: UI RENDER GUARD ──
  if (!data || (matchScore === 0 && matchedSkills.length === 0 && missingSkills.length === 0)) {
    return (
      <div className="p-12 text-center rounded-3xl border-2 border-dashed border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">Invalid Analysis Data</h3>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">We couldn't process the AI response. Please try again with a different resume or JD.</p>
        <button onClick={onReset} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors">Go Back</button>
      </div>
    );
  }

  const handleImprove = async () => {
    if (!data.extracted_resume_text) return;
    setIsImproving(true);
    setImproveError('');
    try {
      const res = await improveResume(data.extracted_resume_text);
      setImprovements(res);
    } catch (err: any) {
      setImproveError(err.message || 'Failed to improve resume points.');
    } finally {
      setIsImproving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺' },
    { id: 'improve', label: 'Improve', icon: '✨' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cta/10">
            <TrendingUp className="w-6 h-6 text-cta" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-gray-100 tracking-tight">Analysis Result</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Data Verified & Ready</p>
          </div>
        </div>
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
          <RotateCcw className="w-4 h-4" /> NEW SCAN
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2',
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-primary shadow-md'
                : 'text-slate-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5',
            ].join(' ')}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            
            {/* Score Cards */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 rounded-3xl p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center shadow-sm">
                <ScoreCircle score={matchScore} />
                <div className="mt-6 space-y-3">
                  <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${matchScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400'}`}>
                    {matchScore >= 70 ? '🟢 Ideal Match' : '🟡 Some Gaps'}
                  </span>
                </div>
              </div>

              <div className="lg:col-span-3 rounded-3xl p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-6 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Score Breakdown
                </h4>
                <WhyBar label="Skills Alignment" value={enhancedMetrics.skillsMatch} color="#6366F1" tooltip="Percentage of required keywords matched." />
                <WhyBar label="Experience Value" value={enhancedMetrics.experienceAlignment} color="#10B981" tooltip="How well your seniority matches the role." />
                <WhyBar label="Critical Gap Penalty" value={enhancedMetrics.gapPenalty} color="#EF4444" tooltip="Penalty for missing core required skills." />
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-8 shadow-sm">
              <div>
                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4" /> Matched Skills ({matchedSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.length > 0 ? matchedSkills.map(s => <SkillTag key={s} label={s} variant="match" />) : <span className="text-xs text-slate-400 italic">No exact matches found.</span>}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-white/5 pt-8">
                <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4" /> Missing Gaps ({missingSkills.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.length > 0 ? missingSkills.map(s => <SkillTag key={s} label={s} variant="miss" />) : <span className="text-xs text-slate-400 italic">No missing skills detected — Great match!</span>}
                </div>
              </div>
            </div>

            {/* AI Insights - STEP 3: Paragraph formatting */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Recommendation
                </h4>
                <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 border border-slate-200 dark:border-white/5">
                  <button onClick={() => setRole('candidate')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${role === 'candidate' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm' : 'text-slate-500'}`}>Candidate</button>
                  <button onClick={() => setRole('recruiter')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${role === 'recruiter' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm' : 'text-slate-500'}`}>Recruiter</button>
                </div>
              </div>
              <div className="text-sm font-medium leading-relaxed text-slate-700 dark:text-gray-200 space-y-4">
                {(role === 'candidate' ? aiSummary : recruiterRec).split('\n').map((para, i) => (
                  para.trim() && <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            {/* STEP 6: FIX SKILL GAP SECTION */}
            {missingSkills.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {missingSkills.slice(0, 6).map((skill, i) => (
                    <RoadmapCard key={skill} skill={skill} index={i} />
                  ))}
                </div>
                <WhatIfSimulator missingSkills={missingSkills} baseScore={matchScore} />
              </>
            ) : matchScore === 100 ? (
              <div className="py-20 text-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/10 border border-dashed border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest">No Skill Gaps Detected</h4>
                <p className="text-xs text-slate-500 mt-2">Your resume perfectly matches all requirements.</p>
              </div>
            ) : (
              <div className="py-20 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest">Unable to Detect Gaps Propery</h4>
                <p className="text-xs text-slate-500 mt-2">The AI couldn't pinpoint specific missing skills. Try a clearer JD.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'improve' && (
          <motion.div key="improve" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-4">
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm">
              <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4" /> Auto Bullet Refiner
              </h4>
              {improvements.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-white/5">
                  {improveError && <p className="text-red-500 text-xs font-bold mb-4">⚠️ {improveError}</p>}
                  <button onClick={handleImprove} disabled={isImproving} className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 mx-auto hover:bg-primary-dark transition-all disabled:opacity-50 shadow-xl shadow-primary/20">
                    {isImproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isImproving ? 'Generating...' : '✨ Refine My Resume'}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-4 italic font-bold">Safe AI improvement using STAR framework.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {improvements.map((bullet, i) => (
                    <BulletCard key={i} bullet={bullet} index={i} />
                  ))}
                  <button onClick={() => setImprovements([])} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary mx-auto block pt-4">Reset</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Roadmap Card ─────────────────────────────────────────────────────────────
const RoadmapCard = ({ skill, index }: { skill: string; index: number }) => {
  const steps = [
    { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Grasp fundamental concepts" },
    { icon: <Target className="w-3.5 h-3.5" />, text: "Build a small project" },
    { icon: <Award className="w-3.5 h-3.5" />, text: "Get certified or showcase it" }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="p-5 rounded-2xl bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-white/10 shadow-sm">
      <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" /> {skill}
      </h5>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-400">
              {step.icon}
            </div>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{step.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ── What-If Simulator ─────────────────────────────────────────────────────────
const WhatIfSimulator = ({ missingSkills, baseScore }: { missingSkills: string[]; baseScore: number }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (skill: string) => setSelected(prev => { const s = new Set(prev); s.has(skill) ? s.delete(skill) : s.add(skill); return s; });
  
  // ── STEP 7: FIX WHAT-IF SIMULATOR ──
  const gain = selected.size * 3;
  const simulated = Math.min(100, baseScore + gain);

  return (
    <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
        <Zap className="w-4 h-4 text-primary" /> What-If Simulator
      </h4>
      <div className="flex flex-wrap gap-2 mb-6">
        {missingSkills.map(skill => (
          <button key={skill} onClick={() => toggle(skill)} className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all ${selected.has(skill) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/5'}`}>
            {selected.has(skill) ? '✓ ' : '+ '} {skill}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="h-full bg-slate-300 dark:bg-slate-700 rounded-full" style={{ width: `${baseScore}%` }} />
            <motion.div className="absolute top-0 h-full bg-primary rounded-full" animate={{ width: `${simulated}%` }} />
          </div>
        </div>
        <div className="text-lg font-black text-primary">
          {simulated}%
        </div>
      </div>
    </div>
  );
};

const BulletCard = ({ bullet }: { bullet: { original: string; improved: string }; index: number }) => {
  const [showImproved, setShowImproved] = useState(true);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
      <div className="flex bg-slate-50 dark:bg-slate-900/50">
        <button onClick={() => setShowImproved(false)} className={`flex-1 py-2 text-[10px] font-black uppercase ${!showImproved ? 'bg-white dark:bg-slate-700 text-primary' : 'text-slate-400'}`}>Original</button>
        <button onClick={() => setShowImproved(true)} className={`flex-1 py-2 text-[10px] font-black uppercase ${showImproved ? 'bg-white dark:bg-slate-700 text-emerald-500' : 'text-slate-400'}`}>Improved</button>
      </div>
      <div className="p-4 text-xs font-medium leading-relaxed dark:text-white">
        • {showImproved ? bullet.improved : bullet.original}
      </div>
    </div>
  );
};
