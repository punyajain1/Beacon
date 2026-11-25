'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Search,
  Clock,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE = 'http://localhost:4000/api';

interface DebateResult {
  ticker: string;
  stockPrice: number;
  companyName: string;
  bullArg: string;
  bearArg: string;
  verdict: string;
  winner: 'BULL' | 'BEAR' | 'DRAW';
  sources: string[];
  createdAt: string;
}

const LOADING_STEPS = [
  'Fetching SEC filings...',
  'Bull agent arguing...',
  'Bear agent arguing...',
  'Judge deliberating...',
];

const winnerConfig = {
  BULL: {
    label: 'BULL WINS',
    color: 'bg-green-500/20 text-green-400 border-green-500/40',
    icon: TrendingUp,
  },
  BEAR: {
    label: 'BEAR WINS',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
    icon: TrendingDown,
  },
  DRAW: {
    label: 'DRAW',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
    icon: Scale,
  },
};

function formatPrice(price: number) {
  return price ? `$${price.toFixed(2)}` : 'N/A';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function Debate({ className }: { className?: string }) {
  const [ticker, setTicker] = useState('');
  const [debate, setDebate] = useState<DebateResult | null>(null);
  const [history, setHistory] = useState<DebateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle loading steps
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      stepIntervalRef.current = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2200);
    } else {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    }
    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [loading]);

  const fetchHistory = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/debate/${t.toUpperCase()}/history?limit=5`);
      const json = await res.json();
      if (json.success) setHistory(json.data);
    } catch {
      // silently ignore history errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t || !/^[A-Z]{1,5}$/.test(t)) {
      setError('Enter a valid ticker (1–5 letters, e.g. AAPL)');
      return;
    }
    setError('');
    setDebate(null);
    setHistory([]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/debate/${t}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to run debate');
      }
      setDebate(json.data);
      await fetchHistory(t);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const winner = debate ? winnerConfig[debate.winner] : null;

  return (
    <div className={cn('flex flex-col rounded-xl bg-card border border-border p-6 min-h-[600px]', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <Scale size={20} className="text-primary" />
        <h3 className="text-lg font-bold text-foreground">Bull vs Bear AI Debate</h3>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          maxLength={5}
          className="flex-1 rounded-xl bg-secondary/50 py-2.5 px-4 text-sm text-foreground outline-none border border-border/50 focus:border-primary/50 transition-all focus:bg-secondary uppercase font-mono tracking-widest"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-primary/20"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? 'Debating...' : 'Start Debate'}
        </button>
      </form>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-6 py-16"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {LOADING_STEPS.map((step, i) => (
                <div
                  key={step}
                  className={cn(
                    'flex items-center gap-2 text-sm transition-all duration-500',
                    i === loadingStep ? 'text-primary font-semibold' : i < loadingStep ? 'text-muted-foreground line-through' : 'text-muted-foreground/40',
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full flex-shrink-0 transition-all',
                      i === loadingStep ? 'bg-primary animate-pulse' : i < loadingStep ? 'bg-green-500' : 'bg-muted-foreground/20',
                    )}
                  />
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {debate && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            {/* Stock Info Bar */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-secondary/40 border border-border"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-foreground font-mono tracking-widest">
                  {debate.ticker}
                </span>
                {debate.companyName && debate.companyName !== debate.ticker && (
                  <span className="text-sm text-muted-foreground">· {debate.companyName}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-green-400 font-bold text-sm">
                <DollarSign size={14} />
                {formatPrice(debate.stockPrice)}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs ml-auto">
                <Clock size={12} />
                {formatDate(debate.createdAt)}
              </div>
            </motion.div>

            {/* Bull vs Bear Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bull Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col rounded-xl border border-green-500/30 bg-green-500/5 overflow-hidden"
              >
                {/* Sticky header */}
                <div className="flex items-center gap-2 px-5 py-3 bg-green-500/10 border-b border-green-500/20 sticky top-0">
                  <span className="text-lg">🐂</span>
                  <span className="text-xs font-black uppercase tracking-widest text-green-400">Bull Case</span>
                  <TrendingUp size={13} className="text-green-400 ml-auto" />
                </div>
                {/* Scrollable body */}
                <div className="p-5 overflow-y-auto max-h-72 custom-scrollbar">
                  {debate.bullArg
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="text-sm text-foreground/85 leading-relaxed mb-3 last:mb-0">
                        {para.trim()}
                      </p>
                    ))}
                </div>
              </motion.div>

              {/* Bear Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-col rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden"
              >
                {/* Sticky header */}
                <div className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border-b border-red-500/20 sticky top-0">
                  <span className="text-lg">🐻</span>
                  <span className="text-xs font-black uppercase tracking-widest text-red-400">Bear Case</span>
                  <TrendingDown size={13} className="text-red-400 ml-auto" />
                </div>
                {/* Scrollable body */}
                <div className="p-5 overflow-y-auto max-h-72 custom-scrollbar">
                  {debate.bearArg
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="text-sm text-foreground/85 leading-relaxed mb-3 last:mb-0">
                        {para.trim()}
                      </p>
                    ))}
                </div>
              </motion.div>
            </div>

            {/* Judge's Verdict */}
            {winner && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-secondary/20 overflow-hidden"
              >
                {/* Verdict header */}
                <div className="flex items-center gap-3 px-5 py-3 bg-secondary/40 border-b border-border">
                  <Gavel size={15} className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-foreground">
                    Judge's Verdict
                  </span>
                  <span
                    className={cn(
                      'ml-auto px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border',
                      winner.color,
                    )}
                  >
                    {winner.label}
                  </span>
                </div>

                {/* Winner banner */}
                <div className={cn(
                  'flex items-center gap-2 px-5 py-2 text-xs font-bold border-b',
                  debate.winner === 'BULL'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : debate.winner === 'BEAR'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-secondary/30 border-border text-muted-foreground',
                )}>
                  {debate.winner === 'BULL' && <><TrendingUp size={12} /> WINNER: BULL</>}
                  {debate.winner === 'BEAR' && <><TrendingDown size={12} /> WINNER: BEAR</>}
                  {debate.winner === 'DRAW' && <><Scale size={12} /> DRAW</>}
                </div>

                {/* Verdict body */}
                <div className="p-5 overflow-y-auto max-h-56 custom-scrollbar">
                  {debate.verdict
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i} className="text-sm text-foreground/85 leading-relaxed mb-3 last:mb-0">
                        {para.trim()}
                      </p>
                    ))}
                </div>

                {debate.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-border/50 bg-secondary/10">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground self-center">
                      Sources:
                    </span>
                    {debate.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline truncate max-w-[200px]"
                      >
                        {src.replace(/^https?:\/\//, '')}
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* History Section */}
            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 border-t border-border pt-4">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Past Debates for {debate.ticker}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {history.map((h) => {
                    const hWinner = winnerConfig[h.winner as 'BULL' | 'BEAR' | 'DRAW'];
                    const isExpanded = expandedHistory === h.createdAt;
                    return (
                      <div
                        key={h.createdAt}
                        className="rounded-lg border border-border bg-secondary/10 overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedHistory(isExpanded ? null : h.createdAt)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
                        >
                          <span className="text-xs text-muted-foreground">
                            {formatDate(h.createdAt)}
                          </span>
                          <span
                            className={cn(
                              'ml-auto px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                              hWinner?.color,
                            )}
                          >
                            {hWinner?.label ?? h.winner}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={12} className="text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown size={12} className="text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 flex flex-col gap-3 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-bold text-green-400">🐂 Bull: </span>
                                  {h.bullArg.slice(0, 200)}
                                  {h.bullArg.length > 200 && '...'}
                                </div>
                                <div>
                                  <span className="font-bold text-red-400">🐻 Bear: </span>
                                  {h.bearArg.slice(0, 200)}
                                  {h.bearArg.length > 200 && '...'}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!debate && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
          <div className="flex gap-4 text-5xl">
            <span>🐂</span>
            <Scale size={40} className="text-primary self-center" />
            <span>🐻</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">
            Enter a stock ticker to watch two AI analysts battle it out — one bull, one bear — with a
            judge delivering the final verdict.
          </p>
        </div>
      )}
    </div>
  );
}
