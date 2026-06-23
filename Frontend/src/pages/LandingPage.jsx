import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' },
  }),
};

// ── Animated section wrapper ───────────────────────────────────────────────────
function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stats counter ─────────────────────────────────────────────────────────────
const STATS = [
  { value: '1M+', label: 'Claims Verified', color: 'from-blue-400 to-cyan-400' },
  { value: '50k+', label: 'Trusted Sources', color: 'from-emerald-400 to-green-400' },
  { value: '<2s', label: 'Analysis Speed', color: 'from-amber-400 to-yellow-400' },
];

// ── Feature cards ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: '🔍',
    title: 'Advanced Fact Checking',
    desc: 'Real-time cross-referencing against global databases, scholarly journals, and official government records using natural language understanding.',
  },
  {
    icon: '🤖',
    title: 'AI Content Detection',
    desc: 'Identify LLM-generated text, synthetic audio, and deepfake imagery with 99.4% precision.',
  },
  {
    icon: '✅',
    title: 'Source Credibility',
    desc: 'Algorithmic scoring of domains and authors based on historical accuracy and bias metrics.',
  },
  {
    icon: '🌐',
    title: 'Multi-language Support',
    desc: 'Analyze content in 120+ languages with contextual nuance and automatic translation.',
  },
];

// ── HOW IT WORKS steps ────────────────────────────────────────────────────────
const STEPS = [
  { step: '01', title: 'Input Content', desc: 'Paste text, drop a URL, or upload an image.' },
  { step: '02', title: 'AI Analysis', desc: 'Mistral AI extracts claims and detects AI patterns.' },
  { step: '03', title: 'Source Verification', desc: 'Claims cross-checked against 50k+ trusted sources.' },
  { step: '04', title: 'Trust Score', desc: 'Receive a confidence-weighted verdict in under 2 seconds.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/analyze', { state: { prefill: searchValue } });
  };

  const goAnalyze = () => navigate('/analyze');

  const th = {
    bg: dark ? 'bg-[#030712]' : 'bg-slate-50',
    text: dark ? 'text-white' : 'text-gray-900',
    sub: dark ? 'text-gray-400' : 'text-gray-600',
    card: dark ? 'bg-gray-900/60 border-gray-700/60' : 'bg-white border-gray-200',
    cardHover: dark ? 'hover:border-blue-500/50 hover:bg-gray-900' : 'hover:border-blue-400 hover:bg-blue-50/40',
    nav: dark ? 'bg-[#030712]/90 border-gray-800' : 'bg-white/90 border-gray-200',
    statCard: dark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200',
    input: dark
      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500',
    badge: dark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600',
    cta: dark ? 'bg-gray-900 border-gray-700' : 'bg-gray-900 border-gray-700',
    stepCard: dark ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200',
  };

  return (
    <div className={`min-h-screen ${th.bg} ${th.text} transition-colors duration-300`}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${th.nav} border-b backdrop-blur-md px-6 py-3 flex items-center justify-between transition-colors duration-300`}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <span className={`font-bold text-xl tracking-tight cursor-pointer ${th.text}`} onClick={() => navigate('/')}>
            <span className="text-blue-500">Satya</span>Scan
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center gap-3">

          {/* Search bar → goes to /analyze */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => navigate('/analyze')}
                type="text"
                placeholder="Scan URL or text..."
                className={`pl-9 pr-4 py-1.5 rounded-lg border text-sm w-52 outline-none transition-all duration-200 ${th.input}`}
              />
            </div>
          </form>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${th.badge}`}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          <button
            onClick={goAnalyze}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            Analyze →
          </button>
        </motion.div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0}>
              <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border ${th.badge} mb-6`}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Next-Gen Truth Engine
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
            >
              Verify Information
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600">
                Before You Share It
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className={`text-lg ${th.sub} mb-8 max-w-lg mx-auto lg:mx-0`}
            >
              Combat deepfakes and misinformation with high-fidelity AI detection.
              SatyaScan cross-references 50k+ sources in milliseconds to ensure digital integrity.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={goAnalyze}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
              >
                Analyze Content →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={goAnalyze}
                className={`border font-semibold px-8 py-3 rounded-xl transition-colors ${dark ? 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white' : 'border-gray-400 text-gray-700 hover:border-gray-600 hover:text-gray-900'}`}
              >
                Get Started for Free
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="flex gap-6 mt-8 justify-center lg:justify-start"
            >
              {['SOC2 Compliant', 'E2E Encrypted', 'GDPR Ready'].map((tag) => (
                <span key={tag} className={`text-xs flex items-center gap-1.5 ${th.sub}`}>
                  <span className="text-green-400">✓</span> {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Hero visual cards */}
          <div className="flex-1 relative w-full max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="relative"
            >
              {/* Floating verified card */}
              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute -top-4 right-0 flex items-center gap-3 px-4 py-3 rounded-xl border ${th.card} shadow-xl`}
              >
                <span className="text-green-400 text-xl">✅</span>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Source Verified</p>
                  <p className="text-sm font-bold text-white">BBC News API</p>
                </div>
              </motion.div>

              {/* Main card */}
              <div className={`mt-12 rounded-2xl border ${th.card} p-6 backdrop-blur-sm shadow-2xl`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className={`ml-auto text-xs ${th.sub}`}>Analysis in progress…</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Claim Extraction', status: '✓', color: 'bg-green-500', w: 'w-full' },
                    { label: 'Source Matching', status: '✓', color: 'bg-green-500', w: 'w-4/5' },
                    { label: 'AI Detection', status: '…', color: 'bg-blue-500', w: 'w-3/5' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className={th.sub}>{item.label}</span>
                        <span className={item.status === '✓' ? 'text-green-400' : 'text-blue-400'}>{item.status}</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div
                          className={`h-1.5 rounded-full ${item.color}`}
                          initial={{ width: 0 }} animate={{ width: item.w }}
                          transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating AI confidence card */}
              <motion.div
                animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className={`absolute -bottom-4 left-0 flex items-center gap-3 px-4 py-3 rounded-xl border ${th.card} shadow-xl`}
              >
                <span className="text-blue-400 text-xl">🤖</span>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">AI Confidence</p>
                  <p className="text-sm font-bold text-white">99.8% Genuine</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <AnimatedSection className="py-12 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label} variants={scaleIn} custom={i}
              className={`${th.statCard} border rounded-xl p-6 text-center`}
            >
              <p className={`text-4xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-1`}>
                {s.value}
              </p>
              <p className={`text-xs uppercase tracking-widest ${th.sub}`}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── Features ── */}
      <AnimatedSection className="py-20 px-6 max-w-6xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 className={`text-4xl font-extrabold mb-3 ${th.text}`}>
            Precision-Engineered{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Detection</span>
          </h2>
          <p className={`${th.sub} max-w-xl mx-auto`}>
            Our multi-layered analysis protocol identifies discrepancies that the human eye and traditional filters miss.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title} variants={scaleIn} custom={i}
              whileHover={{ y: -4 }}
              className={`${th.card} ${th.cardHover} border rounded-2xl p-6 cursor-pointer transition-all duration-200`}
            >
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className={`text-lg font-bold mb-2 ${th.text}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${th.sub}`}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── How It Works ── */}
      <AnimatedSection className="py-20 px-6 max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 className={`text-4xl font-extrabold mb-3 ${th.text}`}>How It Works</h2>
          <p className={`${th.sub}`}>Four steps from input to verified truth.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step} variants={fadeUp} custom={i}
              className={`${th.stepCard} border rounded-2xl p-5 relative`}
            >
              <p className="text-4xl font-black text-blue-500/20 mb-3">{s.step}</p>
              <h3 className={`font-bold text-base mb-1 ${th.text}`}>{s.title}</h3>
              <p className={`text-sm ${th.sub}`}>{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-gray-600 text-xl z-10">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection className="py-20 px-6">
        <motion.div
          variants={scaleIn}
          className="max-w-2xl mx-auto text-center bg-gradient-to-br from-gray-900 via-blue-950/40 to-gray-900 border border-blue-500/20 rounded-3xl p-12 shadow-2xl"
        >
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Ready to secure the truth?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of researchers and organizations relying on SatyaScan for digital verification.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={goAnalyze}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              Get Started for Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={goAnalyze}
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Contact Sales
            </motion.button>
          </div>
        </motion.div>
      </AnimatedSection>

      {/* ── Footer ── */}
      <footer className={`border-t ${dark ? 'border-gray-800' : 'border-gray-200'} px-6 py-8`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-lg">
              <span className="text-blue-500">Satya</span>Scan
            </p>
            <p className={`text-xs ${th.sub}`}>© 2024 SatyaScan AI. All rights reserved.</p>
          </div>
          <div className={`flex gap-6 text-sm ${th.sub}`}>
            {['About', 'Features', 'GitHub', 'Contact'].map((l) => (
              <a key={l} href="#" className="hover:text-blue-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
