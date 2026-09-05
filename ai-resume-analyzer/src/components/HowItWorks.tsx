import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Upload Profile',
    desc: 'Drag and drop your current resume. We support PDF format up to 5MB.'
  },
  {
    num: '02',
    title: 'Set Target Role',
    desc: 'Paste the job description of the role you want to land.'
  },
  {
    num: '03',
    title: 'AI Analysis',
    desc: 'Our Gemini AI engine cross-references your experience with the job requirements.'
  },
  {
    num: '04',
    title: 'Optimize & Apply',
    desc: 'Implement the suggested changes and apply with confidence.'
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-24 relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-gray-100">How It Works</h2>
          <p className="text-slate-600 dark:text-gray-300 max-w-xl mx-auto">Four simple steps to a fully optimized, interview-winning resume.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="relative text-center"
            >
              <div className="w-20 h-20 mx-auto glass-card border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary shadow-[0_0_20px_rgba(99,102,241,0.15)] mb-6">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-gray-100">{step.title}</h3>
              <p className="text-sm text-slate-600 dark:text-gray-300">{step.desc}</p>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] bg-gradient-to-r from-primary/30 to-transparent -z-10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
