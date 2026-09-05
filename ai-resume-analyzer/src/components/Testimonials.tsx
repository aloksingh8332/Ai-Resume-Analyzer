import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const reviews = [
  {
    name: "Sarah Jenkins",
    role: "Senior Product Manager",
    content: "This tool completely transformed my job hunt. I tweaked my resume using the AI suggestions and landed interviews at Google and Stripe within a week.",
    avatar: "S"
  },
  {
    name: "Michael Chen",
    role: "Frontend Developer",
    content: "The missing skills feature is a game-changer. It told me exactly which keywords the ATS was looking for. Highly recommend for any dev.",
    avatar: "M"
  },
  {
    name: "Elena Rodriguez",
    role: "Marketing Director",
    content: "I didn't realize how much my resume was holding me back. The competitive benchmarking gave me the confidence to negotiate a 20% higher salary.",
    avatar: "E"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-24 relative bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-gray-100">
            Trusted by Ambitious Professionals
          </h2>
          <p className="text-slate-600 dark:text-gray-300 max-w-xl mx-auto">
            Real results from real users who landed their dream roles.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card border border-slate-200 dark:border-white/10 p-8 rounded-2xl flex flex-col"
            >
              <div className="flex text-cta mb-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-gray-300 italic flex-grow mb-8">"{review.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                  {review.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-gray-100">{review.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-gray-400">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
