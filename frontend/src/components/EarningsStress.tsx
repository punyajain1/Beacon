'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Mic,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BarChart2,
  FileText,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';

const API = 'http://localhost:4000/api';

const LOADING_STEPS = [
  'Downloading audio...',
  'Transcribing with Whisper...',
  'Analyzing stress...',
  'Fetching price data...',
];

function StressGauge({ score }: { score: number }) {
  const radius = 80;
  const circumference = Math.PI * radius; // half-circle arc
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const color =
    clampedScore < 30 ? '#22c55e' : clampedScore < 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="#374151"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
        {/* Score text */}
        <text x="100" y="88" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>
          {clampedScore}
        </text>
        <text x="100" y="105" textAnchor="middle" fontSize="11" fill="#9ca3af">
          STRESS SCORE
        </text>
      </svg>
      <div
        className="mt-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color }}
      >
        {clampedScore < 30 ? 'Low' : clampedScore < 60 ? 'Moderate' : 'High'}
      </div>
    </div>
  );
}

function PriceBadge({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null || pct === undefined)
    return (
      <div className="flex flex-col items-center bg-gray-800 rounded-xl p-4 min-w-[100px]">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-gray-500 mt-1">—</span>
      </div>
    );

  const up = pct >= 0;
  return (
    <div
      className={`flex flex-col items-center rounded-xl p-4 min-w-[100px] ${
        up ? 'bg-green-900/40 border border-green-700' : 'bg-red-900/40 border border-red-700'
      }`}
    >
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1 mt-1">
        {up ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
        <span className={`text-lg font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
          {up ? '+' : ''}
          {pct.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col items-center gap-2 min-w-[110px]">
      <div className="text-blue-400">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 text-center">{label}</div>
    </div>
  );
}

function HighlightedTranscript({
  transcript,
  passages,
}: {
  transcript: string;
  passages: Array<{ quote: string; reason: string }>;
}) {
  if (!transcript) return null;

  let result = transcript;
  const highlights: { start: number; end: number; reason: string }[] = [];

  for (const p of passages) {
    const idx = result.indexOf(p.quote);
    if (idx !== -1) {
      highlights.push({ start: idx, end: idx + p.quote.length, reason: p.reason });
    }
  }

  if (highlights.length === 0) return <p className="text-gray-300 text-sm whitespace-pre-wrap">{transcript}</p>;

  highlights.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const h of highlights) {
    if (h.start > cursor) {
      parts.push(
        <span key={cursor} className="text-gray-300">
          {transcript.slice(cursor, h.start)}
        </span>
      );
    }
    parts.push(
      <span
        key={h.start}
        className="bg-red-900/50 text-red-300 rounded px-0.5"
        title={h.reason}
      >
        {transcript.slice(h.start, h.end)}
      </span>
    );
    cursor = h.end;
  }
  if (cursor < transcript.length) {
    parts.push(
      <span key={cursor} className="text-gray-300">
        {transcript.slice(cursor)}
      </span>
    );
  }

  return <p className="text-sm whitespace-pre-wrap leading-relaxed">{parts}</p>;
}

const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
        <p className="font-bold text-white">{d.ticker}</p>
        <p className="text-gray-400">{new Date(d.callDate).toLocaleDateString()}</p>
        <p className="text-yellow-400">Stress: {d.stressScore}</p>
        <p className={d.moveT5Pct >= 0 ? 'text-green-400' : 'text-red-400'}>
          T+5 Move: {d.moveT5Pct?.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

export function EarningsStress() {
  const [ticker, setTicker] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [callDate, setCallDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any[]>([]);

  const fetchCompareData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/earnings/compare`);
      const json = await res.json();
      if (json.success) setCompareData(json.data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchCompareData();
  }, [fetchCompareData]);

  const fetchHistory = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API}/earnings/${encodeURIComponent(t.toUpperCase())}`);
      const json = await res.json();
      if (json.success) setHistory(json.data);
    } catch {
      /* silent */
    }
  }, []);

  const handleAnalyze = async () => {
    if (!ticker || !audioUrl || !callDate) {
      setError('Please fill in ticker, audio URL and date.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingStep(0);

    // Animate steps
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 3000);

    try {
      const res = await fetch(`${API}/earnings/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.toUpperCase(), audioUrl, callDate }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Analysis failed');
      setResult(json.data);
      await fetchHistory(ticker);
      await fetchCompareData();
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingStep(2);
    try {
      const res = await fetch(`${API}/earnings/demo`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Demo analysis failed');
      setTicker(json.data.ticker || 'AAPL');
      setResult(json.data);
      await fetchHistory(json.data.ticker || 'AAPL');
      await fetchCompareData();
    } catch (e: any) {
      setError(e.message || 'Demo failed');
    } finally {
      setLoading(false);
    }
  };

  const passages: Array<{ quote: string; reason: string }> = result?.stressPassages ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Mic className="w-7 h-7 text-blue-400" />
          <h1 className="text-2xl font-bold">Earnings Call Stress Detector</h1>
        </div>

        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">Analyze a Call</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ticker Symbol</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                placeholder="e.g. AAPL"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs text-gray-400 mb-1 block">Audio URL</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Call Date</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={callDate}
                onChange={(e) => setCallDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold text-emerald-300 transition-colors"
            >
              Run Demo Call
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Loading Steps */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-900 rounded-2xl p-6 space-y-3"
            >
              {LOADING_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-500 ${
                      i < loadingStep
                        ? 'bg-green-500'
                        : i === loadingStep
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-gray-700'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      i <= loadingStep ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Stress Gauge + Stats */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Analysis Results — {result.ticker}</h2>
                <div className="flex flex-wrap items-center justify-around gap-6">
                  <StressGauge score={result.stressScore ?? 0} />
                  <div className="flex flex-wrap gap-4">
                    <StatCard
                      label="Hedge Words"
                      value={result.hedgeWordCount ?? 0}
                      icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                      label="Self-Corrections"
                      value={result.correctionCount ?? 0}
                      icon={<RefreshCw className="w-5 h-5" />}
                    />
                    <StatCard
                      label="Sentiment"
                      value={result.sentimentLabel ?? '—'}
                      icon={<BarChart2 className="w-5 h-5" />}
                    />
                  </div>
                </div>
              </div>

              {/* Price Impact */}
              <div className="bg-gray-900 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Price Impact</h2>
                <div className="flex gap-4 flex-wrap">
                  <PriceBadge label="T+1 Move" pct={result.moveT1Pct} />
                  <PriceBadge label="T+5 Move" pct={result.moveT5Pct} />
                  {result.priceT0 && (
                    <div className="flex flex-col items-center bg-gray-800 rounded-xl p-4 min-w-[100px]">
                      <span className="text-xs text-gray-400">Price at Call</span>
                      <span className="text-lg font-bold text-white mt-1">
                        ${Number(result.priceT0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stress Passages */}
              {passages.length > 0 && (
                <div className="bg-gray-900 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" /> Stress Passages
                  </h2>
                  <div className="space-y-3">
                    {passages.map((p, i) => (
                      <div
                        key={i}
                        className="border-l-4 border-red-500 pl-4 bg-red-900/20 rounded-r-lg py-3 pr-3"
                      >
                        <p className="text-red-300 italic text-sm mb-1">"{p.quote}"</p>
                        <p className="text-gray-400 text-xs">{p.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Accordion */}
              {result.transcript && (
                <div className="bg-gray-900 rounded-2xl p-6">
                  <button
                    onClick={() => setTranscriptOpen((o) => !o)}
                    className="flex items-center justify-between w-full"
                  >
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" /> Full Transcript
                    </h2>
                    {transcriptOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <AnimatePresence>
                    {transcriptOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 max-h-96 overflow-y-auto pr-2">
                          <HighlightedTranscript
                            transcript={result.transcript}
                            passages={passages}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Table */}
        {history.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              History — {ticker.toUpperCase()}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left pb-2">Ticker</th>
                    <th className="text-left pb-2">Date</th>
                    <th className="text-right pb-2">Stress</th>
                    <th className="text-right pb-2">T+5 Move</th>
                    <th className="text-right pb-2">Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-2 font-semibold">{h.ticker}</td>
                      <td className="py-2 text-gray-400">
                        {new Date(h.callDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            (h.stressScore ?? 0) < 30
                              ? 'bg-green-900/60 text-green-400'
                              : (h.stressScore ?? 0) < 60
                              ? 'bg-yellow-900/60 text-yellow-400'
                              : 'bg-red-900/60 text-red-400'
                          }`}
                        >
                          {h.stressScore ?? '—'}
                        </span>
                      </td>
                      <td
                        className={`py-2 text-right font-semibold ${
                          h.moveT5Pct == null
                            ? 'text-gray-500'
                            : h.moveT5Pct >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {h.moveT5Pct != null
                          ? `${h.moveT5Pct >= 0 ? '+' : ''}${Number(h.moveT5Pct).toFixed(2)}%`
                          : '—'}
                      </td>
                      <td className="py-2 text-right text-gray-400 capitalize">
                        {h.sentimentLabel ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scatter Chart */}
        {compareData.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Stress Score vs. T+5 Price Move
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  dataKey="stressScore"
                  domain={[0, 100]}
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                >
                  <Label value="Stress Score" offset={-10} position="insideBottom" fill="#9ca3af" fontSize={12} />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="moveT5Pct"
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                >
                  <Label value="T+5 Move %" angle={-90} position="insideLeft" fill="#9ca3af" fontSize={12} />
                </YAxis>
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter
                  data={compareData}
                  fill="#60a5fa"
                  opacity={0.8}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
