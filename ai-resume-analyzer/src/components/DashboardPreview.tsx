import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Menu, CheckCircle2, AlertCircle,
  Sparkles, ArrowRightLeft, MoveRight
} from 'lucide-react';
import { useState } from 'react';

export const DashboardPreview = () => {
  const [showBefore, setShowBefore] = useState(true);

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-gray-100">
            Powerful Analytics Dashboard
          </h2>
          <p className="text-slate-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage all your tailored resumes and track your application success rates in one place.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-6xl mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-primary/10 dark:shadow-primary/20 bg-white dark:bg-slate-900/80"
        >
          {/* Mock Header */}
          <div className="h-14 bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Menu className="w-5 h-5 text-slate-500 dark:text-gray-400" />
              <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="flex items-center gap-4">
              <Search className="w-4 h-4 text-slate-500 dark:text-gray-400" />
              <Bell className="w-4 h-4 text-slate-500 dark:text-gray-400" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary-light"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/40">

            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">

              {/* Score + Skills row */}
              <div className="grid md:grid-cols-3 gap-6">

                {/* Score Widget */}
                <motion.div
                  className="rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-100 mb-4 w-full text-left uppercase tracking-wider">Match Score</h3>

                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" fill="transparent" />
                      <motion.circle
                        cx="56" cy="56" r="48"
                        strokeWidth="8" fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray="301"
                        initial={{ strokeDashoffset: 301 }}
                        whileInView={{ strokeDashoffset: 301 - (301 * 92) / 100 }}
                        viewport={{ once: true }}
                        transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
                        style={{ stroke: '#6366F1', filter: "drop-shadow(0 0 8px rgba(99,102,241,0.6))" }}
                      />
                    </svg>
                    <div className="flex flex-col items-center z-10">
                      <span className="text-3xl font-bold text-slate-900 dark:text-gray-100">92<span className="text-lg">%</span></span>
                      <span className="text-xs text-cta font-semibold mt-0.5">Excellent</span>
                    </div>
                  </div>
                </motion.div>

                {/* Skills */}
                <div className="md:col-span-2 rounded-xl p-6 flex flex-col justify-between bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-cta" /> Core Matched Skills
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {['React', 'TypeScript', 'System Design', 'REST APIs'].map(skill => (
                        <motion.span
                          key={skill} whileHover={{ scale: 1.05, y: -2 }}
                          className="px-3 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50 rounded-full cursor-default"
                        >{skill}</motion.span>
                      ))}
                    </div>

                    <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-100 mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-orange-500" /> Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['GraphQL', 'Docker', 'AWS'].map((skill, i) => (
                        <motion.span
                          key={skill}
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                          className="px-3 py-1 text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-700/40 rounded-full"
                        >{skill}</motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Before/After */}
              <div className="rounded-xl p-6 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wider">
                    <ArrowRightLeft className="w-4 h-4 text-primary" /> Bullet Optimization
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={showBefore ? "text-primary font-semibold" : "text-slate-500 dark:text-gray-400"}>Original</span>
                    <button
                      onClick={() => setShowBefore(!showBefore)}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${showBefore ? 'bg-slate-300 dark:bg-slate-600' : 'bg-primary'}`}
                    >
                      <motion.div
                        animate={{ x: showBefore ? 2 : 22 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"
                      />
                    </button>
                    <span className={!showBefore ? "text-cta font-semibold" : "text-slate-500 dark:text-gray-400"}>AI Improved</span>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-4 min-h-[90px]">
                  <AnimatePresence mode="wait">
                    {showBefore ? (
                      <motion.div key="before" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="text-sm text-slate-700 dark:text-gray-300">
                        <span className="inline-block px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-gray-300 rounded text-xs mb-2">Original</span>
                        <p>• Built a new dashboard feature using React and made it load faster for users.</p>
                      </motion.div>
                    ) : (
                      <motion.div key="after" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="text-sm text-slate-900 dark:text-gray-100">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cta/20 text-cta border border-cta/30 rounded text-xs mb-2 w-max">
                          <Sparkles className="w-3 h-3" /> AI Optimized
                        </span>
                        <p>• Engineered a high-performance analytics dashboard using React, reducing initial load time by <strong className="text-cta">40%</strong> and improving user retention by 18%.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right Column – Suggestions */}
            <div className="rounded-xl p-6 flex flex-col bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-100 mb-5 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-primary" /> Actionable Suggestions
              </h3>

              <div className="space-y-4 flex-grow">
                {[
                  "Quantify your backend performance improvements with specific metrics.",
                  "Add a 'Certifications' section for your AWS Developer Associate.",
                  "Move 'Education' to the bottom of the page to prioritize experience."
                ].map((sug, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex gap-3 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary transition-colors duration-200">
                      <MoveRight className="w-3 h-3 text-primary group-hover:text-white transition-colors duration-200" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-gray-100 transition-colors">
                      {sug}
                    </p>
                  </motion.div>
                ))}
              </div>

              <button className="w-full mt-6 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-white/10">
                View Full Report
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
