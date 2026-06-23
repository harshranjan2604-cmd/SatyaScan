import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { key: 'extract',  label: 'Extracting Claims',   desc: 'Parsing semantic structure and isolating verifiable assertions' },
  { key: 'sources',  label: 'Finding Sources',     desc: 'Querying 50k+ indexed knowledge nodes and trusted databases' },
  { key: 'evidence', label: 'Verifying Evidence',  desc: 'Cross-referencing claims against authoritative source snippets' },
  { key: 'ai',       label: 'Analyzing AI',        desc: 'Running neural entropy analysis for AI-generated content signals' },
  { key: 'score',    label: 'Generating Score',    desc: 'Computing weighted trust score across all verification vectors' },
];

const QUOTES = [
  '"Our neural verification engine is currently cross-referencing this claim against 1.2M archived news cycles and cryptographically signed press releases."',
  '"Deep-scanning linguistic fingerprints and source credibility vectors across 42,000 indexed nodes."',
  '"Applying multi-layer forensic analysis to identify misinformation patterns and AI-generation signatures."',
];

function ShieldLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="slg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#slg)" opacity="0.15" stroke="url(#slg)" strokeWidth="2.5" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Arial,sans-serif" fill="url(#slg)">S</text>
    </svg>
  );
}

export default function LoadingState({ currentStep = 0 }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [barWidths, setBarWidths] = useState({});

  // Rotate quote every 5s
  useEffect(() => {
    const t = setInterval(() => setQuoteIndex((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Animate bar widths
  useEffect(() => {
    const widths = {};
    STEPS.forEach((_, i) => {
      if (i < currentStep) widths[i] = 100;
      else if (i === currentStep) widths[i] = 60 + Math.random() * 30;
      else widths[i] = 0;
    });
    setBarWidths(widths);
  }, [currentStep]);

  const activeStep = Math.min(currentStep, STEPS.length - 1);
  const isComplete = currentStep >= STEPS.length;

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <ShieldLogo size={24} />
          <span className="font-bold text-base">
            <span className="text-blue-400">Satya</span>Scan
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>History</span>
          <span className="text-blue-400 border-b border-blue-400 pb-0.5 font-medium">Dashboard</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-gray-900/60 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h2
              className="text-3xl font-extrabold mb-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isComplete ? 'Processing Complete' : 'Analyzing Reality'}
            </motion.h2>
            <p className="text-gray-400 text-sm">
              Deep scanning claim signatures across 42,000 indexed nodes...
            </p>
          </div>

          {/* Step list */}
          <div className="space-y-5">
            {STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep && !isComplete;
              const pending = i > currentStep;

              return (
                <div key={step.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      {/* Status icon */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500
                        ${done ? 'bg-green-500/20 border-green-500' : active ? 'bg-blue-500/20 border-blue-500' : 'bg-gray-800 border-gray-700'}`}>
                        {done ? (
                          <span className="text-green-400 text-xs font-bold">✓</span>
                        ) : active ? (
                          <motion.span
                            className="w-2 h-2 rounded-full bg-blue-400"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        )}
                      </div>

                      <span className={`text-xs font-bold uppercase tracking-widest
                        ${done ? 'text-green-400' : active ? 'text-white' : 'text-gray-600'}`}>
                        {step.label}
                      </span>
                    </div>

                    <span className={`text-xs font-semibold uppercase tracking-wider
                      ${done ? 'text-green-400' : active ? 'text-blue-400' : 'text-gray-600'}`}>
                      {done ? 'Complete' : active ? 'Running...' : 'Pending'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="ml-9">
                    <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-0.5 rounded-full"
                        style={{
                          background: done
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: done ? '100%' : active ? `${barWidths[i] || 60}%` : '0%' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom node info */}
          <div className="mt-8 pt-5 border-t border-gray-800 flex items-center justify-between">
            <div className="text-xs text-gray-600 font-mono uppercase tracking-widest">
              Node: <span className="text-gray-400">Satya-Core-01</span>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-blue-400'}`}>
                {isComplete ? 'Processing Complete' : `Step ${Math.min(currentStep + 1, STEPS.length)} / ${STEPS.length}`}
              </p>
              <p className="text-xs text-gray-600 uppercase tracking-widest">Estimated Completion</p>
            </div>
          </div>
        </motion.div>

        {/* Rotating quote */}
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="text-gray-500 text-xs text-center max-w-lg mt-8 italic leading-relaxed"
          >
            {QUOTES[quoteIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800/60 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm"><span className="text-blue-400">Satya</span>Scan AI</p>
          <p className="text-gray-600 text-xs">© 2024 SatyaScan AI. All rights reserved.</p>
        </div>
        <div className="flex gap-5 text-xs text-gray-500">
          {['About', 'Features', 'GitHub', 'Contact'].map((l) => (
            <a key={l} href="#" className="hover:text-gray-300 transition">{l}</a>
          ))}
          <span className="text-gray-700">© 2024 SatyaScan AI</span>
        </div>
      </div>
    </div>
  );
}
