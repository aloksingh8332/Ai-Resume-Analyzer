import { Hero } from './components/Hero';
import { LiveDemo } from './components/LiveDemo';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { DashboardPreview } from './components/DashboardPreview';
import { Testimonials } from './components/Testimonials';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { Sparkles } from 'lucide-react';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ai-resume-theme">
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-gray-100 selection:bg-primary/20 transition-colors duration-300">

        {/* Navigation */}
        <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-gray-100">AI Resume</span>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-gray-400">
                <a href="#demo" className="hover:text-primary dark:hover:text-primary-light transition-colors">Demo</a>
                <a href="#demo" className="hover:text-primary dark:hover:text-primary-light transition-colors">Features</a>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-16" />

        <main>
          <Hero />
          <Features />
          <LiveDemo />
          <HowItWorks />
          <DashboardPreview />
          <Testimonials />
          <CTASection />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
