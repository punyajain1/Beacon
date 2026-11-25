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
  Sparkles,
  Activity,
  Award,
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
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

const API = 'http://localhost:4000/api';

const LOADING_STEPS = [
  'Downloading audio stream...',
  'Transcribing executive remarks with Whisper...',
  'Scoring vocal & linguistic stress markers...',
  'Fetching T+1 / T+5 post-call price drift...',
];

function getStressTone(score: number) {
  if (score < 30) {
    return {
      color: '#22c55e',
      label: 'Low Stress',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
  }
  if (score < 60) {
    return {
      color: '#eab308',
      label: 'Moderate Stress',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
  }
  return {
    color: '#ef4444',
    label: 'High Stress',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
}

function StressGauge({ score }: { score: number }) {
  const radius = 80;
  const circumference = Math.PI * radius; // exact half-circle arc for r=80
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;
  const tone = getStressTone(clampedScore);

  return (
    <div className="flex flex-col items-center">
      <svg width="210" height="122" viewBox="0 0 200 118">
        {/* Background arc: center (100,100), r=80 -> M 20 100 A 80 80 0 0 1 180 100 */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={tone.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s ease' }}
        />
        {/* Scale end labels */}
        <text x="20" y="116" textAnchor="middle" fontSize="10" fill="#71717a">
          0
        </text>
        <text x="180" y="116" textAnchor="middle" fontSize="10" fill="#71717a">
          100
        </text>
        {/* Score text */}
        <text x="100" y="82" textAnchor="middle" fontSize="30" fontWeight="700" fill={tone.color}>
          {clampedScore}
        </text>
        <text x="100" y="100" textAnchor="middle" fontSize="10" letterSpacing="1.5" fill="#a1a1aa">
          STRESS INDEX
        </text>
      </svg>
      <span
        className={cn(
          'mt-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
          tone.badge
        )}
      >
        {tone.label}
      </span>
    </div>
  );
}

function PriceBadge({ label, pct }: { label: string; pct: number | null | undefined }) {
  if (pct === null || pct === undefined) {
    return (
      <div className="flex flex-col justify-between bg-secondary/30 border border-border rounded-xl p-4">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </span>
        <span className="text-lg font-bold text-muted-foreground mt-2">—</span>
      </div>
    );
  }

  const up = pct >= 0;
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-xl p-4 border',
        up
          ? 'bg-emerald-500/10 border-emerald-500/25'
          : 'bg-red-500/10 border-red-500/25'
      )}
    >
      <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1.5 mt-2">
        {up ? (
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
        )}
        <span className={cn('text-xl font-bold', up ? 'text-emerald-400' : 'text-red-400')}>
          {up ? '+' : ''}
          {Number(pct).toFixed(2)}%
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
    <div className="bg-secondary/25 border border-border rounded-xl p-4 flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-foreground capitalize">{value}</div>
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

  const highlights: { start: number; end: number; reason: string }[] = [];

  for (const p of passages) {
    const idx = transcript.indexOf(p.quote);
    if (idx !== -1) {
      highlights.push({ start: idx, end: idx + p.quote.length, reason: p.reason });
    }
  }

  if (highlights.length === 0) {
    return <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{transcript}</p>;
  }

  highlights.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const h of highlights) {
    if (h.start > cursor) {
      parts.push(
        <span key={cursor} className="text-muted-foreground">
          {transcript.slice(cursor, h.start)}
        </span>
      );
    }
    parts.push(
      <span
        key={h.start}
        className="bg-red-500/20 text-red-300 border-b border-red-500/50 rounded px-1"
        title={h.reason}
      >
        {transcript.slice(h.start, h.end)}
      </span>
    );
    cursor = h.end;
  }
  if (cursor < transcript.length) {
    parts.push(
      <span key={cursor} className="text-muted-foreground">
        {transcript.slice(cursor)}
      </span>
    );
  }

  return <p className="text-sm whitespace-pre-wrap leading-relaxed">{parts}</p>;
}

interface StressPassage {
  quote: string;
  reason: string;
}

interface EarningsCallRecord {
  id: string;
  ticker: string;
  callDate: string;
  stressScore: number;
  hedgeWordCount?: number;
  correctionCount?: number;
  sentimentLabel?: string | null;
  priceT0?: number | null;
  moveT1Pct?: number | null;
  moveT5Pct?: number | null;
  stressPassages?: StressPassage[] | null;
  transcript?: string | null;
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: EarningsCallRecord }>;
}

const CustomScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-xl p-3 text-xs shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="font-bold font-mono text-foreground">{d.ticker}</span>
          <span className="text-muted-foreground">
            {new Date(d.callDate).toLocaleDateString()}
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-primary font-medium">Stress Score: {d.stressScore}</p>
          <p className={(d.moveT5Pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            T+5 Move: {(d.moveT5Pct ?? 0) >= 0 ? '+' : ''}
            {Number(d.moveT5Pct ?? 0).toFixed(2)}%
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function EarningsStress({ className }: { className?: string }) {
  const [ticker, setTicker] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [callDate, setCallDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<EarningsCallRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [history, setHistory] = useState<EarningsCallRecord[]>([]);
  const [compareData, setCompareData] = useState<EarningsCallRecord[]>([]);
  const [topStressed, setTopStressed] = useState<EarningsCallRecord[]>([]);

  const fetchMarketOverview = useCallback(async () => {
    try {
      const [compareRes, topRes] = await Promise.all([
        fetch(`${API}/earnings/compare`),
        fetch(`${API}/earnings/top?limit=8`),
      ]);
      const compareJson = await compareRes.json();
      if (compareJson.success) setCompareData(compareJson.data ?? []);
      const topJson = await topRes.json();
      if (topJson.success) setTopStressed(topJson.data ?? []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [compareRes, topRes] = await Promise.all([
          fetch(`${API}/earnings/compare`),
          fetch(`${API}/earnings/top?limit=8`),
        ]);
        const compareJson = await compareRes.json();
        if (!cancelled && compareJson.success) setCompareData(compareJson.data ?? []);
        const topJson = await topRes.json();
        if (!cancelled && topJson.success) setTopStressed(topJson.data ?? []);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchHistory = useCallback(async (t: string) => {
    if (!t) return;
    try {
      const res = await fetch(`${API}/earnings/${encodeURIComponent(t.toUpperCase())}`);
      const json = await res.json();
      if (json.success) setHistory(json.data ?? []);
    } catch {
      /* silent */
    }
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticker || !audioUrl || !callDate) {
      setError('Please fill in ticker symbol, audio URL, and call date.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingStep(0);

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
      await Promise.all([fetchHistory(ticker), fetchMarketOverview()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
      const demoTicker = json.data.ticker || 'AAPL';
      setTicker(demoTicker);
      setResult(json.data);
      await Promise.all([fetchHistory(demoTicker), fetchMarketOverview()]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo failed');
    } finally {
      setLoading(false);
    }
  };

  const passages: Array<{ quote: string; reason: string }> = result?.stressPassages ?? [];

  return (
    <div className={cn('flex flex-col gap-6 w-full', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Earnings Call Stress Detector
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyze executive speech hedging &amp; self-corrections against post-earnings T+1 and T+5 price moves.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Run Demo Call
        </button>
      </div>

      {/* Input Form Card */}
      <form
        onSubmit={handleAnalyze}
        className="bg-card border border-border rounded-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Analyze Earnings Call
          </h2>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Whisper transcription + FinBERT / LLM stress scoring
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Ticker Symbol
            </label>
            <input
              className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 uppercase font-mono tracking-wider transition-colors"
              placeholder="e.g. AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
          </div>

          <div className="md:col-span-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Audio URL
            </label>
            <input
              className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="https://example.com/q4-call.mp3"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Call Date
            </label>
            <input
              type="date"
              className="w-full bg-secondary/60 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-primary/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Loading Steps */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-xl p-6 space-y-3"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Processing Pipeline
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                    i < loadingStep
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : i === loadingStep
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-secondary/20 border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0',
                      i < loadingStep
                        ? 'bg-emerald-400'
                        : i === loadingStep
                        ? 'bg-primary animate-pulse'
                        : 'bg-secondary'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      i <= loadingStep ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Gauge + Metrics + Price Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Analysis Result
                  </span>
                  <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                    {result.ticker}
                  </span>
                </div>
                <StressGauge score={result.stressScore ?? 0} />
              </div>

              <div className="lg:col-span-7 bg-card border border-border rounded-xl p-6 flex flex-col justify-between gap-5">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Linguistic &amp; Sentiment Breakdown
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                      label="Hedge Words"
                      value={result.hedgeWordCount ?? 0}
                      icon={<AlertTriangle className="w-4 h-4" />}
                    />
                    <StatCard
                      label="Self-Corrections"
                      value={result.correctionCount ?? 0}
                      icon={<RefreshCw className="w-4 h-4" />}
                    />
                    <StatCard
                      label="Sentiment"
                      value={result.sentimentLabel ?? '—'}
                      icon={<BarChart2 className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Post-Call Price Impact
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <PriceBadge label="T+1 Move" pct={result.moveT1Pct} />
                    <PriceBadge label="T+5 Move" pct={result.moveT5Pct} />
                    <div className="flex flex-col justify-between bg-secondary/25 border border-border rounded-xl p-4">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Price at Call
                      </span>
                      <span className="text-xl font-bold text-foreground mt-2">
                        {result.priceT0 ? `$${Number(result.priceT0).toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stress Passages */}
            {passages.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Flagged Stress Passages ({passages.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {passages.map((p, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-red-500 pl-4 bg-red-500/10 rounded-r-xl py-3 pr-4"
                    >
                      <p className="text-red-300 italic text-sm mb-1.5">&ldquo;{p.quote}&rdquo;</p>
                      <p className="text-muted-foreground text-xs">{p.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript Accordion */}
            {result.transcript && (
              <div className="bg-card border border-border rounded-xl p-6">
                <button
                  onClick={() => setTranscriptOpen((o) => !o)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Full Call Transcript
                  </h2>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {transcriptOpen ? 'Collapse' : 'Expand'}
                    {transcriptOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>
                <AnimatePresence>
                  {transcriptOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border max-h-96 overflow-y-auto custom-scrollbar pr-2">
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

      {/* Bottom Analytics Grid: Scatter Chart + History / Top Stressed Leaderboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Scatter Chart */}
        <div
          className={cn(
            'bg-card border border-border rounded-xl p-6 flex flex-col',
            history.length > 0 || topStressed.length > 0 ? 'xl:col-span-7' : 'xl:col-span-12'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Stress Score vs. T+5 Price Move
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cross-call correlation between vocal stress index and 5-day post-earnings return
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-secondary border border-border text-muted-foreground">
              {compareData.length} call{compareData.length !== 1 ? 's' : ''} plotted
            </span>
          </div>

          {compareData.length > 0 ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 20, bottom: 28, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                  <XAxis
                    type="number"
                    dataKey="stressScore"
                    domain={[0, 100]}
                    stroke="#52525b"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  >
                    <Label
                      value="Stress Score"
                      offset={-14}
                      position="insideBottom"
                      fill="#a1a1aa"
                      fontSize={11}
                    />
                  </XAxis>
                  <YAxis
                    type="number"
                    dataKey="moveT5Pct"
                    stroke="#52525b"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  >
                    <Label
                      value="T+5 Move %"
                      angle={-90}
                      position="insideLeft"
                      fill="#a1a1aa"
                      fontSize={11}
                      style={{ textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip
                    content={<CustomScatterTooltip />}
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(190,242,100,0.4)' }}
                  />
                  <Scatter data={compareData} fill="#bef264" fillOpacity={0.9} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-secondary/10 px-6">
              <BarChart2 className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">No comparison points yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Analyze an earnings call or click Run Demo Call above to populate the stress-vs-return scatter plot.
              </p>
            </div>
          )}
        </div>

        {/* Ticker History or Top Stressed Calls */}
        {(history.length > 0 || topStressed.length > 0) && (
          <div className="xl:col-span-5 bg-card border border-border rounded-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                {history.length > 0
                  ? `History — ${ticker.toUpperCase()}`
                  : 'Highest Stress Calls'}
              </h2>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                {(history.length > 0 ? history : topStressed).length} records
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-2.5 font-semibold uppercase tracking-wider text-[10px]">
                      Ticker
                    </th>
                    <th className="text-left pb-2.5 font-semibold uppercase tracking-wider text-[10px]">
                      Date
                    </th>
                    <th className="text-right pb-2.5 font-semibold uppercase tracking-wider text-[10px]">
                      Stress
                    </th>
                    <th className="text-right pb-2.5 font-semibold uppercase tracking-wider text-[10px]">
                      T+5 Move
                    </th>
                    <th className="text-right pb-2.5 font-semibold uppercase tracking-wider text-[10px]">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(history.length > 0 ? history : topStressed).map((h) => {
                    const tone = getStressTone(h.stressScore ?? 0);
                    return (
                      <tr
                        key={h.id}
                        onClick={() => {
                          setTicker(h.ticker);
                          setResult(h);
                        }}
                        className="border-b border-border/60 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                      >
                        <td className="py-3 font-mono font-bold text-foreground">{h.ticker}</td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(h.callDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full border text-[11px] font-bold',
                              tone.badge
                            )}
                          >
                            {h.stressScore ?? '—'}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'py-3 text-right font-semibold',
                            h.moveT5Pct == null
                              ? 'text-muted-foreground'
                              : h.moveT5Pct >= 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          )}
                        >
                          {h.moveT5Pct != null
                            ? `${h.moveT5Pct >= 0 ? '+' : ''}${Number(h.moveT5Pct).toFixed(2)}%`
                            : '—'}
                        </td>
                        <td className="py-3 text-right text-muted-foreground capitalize">
                          {h.sentimentLabel ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
