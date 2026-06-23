import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeText, analyzeUrl, analyzeImage } from '../api/api';
import LoadingState from '../components/LoadingState';

const TABS = [
  { key: 'text', icon: '📝', label: 'Text Analysis' },
  { key: 'url', icon: '🔗', label: 'URL Analysis' },
  { key: 'image', icon: '🖼️', label: 'Image Analysis' },
];

const MAX_CHARS = 10000;

function useFakeProgress(active) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const delays = [3000, 7000, 15000, 30000, 45000];
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, [active]);
  return step;
}

// Inline shield SVG
function ShieldLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sg2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#sg2)" opacity="0.15" stroke="url(#sg2)" strokeWidth="2.5" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Arial,sans-serif" fill="url(#sg2)">S</text>
    </svg>
  );
}

export default function AnalyzePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState('text');
  const [textInput, setTextInput] = useState(location.state?.prefill || '');
  const [urlInput, setUrlInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const progressStep = useFakeProgress(loading);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (tab === 'text' && !textInput.trim()) return setError('Please enter some text to analyze.');
    if (tab === 'url' && !urlInput.trim()) return setError('Please enter a URL.');
    if (tab === 'image' && !imageFile) return setError('Please select an image file.');
    setLoading(true);
    try {
      let res;
      if (tab === 'text') res = await analyzeText(textInput);
      else if (tab === 'url') res = await analyzeUrl(urlInput);
      else res = await analyzeImage(imageFile);
      navigate('/results', { state: { result: res.data } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState currentStep={progressStep} />;

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <ShieldLogo size={24} />
          <span className="font-bold text-base tracking-tight">
            <span className="text-blue-400">Satya</span>Scan
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-gray-400">
          <button onClick={() => navigate('/history')} className="hover:text-white transition">History</button>
          <button onClick={() => navigate('/')} className="hover:text-white transition font-medium text-blue-400 border-b border-blue-400 pb-0.5">Dashboard</button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-6 pt-14 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-extrabold mb-2">
            Analyze <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-sm mb-10 max-w-xl">
            Deploy advanced neural forensic analysis on any content. SatyaScan provides deep-layer
            verification for text, URLs, and digital imagery.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm"
        >
          {/* Tab bar */}
          <div className="flex border-b border-gray-800">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-semibold uppercase tracking-widest transition-all duration-200 border-b-2 -mb-px
                  ${tab === t.key
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <AnimatePresence mode="wait">
              {tab === 'text' && (
                <motion.div key="text" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <div className="relative">
                    <textarea
                      rows={9}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value.slice(0, MAX_CHARS))}
                      placeholder="Paste article text or raw technical data for deep-scan analysis..."
                      className="w-full bg-gray-950/60 border border-gray-700/60 text-gray-200 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500/60 resize-none text-sm placeholder-gray-600 transition-colors"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Detecting language...
                      </span>
                      <span>{textInput.length} / {MAX_CHARS.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === 'url' && (
                <motion.div key="url" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔗</span>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/article-to-fact-check"
                      className="w-full bg-gray-950/60 border border-gray-700/60 text-gray-200 rounded-xl pl-10 pr-4 py-4 focus:outline-none focus:border-blue-500/60 text-sm placeholder-gray-600 transition-colors"
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-2 ml-1">
                    SatyaScan will scrape and analyze the full article text from the URL.
                  </p>
                </motion.div>
              )}

              {tab === 'image' && (
                <motion.div key="image" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
                      ${imageFile ? 'border-blue-500/60 bg-blue-500/5' : 'border-gray-700 hover:border-blue-500/40 hover:bg-white/5'}`}
                  >
                    {imageFile ? (
                      <div className="text-green-400 text-sm">
                        <div className="text-3xl mb-2">✅</div>
                        <p className="font-medium">{imageFile.name}</p>
                        <p className="text-gray-500 text-xs mt-1">{(imageFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-3">🖼️</div>
                        <p className="text-gray-400 text-sm font-medium">Click to upload or drag & drop</p>
                        <p className="text-gray-600 text-xs mt-1">PNG, JPG, WEBP — max 10 MB</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setImageFile(e.target.files[0] || null)} />
                  {imageFile && (
                    <button type="button" onClick={() => setImageFile(null)}
                      className="text-xs text-red-400 hover:underline mt-2 ml-1">
                      Remove file
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/30 border border-red-700/60 text-red-300 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </motion.div>
            )}

            {/* Footer row */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <div>
                  <p className="text-gray-600 uppercase tracking-wider mb-0.5">Confidence</p>
                  <p className="text-green-400 font-bold text-sm">24ms</p>
                </div>
                <div>
                  <p className="text-gray-600 uppercase tracking-wider mb-0.5">Model Version</p>
                  <p className="text-gray-300 font-medium">Satya-Neo v4.2</p>
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm uppercase tracking-wider"
              >
                <span>⚡</span> Analyze Content
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            All nodes operational
          </span>
          <span>Updated 3m ago</span>
        </motion.div>
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
        </div>
      </div>
    </div>
  );
}
