import { Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-gray-100 tracking-tight">AI Resume Analyzer</span>
            </div>
            <p className="text-slate-500 dark:text-gray-400 max-w-sm text-sm leading-relaxed">
              Your intelligent partner for landing the dream job. We use advanced AI (Gemini) to match your experience with what companies actually want.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-gray-100 font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Enterprise'].map(item => (
                <li key={item}>
                  <a href="#" className="text-slate-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-gray-100 font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {['About', 'Privacy Policy', 'Terms of Service'].map(item => (
                <li key={item}>
                  <a href="#" className="text-slate-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/10 text-center text-slate-500 dark:text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} AI Resume Analyzer. All rights reserved. Powered by Google Gemini AI.
        </div>
      </div>
    </footer>
  );
};
