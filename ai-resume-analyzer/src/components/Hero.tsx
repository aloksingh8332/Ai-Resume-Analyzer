import { motion } from 'framer-motion';
import { ArrowRight, Upload } from 'lucide-react';

export const Hero = () => {
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 dark:bg-primary/20 blur-[140px] rounded-full opacity-70" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/10 border border-primary/20 text-primary dark:text-indigo-400 text-sm font-medium mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-cta animate-pulse"></span>
            AI-Powered Resume Analysis
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900 dark:text-gray-100"
          >
            AI That Understands Your Resume{' '}
            <span className="text-gradient">Like a Recruiter</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Analyze, optimize, and match your resume with any job in seconds. Get actionable insights to beat the ATS and land your dream role.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={scrollToDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:shadow-[0_0_36px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <Upload className="w-5 h-5" />
              Upload Resume
            </button>
            <button
              onClick={scrollToDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold flex items-center justify-center gap-2 text-slate-900 dark:text-gray-100 group transition-all duration-300"
            >
              Try Demo
              <ArrowRight className="w-5 h-5 text-slate-400 dark:text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
