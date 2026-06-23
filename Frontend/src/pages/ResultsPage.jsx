import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import ShareModal from '../components/ShareModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrustColor(score) {
  if (score >= 70) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getTrustLabel(score) {
  if (score >= 70) return 'Trusted';
  if (score >= 40) return 'Questionable';
  return 'Low Trust';
}

function getVerdictColor(verdict) {
  const map = {
    Supported: '#22c55e', True: '#22c55e',
    Contradicted: '#ef4444', False: '#ef4444', Misleading: '#f97316',
    Unverified: '#6b7280',
  };
  return map[verdict] || '#6b7280';
}

function getConfidenceColor(verdict, conf) {
  if (verdict === 'Supported') return conf >= 75 ? '#22c55e' : '#86efac';
  if (verdict === 'Contradicted') return conf >= 75 ? '#ef4444' : '#fca5a5';
  return conf <= 20 ? '#374151' : '#6b7280';
}

function getConfidenceLabel(conf) {
  if (conf >= 90) return 'Very High';
  if (conf >= 75) return 'High';
  if (conf >= 50) return 'Moderate';
  if (conf >= 20) return 'Low';
  return 'Very Low';
}

// Inline shield logo
function ShieldLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="sg3" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#sg3)" opacity="0.15" stroke="url(#sg3)" strokeWidth="2.5" />
      <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="800"
        fontFamily="Arial,sans-serif" fill="url(#sg3)">S</text>
    </svg>
  );
}

// ─── Trust Score Gauge ────────────────────────────────────────────────────────

function TrustGauge({ score }) {
  const color = getTrustColor(score);
  const label = getTrustLabel(score);
  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-semibold">Trust Reputation Score</p>
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
            startAngle={90} endAngle={-270} data={[{ value: score }]}>
            <RadialBar background={{ fill: '#1f2937' }} dataKey="value"
              cornerRadius={6} fill={color} max={100} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white">{score}</span>
          <span className="text-xs text-gray-500 mt-1">/ 100</span>
        </div>
      </div>
      <span className="mt-3 text-sm font-bold" style={{ color }}>{label}</span>
      <p className="text-xs text-gray-500 mt-1 text-center max-w-[140px]">
        Verified across 4 distinct security modules.
      </p>
    </div>
  );
}

// ─── Verification Vectors ─────────────────────────────────────────────────────

