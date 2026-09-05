import { motion } from 'framer-motion';
import { Target, Zap, Shield, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: 'Contextual Semantic Matching',
    description: "We don't just look for keywords. Our AI understands the context of your experience and matches it to job intent."
  },
  {
    icon: <Zap className="w-6 h-6 text-cta" />,
    title: 'Real-time Optimization',
    description: 'Get instant, actionable suggestions on how to tweak your bullet points for maximum impact.'
  },
  {
    icon: <Shield className="w-6 h-6 text-primary-light" />,
    title: 'ATS Bypass Architecture',
    description: 'Ensure your resume is formatted correctly to pass through enterprise Applicant Tracking Systems seamlessly.'
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
    title: 'Competitive Benchmarking',
    description: 'See how you stack up against other candidates applying for similar roles in your industry.'
  }
];

export const Features = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-gray-100">
            Engineered for the Modern Job Market
          </h2>
          <p className="text-slate-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
            Stop guessing what recruiters want. Use data-driven insights to tailor your applications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="glass-card p-6 rounded-2xl group border border-slate-200 dark:border-white/10 hover:border-primary/40 transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