function VerificationVectors({ aiLikelihood, aiScore, sourceCredibility, trustScore }) {
  const vectors = [
    { name: 'Accuracy', value: Math.round(trustScore), color: '#22c55e' },
    { name: 'AI Content Probability', value: aiLikelihood, color: aiLikelihood > 60 ? '#ef4444' : '#3b82f6' },
    { name: 'Source Trust', value: Math.round(sourceCredibility), color: '#3b82f6' },
    { name: 'Evidence Strength', value: Math.round(aiScore ?? (100 - aiLikelihood)), color: '#f59e0b' },
  ];
  return (
    <div className="flex-1">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-5 font-semibold">Verification Vectors</p>
      <div className="space-y-3">
        {vectors.map((v) => (
          <div key={v.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{v.name}</span>
              <span className="font-bold text-white">{v.value}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full">
              <motion.div
                className="h-1.5 rounded-full"
                style={{ background: v.color }}
                initial={{ width: 0 }}
                animate={{ width: `${v.value}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Origin Analysis ──────────────────────────────────────────────────────────

function OriginAnalysis({ aiLikelihood, aiReasoning }) {
  const isHuman = aiLikelihood < 45;
  const isMixed = aiLikelihood >= 45 && aiLikelihood < 70;
  const color = isHuman ? '#22c55e' : isMixed ? '#f59e0b' : '#ef4444';
  const label = isHuman ? 'Likely Human' : isMixed ? 'Likely Mixed' : 'Likely AI-Generated';

  return (
    <div className="bg-[#030712] border border-green-500/20 rounded-xl p-5 flex-1">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-semibold">Origin Analysis</p>
      <div className="mb-4">
        <span className="text-4xl font-black" style={{ color }}>{aiLikelihood}%</span>
        <span className="ml-3 text-sm font-semibold" style={{ color }}>{label}</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">
        {aiReasoning || 'Analysis of sentence structure and linguistic entropy patterns.'}
      </p>
      <div className="mt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Neural Confidence Meter</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}
              className="h-2 flex-1 rounded-sm"
              style={{ background: i < Math.round(aiLikelihood / 10) ? color : '#1f2937' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Claim Card ───────────────────────────────────────────────────────────────

function ClaimCard({ claim, index }) {
  const [open, setOpen] = useState(false);
  const color = getVerdictColor(claim.verdict);
  const hasConf = typeof claim.confidence === 'number';
  const confColor = hasConf ? getConfidenceColor(claim.verdict, claim.confidence) : color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="border border-gray-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-gray-800/40 transition"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0.5 text-base shrink-0" style={{ color }}>
            {claim.verdict === 'Supported' ? '✅' : claim.verdict === 'Contradicted' ? '❌' : '❓'}
          </span>
          <span className="text-gray-200 text-sm leading-relaxed">"{claim.text}"</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full block"
              style={{ background: color + '20', color }}>
              {claim.verdict}
            </span>
            {hasConf && (
              <span className="text-xs font-mono mt-0.5 block" style={{ color: confColor }}>
                {claim.confidence}%
              </span>
            )}
          </div>
          <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-800 bg-gray-900/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
                {/* Rationale */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">Rationale</p>

                  {/* Confidence bar */}
                  {hasConf && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Confidence</span>
                        <span className="font-bold" style={{ color: confColor }}>
                          {claim.confidence}% — {getConfidenceLabel(claim.confidence)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full">
                        <motion.div className="h-1.5 rounded-full"
                          style={{ background: confColor, width: `${claim.confidence}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${claim.confidence}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  )}

                  {(claim.sourceCount > 0 || claim.trustedSourceCount > 0) && (
                    <div className="flex gap-2 flex-wrap mb-3">
                      {claim.sourceCount > 0 && (
                        <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                          📄 {claim.sourceCount} source{claim.sourceCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {claim.trustedSourceCount > 0 && (
                        <span className="text-xs bg-blue-900/30 border border-blue-800 text-blue-400 px-2 py-0.5 rounded-full">
                          ✓ {claim.trustedSourceCount} trusted
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-300 leading-relaxed">
                    {claim.reasoning || '—'}
                  </p>
                </div>

                {/* Peer verification / sources */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">
                    Peer Verification
                  </p>
                  {claim.sources?.length > 0 ? (
                    <ul className="space-y-2">
                      {claim.sources.slice(0, 5).map((src, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          {src.trusted && (
                            <span className="text-blue-400 shrink-0 mt-0.5">✓</span>
                          )}
                          <div className="min-w-0">
                            <a href={src.url || src} target="_blank" rel="noopener noreferrer"
                              className="text-blue-400 hover:underline font-medium truncate block">
                              {src.title || src.url || src}
                            </a>
                            {src.source && <span className="text-gray-600">— {src.source}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-xs">No sources available for this claim.</p>
                  )}
                  {claim.sources?.length > 0 && (
                    <p className="text-gray-600 text-xs mt-3">
                      Analyzed by {claim.sources.length} independent validation node{claim.sources.length !== 1 ? 's' : ''}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Source Trust Cards ───────────────────────────────────────────────────────

function SourceTrustCard({ name, trust, icon }) {
  const color = trust >= 90 ? '#22c55e' : trust >= 70 ? '#3b82f6' : '#f59e0b';
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="font-bold text-white text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 w-24 bg-gray-800 rounded-full">
          <div className="h-1 rounded-full" style={{ width: `${trust}%`, background: color }} />
        </div>
        <span className="text-xs font-bold" style={{ color }}>{trust}% Trust</span>
        <a href="#" className="text-gray-600 hover:text-gray-400 text-xs">↗</a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);

  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-center px-4">
        <ShieldLogo size={48} />
        <p className="text-gray-400 mt-4 mb-4">No results to display. Please run an analysis first.</p>
        <Link to="/analyze" className="text-blue-400 hover:underline text-sm">← Back to Analyze</Link>
      </div>
    );
  }

  const {
    inputType, trustScore, aiLikelihood, aiScore, aiReasoning,
    sourceCredibility, language, claims = [], checkId, apiWorking,
  } = result;

  const supported = claims.filter(c => ['Supported', 'True'].includes(c.verdict)).length;
  const contradicted = claims.filter(c => ['Contradicted', 'False', 'Misleading'].includes(c.verdict)).length;
  const unverified = claims.length - supported - contradicted;
  const avgConf = claims.length
    ? Math.round(claims.reduce((s, c) => s + (c.confidence ?? 50), 0) / claims.length)
    : 0;

  // Pick top 2 trusted sources across all claims for the source trust panel
  const allSources = claims.flatMap(c => c.sources || []);
  const topSources = [...new Map(allSources.filter(s => s.trusted).map(s => [s.source, s])).values()].slice(0, 2);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <ShieldLogo size={24} />
          <span className="font-bold text-base tracking-tight">
            <span className="text-blue-400">Satya</span>Scan
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="hidden sm:flex items-center border border-gray-700 rounded-lg px-3 py-1.5 bg-gray-900/60 gap-2 text-sm text-gray-500">
            <span>🔍</span>
            <span>Search URL or text...</span>
          </div>
          {/* Nav links */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <button onClick={() => navigate('/')} className="hover:text-white transition">Dashboard</button>
            <button onClick={() => navigate('/analyze')} className="hover:text-white transition text-blue-400 border-b border-blue-400 pb-0.5">New Analysis</button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* API warning */}
        {apiWorking === false && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-900/20 border border-amber-600/40 rounded-xl px-5 py-4">
            <p className="text-amber-300 text-sm font-semibold">⚠️ API Keys Not Working — Showing Fallback Data</p>
            <p className="text-amber-400/70 text-xs mt-1">
              Scores below may be placeholder defaults. Update your <code>Backend/.env</code> with a valid Mistral API key and restart the server.
            </p>
          </motion.div>
        )}

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Results Dashboard</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              {inputType && (
                <span className="text-xs border border-gray-700 text-gray-400 px-2 py-1 rounded-full">
                  {inputType === 'text' ? '📝' : inputType === 'url' ? '🔗' : '🖼️'} {inputType} analysis
                </span>
              )}
              {language && language !== 'unknown' && (
                <span className="text-xs border border-blue-800 text-blue-400 bg-blue-900/20 px-2 py-1 rounded-full">
                  🌐 {language.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/analyze')}
              className="text-sm border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white px-4 py-2 rounded-lg transition">
              ← New Analysis
            </button>
            {checkId && (
              <button onClick={() => setShowShare(true)}
                className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition border border-gray-700">
                Share / PDF
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Row 1: Trust Gauge + Vectors + Origin ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Trust gauge */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center">
            <TrustGauge score={trustScore} />
          </motion.div>

          {/* Verification vectors */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <VerificationVectors
              aiLikelihood={aiLikelihood} aiScore={aiScore}
              sourceCredibility={sourceCredibility} trustScore={trustScore}
            />
          </motion.div>

          {/* Origin analysis */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <OriginAnalysis aiLikelihood={aiLikelihood} aiReasoning={aiReasoning} />
          </motion.div>
        </div>

        {/* ── Evidence Verification ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <span className="text-blue-400">📋</span> Evidence Verification
            </h2>
            <div className="flex gap-2">
              {supported > 0 && (
                <span className="text-xs bg-green-900/30 border border-green-800 text-green-400 px-2 py-1 rounded-full font-bold">
                  {supported} Supported
                </span>
              )}
              {contradicted > 0 && (
                <span className="text-xs bg-red-900/30 border border-red-800 text-red-400 px-2 py-1 rounded-full font-bold">
                  {contradicted} Disputed
                </span>
              )}
              {unverified > 0 && (
                <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded-full">
                  {unverified} Unverified
                </span>
              )}
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-10 border border-gray-800 rounded-xl">
              No factual claims could be extracted. Try a longer news-style paragraph with specific facts.
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim, i) => <ClaimCard key={i} claim={claim} index={i} />)}
            </div>
          )}
        </motion.div>

        {/* ── Source Trust Panel ── */}
        {topSources.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topSources.map((src, i) => (
                <SourceTrustCard
                  key={i}
                  name={src.source || 'Trusted Source'}
                  trust={src.source?.toLowerCase().includes('bbc') ? 98 : src.source?.toLowerCase().includes('reuters') ? 99 : 90}
                  icon={src.source?.toLowerCase().includes('bbc') ? '📺' : '🌐'}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        {checkId && (
          <p className="text-gray-600 text-xs text-center pt-2">
            Check ID: <code className="text-gray-500">{checkId}</code>
            {' · '}
            <a href={`/report/${checkId}`} target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:underline">Public report link</a>
          </p>
        )}
      </div>

      {/* Footer bar */}
      <div className="border-t border-gray-800/60 px-8 py-5 flex items-center justify-between mt-4">
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

      {showShare && checkId && (
        <ShareModal checkId={checkId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
