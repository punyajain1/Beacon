'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Beaker,
  Bot,
  ChevronDown,
  ChevronUp,
  Flame,
  Gavel,
  Globe,
  LayoutDashboard,
  Lock,
  MapPin,
  MessageSquare,
  Mic,
  Network,
  Newspaper,
  Radar,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import {
  DEMO_CHAT_PRESETS,
  DEMO_DEBATES,
  DEMO_DERIVATIVES,
  DEMO_EARNINGS_CALLS,
  DEMO_FRAUD_RINGS,
  DEMO_GLOBAL_MARKET,
  DEMO_HOLDINGS,
  DEMO_INDIA_HUB,
  DEMO_INSIDER_ALERTS,
  DEMO_NEWS,
  DEMO_NEWS_SUMMARIES,
  DEMO_RECENT_FORM4_BUYS,
  DEMO_RECOMMENDATIONS,
} from '../../lib/demoData';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'debate', label: 'AI Debate', icon: Scale },
  { id: 'insider', label: 'Insider Radar', icon: Radar },
  { id: 'fraud', label: 'Mule Rings', icon: Network },
  { id: 'earnings', label: 'Earnings Stress', icon: Mic },
  { id: 'recommendations', label: 'Recommendations', icon: Target },
  { id: 'simulator', label: 'Simulator', icon: Beaker },
  { id: 'india', label: 'India Hub', icon: MapPin },
  { id: 'derivatives', label: 'Futures', icon: Flame },
  { id: 'chatbot', label: 'Chatbot', icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]['id'];

function formatUsd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function FearGreedGauge({ value, label, history }: { value: number; label: string; history: number[] }) {
  const cx = 80;
  const cy = 80;
  const r = 70;
  const circumference = Math.PI * r;
  const segmentLength = circumference / 5;
  const dashLength = segmentLength - 4;
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
  const activeIdx = Math.min(Math.floor(value / 20), 4);
  const activeColor = colors[activeIdx];
  const rad = ((180 - (value / 100) * 180) * Math.PI) / 180;
  const markerX = cx + r * Math.cos(rad);
  const markerY = cy - r * Math.sin(rad);

  const minH = Math.min(...history);
  const maxH = Math.max(...history, minH + 1);
  const trendPoints = history
    .map((v, i) => {
      const x = (i / Math.max(history.length - 1, 1)) * 200;
      const y = 42 - ((v - minH) / (maxH - minH)) * 34;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col justify-between gap-4">
      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-center">
        Fear &amp; Greed Index
      </div>
      <div className="relative w-48 mx-auto aspect-[2/1] flex items-end justify-center">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 160 90">
          {colors.map((c, i) => (
            <path
              key={i}
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke={c}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dashLength} 1000`}
              strokeDashoffset={-(i * segmentLength)}
              opacity={i === activeIdx ? 1 : 0.2}
            />
          ))}
          <circle cx={markerX} cy={markerY} r="4" fill="#fff" stroke={activeColor} strokeWidth="2" />
          <text x="80" y="65" textAnchor="middle" fontSize="34" fontWeight="900" fill={activeColor}>
            {value}
          </text>
        </svg>
      </div>
      <div className="text-center text-xs uppercase tracking-widest font-bold" style={{ color: activeColor }}>
        {label}
      </div>
      <div className="pt-2 border-t border-white/10">
        <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-semibold mb-1">
          <span>30D Trend</span>
          <span>Range {minH}–{maxH}</span>
        </div>
        <svg viewBox="0 0 200 46" className="w-full h-11">
          <polyline fill="none" stroke={activeColor} strokeWidth="2" points={trendPoints} />
        </svg>
      </div>
    </div>
  );
}

function StressGauge({ score }: { score: number }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = clamped < 30 ? '#22c55e' : clamped < 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#27272a" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x="100" y="86" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>
          {clamped}
        </text>
        <text x="100" y="104" textAnchor="middle" fontSize="10" fill="#a1a1aa">
          STRESS SCORE
        </text>
      </svg>
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
        {clamped < 30 ? 'Low' : clamped < 60 ? 'Moderate' : 'High'}
      </span>
    </div>
  );
}

export default function InteractiveDemoPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // News state
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [summaryAsset, setSummaryAsset] = useState<'BTC' | 'ETH' | 'XAU'>('BTC');
  const [revealedScores, setRevealedScores] = useState<Record<string, boolean>>({});

  // Debate state
  const [debateTicker, setDebateTicker] = useState<'AAPL' | 'NVDA' | 'TSLA'>('AAPL');
  const [expandedDebateHist, setExpandedDebateHist] = useState<number | null>(0);

  // Insider state
  const [minInsiders, setMinInsiders] = useState<number>(2);

  // Mule rings state (Detect Rings + Account Graph sub-tabs)
  const [fraudSubTab, setFraudSubTab] = useState<'detect' | 'graph'>('detect');
  const [selectedRingId, setSelectedRingId] = useState<string>(DEMO_FRAUD_RINGS[0].id);
  const [highlightNode, setHighlightNode] = useState<string>(DEMO_FRAUD_RINGS[0].nodes[0].id);

  // Earnings stress state
  const [earningsTicker, setEarningsTicker] = useState<'AAPL' | 'INTC' | 'META'>('AAPL');
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Recommendations state
  const [recIndex, setRecIndex] = useState(0);

  // DCA Simulator state
  const [dcaAsset, setDcaAsset] = useState<'BTC' | 'ETH' | 'XAU'>('BTC');
  const [dcaFrequency, setDcaFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [dcaAmount, setDcaAmount] = useState(250);
  const [dcaMonths, setDcaMonths] = useState(12);

  // India Hub state
  const [indiaSymbol, setIndiaSymbol] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [buyInr, setBuyInr] = useState(400000);
  const [sellInr, setSellInr] = useState(550000);

  // Futures state
  const [derivSymbol, setDerivSymbol] = useState<'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT'>('BTCUSDT');

  // Chatbot state (preset read-only Q&A)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([
    {
      role: 'assistant',
      content:
        'Hello! I am FinPilot AI (Demo Mode). Select any preset prompt below to preview grounded portfolio & market answers.',
    },
  ]);

  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    for (const h of DEMO_HOLDINGS) {
      totalValue += h.amount * h.currentPrice;
      totalCost += h.amount * h.buyingPrice;
    }
    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, pnl, pnlPct };
  }, []);

  const dcaSimulation = useMemo(() => {
    const periods = dcaFrequency === 'weekly' ? dcaMonths * 4 : dcaMonths;
    const growthPerPeriod =
      (dcaAsset === 'BTC' ? 0.048 : dcaAsset === 'ETH' ? 0.036 : 0.019) /
      (dcaFrequency === 'weekly' ? 4 : 1);
    const points: Array<{ step: number; invested: number; value: number }> = [];
    let runningValue = 0;
    for (let p = 1; p <= periods; p++) {
      const wave = Math.sin(p * 0.6) * (dcaFrequency === 'weekly' ? 0.012 : 0.035);
      runningValue = (runningValue + dcaAmount) * (1 + growthPerPeriod + wave);
      points.push({ step: p, invested: dcaAmount * p, value: Math.round(runningValue) });
    }
    const final = points[points.length - 1] || { invested: 0, value: 0 };
    const roi = final.invested > 0 ? ((final.value - final.invested) / final.invested) * 100 : 0;
    return { points, finalInvested: final.invested, finalValue: final.value, roi };
  }, [dcaAsset, dcaFrequency, dcaAmount, dcaMonths]);

  const indiaTax = useMemo(() => {
    const gain = Math.max(0, sellInr - buyInr);
    const flatTax = gain * 0.3;
    const tds = sellInr * 0.01;
    const netInr = sellInr - flatTax - tds;
    return { gain, flatTax, tds, netInr };
  }, [buyInr, sellInr]);

  const newsSplit = useMemo(() => {
    const pos = DEMO_NEWS.filter((n) => n.sentiment.label === 'positive').length;
    const neu = DEMO_NEWS.filter((n) => n.sentiment.label === 'neutral').length;
    const neg = DEMO_NEWS.filter((n) => n.sentiment.label === 'negative').length;
    const total = DEMO_NEWS.length || 1;
    return { pos: (pos / total) * 100, neu: (neu / total) * 100, neg: (neg / total) * 100 };
  }, []);

  const filteredNews = DEMO_NEWS.filter(
    (n) => sentimentFilter === 'all' || n.sentiment.label === sentimentFilter
  );

  const activeDebate = DEMO_DEBATES[debateTicker];
  const activeRing = DEMO_FRAUD_RINGS.find((r) => r.id === selectedRingId) || DEMO_FRAUD_RINGS[0];
  const activeEarnings = DEMO_EARNINGS_CALLS[earningsTicker];
  const activeRec = DEMO_RECOMMENDATIONS[recIndex];
  const activeDeriv = DEMO_DERIVATIVES[derivSymbol];
  const activeIndia = DEMO_INDIA_HUB[indiaSymbol];
  const allEarningsList = Object.values(DEMO_EARNINGS_CALLS);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans">
      {/* Read-only demo banner */}
      <div className="bg-[#111111] border-b border-white/10 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Lock size={13} className="text-[#bef264] shrink-0" />
          <span>
            <strong className="text-white">Interactive Read-Only Demo</strong> — All 11 Beacon modules
            with sample data. Editing &amp; database writes are disabled.
          </span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={13} />
          Back to Landing Page
        </Link>
      </div>

      {/* Header / Navbar */}
      <header className="flex w-full items-center justify-between gap-4 py-3 px-4 md:px-6 bg-[#111111] border-b border-white/10">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shrink-0">
            <Activity size={17} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Beacon</span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#bef264] bg-[#bef264]/10 border border-[#bef264]/30 px-2 py-0.5 rounded-full">
            Demo
          </span>
        </div>

        <nav className="flex flex-1 min-w-0 items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#1f1f1f] text-white'
                  : 'text-zinc-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <tab.icon size={14} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* ── 1. DASHBOARD ──────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                    Sample Portfolio Value
                  </p>
                  <p className="text-3xl md:text-4xl font-bold mt-2 tabular-nums">
                    {formatUsd(portfolioStats.totalValue)}
                  </p>
                  <p className="text-sm text-emerald-400 font-semibold mt-1">
                    +{formatUsd(portfolioStats.pnl)} (+{portfolioStats.pnlPct.toFixed(2)}%) unrealized P/L
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Global Market Cap</span>
                    <span className="font-bold text-sm">{DEMO_GLOBAL_MARKET.totalMarketCap}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">24h Volume</span>
                    <span className="font-bold text-sm">{DEMO_GLOBAL_MARKET.volume24h}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">BTC Dominance</span>
                    <span className="font-bold text-sm">{DEMO_GLOBAL_MARKET.btcDominance}</span>
                  </div>
                </div>
              </div>

              <FearGreedGauge
                value={DEMO_GLOBAL_MARKET.fearGreed.value}
                label={DEMO_GLOBAL_MARKET.fearGreed.label}
                history={DEMO_GLOBAL_MARKET.fearGreed.history30d}
              />
            </div>

            <div className="rounded-xl bg-[#111111] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold">Tracked Holdings (Read-Only Snapshot)</h2>
                <span className="text-[11px] text-zinc-400">Add / Edit / Sync disabled in demo</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-zinc-400 border-b border-white/10">
                      <th className="pb-3">Asset</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Entry Price</th>
                      <th className="pb-3 text-right">Live Price</th>
                      <th className="pb-3 text-right">Value</th>
                      <th className="pb-3 text-right">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_HOLDINGS.map((h) => {
                      const val = h.amount * h.currentPrice;
                      const pnl = (h.currentPrice - h.buyingPrice) * h.amount;
                      return (
                        <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="py-3 font-semibold">
                            {h.assetName}{' '}
                            <span className="text-zinc-400 font-mono text-xs">{h.symbol}</span>
                          </td>
                          <td className="py-3 text-xs text-zinc-400">{h.assetType}</td>
                          <td className="py-3 text-right tabular-nums">{h.amount}</td>
                          <td className="py-3 text-right tabular-nums text-zinc-400">
                            {formatUsd(h.buyingPrice)}
                          </td>
                          <td className="py-3 text-right tabular-nums">{formatUsd(h.currentPrice)}</td>
                          <td className="py-3 text-right tabular-nums font-semibold">
                            {formatUsd(val)}
                          </td>
                          <td className="py-3 text-right tabular-nums text-emerald-400 font-semibold">
                            +{formatUsd(pnl)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. NEWS & FINBERT ─────────────────────────────────────────── */}
        {activeTab === 'news' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Globe size={18} className="text-[#bef264]" /> Global Market News · FinBERT NLP
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Market sentiment split, asset summaries, and per-article ProsusAI/finbert scores.
                </p>
              </div>
              <div className="flex gap-1.5">
                {(['all', 'positive', 'neutral', 'negative'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSentimentFilter(f)}
                    className={`px-3 py-1 rounded text-[11px] uppercase font-bold transition-colors ${
                      sentimentFilter === f
                        ? 'bg-[#bef264] text-black'
                        : 'bg-[#1A1A1A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Market Sentiment Split */}
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                <span>Market Sentiment Split</span>
                <span>
                  Pos {newsSplit.pos.toFixed(0)}% · Neu {newsSplit.neu.toFixed(0)}% · Neg{' '}
                  {newsSplit.neg.toFixed(0)}%
                </span>
              </div>
              <div className="flex h-2 w-full rounded-full overflow-hidden">
                <div style={{ width: `${newsSplit.pos}%` }} className="bg-emerald-500" />
                <div style={{ width: `${newsSplit.neu}%` }} className="bg-zinc-400" />
                <div style={{ width: `${newsSplit.neg}%` }} className="bg-red-500" />
              </div>
            </div>

            {/* Asset News Summary Selector */}
            <div className="p-4 rounded-xl bg-[#161616] border border-white/10 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  AI News Summary Preview
                </span>
                <div className="flex gap-1.5">
                  {(['BTC', 'ETH', 'XAU'] as const).map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setSummaryAsset(sym)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        summaryAsset === sym ? 'bg-[#bef264] text-black' : 'bg-[#222] text-zinc-300'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {DEMO_NEWS_SUMMARIES[summaryAsset]}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {filteredNews.map((item) => {
                const showBreakdown = !!revealedScores[item.id];
                const badgeColor =
                  item.sentiment.label === 'positive'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : item.sentiment.label === 'negative'
                    ? 'text-red-400 bg-red-500/10 border-red-500/30'
                    : 'text-zinc-300 bg-zinc-500/10 border-zinc-500/30';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-white/10 bg-[#161616] flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white flex-1">{item.title}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeColor}`}
                      >
                        {item.sentiment.label} ({item.sentiment.score.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                      <span>
                        {item.source} · {item.asset} · {item.publishedAt}
                      </span>
                      <button
                        onClick={() =>
                          setRevealedScores((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className="text-[11px] font-semibold text-[#bef264] hover:underline"
                      >
                        {showBreakdown ? 'Hide FinBERT Score' : 'Inspect FinBERT Score'}
                      </button>
                    </div>
                    {showBreakdown && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
                        <div className="text-emerald-400">
                          Positive: {(item.sentiment.details.positive * 100).toFixed(0)}%
                        </div>
                        <div className="text-zinc-300">
                          Neutral: {(item.sentiment.details.neutral * 100).toFixed(0)}%
                        </div>
                        <div className="text-red-400">
                          Negative: {(item.sentiment.details.negative * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. AI DEBATE ──────────────────────────────────────────────── */}
        {activeTab === 'debate' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Scale size={20} className="text-[#bef264]" />
                <h2 className="text-lg font-bold">Bull vs Bear AI Debate</h2>
              </div>
              <div className="flex gap-2">
                {(['AAPL', 'NVDA', 'TSLA'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setDebateTicker(t);
                      setExpandedDebateHist(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      debateTicker === t
                        ? 'bg-[#bef264] text-black'
                        : 'bg-[#1A1A1A] text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#1A1A1A] border border-white/10">
              <div>
                <span className="text-lg font-black font-mono mr-2">{activeDebate.ticker}</span>
                <span className="text-sm text-zinc-400">{activeDebate.companyName}</span>
              </div>
              <span className="text-emerald-400 font-bold text-sm">
                {formatUsd(activeDebate.stockPrice)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
                <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Bull Case
                  </span>
                  <TrendingUp size={14} className="text-emerald-400" />
                </div>
                <div className="p-4 space-y-2.5 text-sm text-zinc-200 leading-relaxed max-h-64 overflow-y-auto">
                  {activeDebate.bullArg.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
                <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    Bear Case
                  </span>
                  <TrendingDown size={14} className="text-red-400" />
                </div>
                <div className="p-4 space-y-2.5 text-sm text-zinc-200 leading-relaxed max-h-64 overflow-y-auto">
                  {activeDebate.bearArg.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#161616] overflow-hidden">
              <div className="px-4 py-3 bg-[#1A1A1A] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Gavel size={14} className="text-[#bef264]" /> Judge&apos;s Verdict
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-black border ${
                    activeDebate.winner === 'BULL'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border-red-500/40'
                  }`}
                >
                  {activeDebate.winner} WINS
                </span>
              </div>
              <p className="p-4 text-sm text-zinc-200 leading-relaxed">{activeDebate.verdict}</p>
              <div className="px-4 py-2.5 border-t border-white/5 flex flex-wrap gap-3 text-[11px] text-zinc-400">
                <span className="uppercase font-bold">Sources:</span>
                {activeDebate.sources.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#bef264] hover:underline"
                  >
                    {src.replace(/^https?:\/\//, '')}
                  </a>
                ))}
              </div>
            </div>

            {/* Past Debates Accordion */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Past Debates for {activeDebate.ticker}
              </h3>
              {activeDebate.history.map((h, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-[#161616] overflow-hidden">
                  <button
                    onClick={() => setExpandedDebateHist(expandedDebateHist === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-zinc-300"
                  >
                    <span>{h.date}</span>
                    <span className="font-bold text-[#bef264]">{h.winner}</span>
                  </button>
                  {expandedDebateHist === i && (
                    <p className="px-4 pb-3 text-xs text-zinc-400">{h.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. INSIDER RADAR ──────────────────────────────────────────── */}
        {activeTab === 'insider' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle size={18} className="text-[#bef264]" /> Insider Cluster-Buy Radar
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  SEC EDGAR Form 4 open-market purchases clustered within a 7-day window.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[2, 3, 4].map((c) => (
                  <button
                    key={c}
                    onClick={() => setMinInsiders(c)}
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      minInsiders === c ? 'bg-[#bef264] text-black' : 'bg-[#1A1A1A] text-zinc-400'
                    }`}
                  >
                    {c}+ Insiders
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {DEMO_INSIDER_ALERTS.filter((a) => a.insiderCount >= minInsiders).map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-white/10 bg-[#161616] flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base">{alert.ticker}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Users size={10} /> {alert.insiderCount} insiders
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{alert.company}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#bef264]">
                        {formatUsd(alert.totalValue)}
                      </span>
                      <p className="text-[11px] text-zinc-500">{alert.clusterDate}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                    {alert.filings.map((f, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span>
                          <span className="text-white font-medium">{f.insiderName}</span>{' '}
                          <span className="text-zinc-500">· {f.insiderRole}</span>
                        </span>
                        <span className="text-zinc-400 tabular-nums">
                          {f.shares.toLocaleString()} sh @ {formatUsd(f.pricePerShare)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 mb-3">
                Recent Form 4 Open-Market Buys ({DEMO_RECENT_FORM4_BUYS.length})
              </h3>
              <div className="space-y-2">
                {DEMO_RECENT_FORM4_BUYS.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg border border-white/10 bg-[#161616] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp size={12} className="text-emerald-400" />
                      <span className="font-mono font-bold">{f.ticker}</span>
                      <span>{f.insiderName}</span>
                      <span className="text-zinc-500">· {f.role}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#bef264] font-semibold">{formatUsd(f.total)}</span>
                      <span className="text-zinc-400">
                        {f.shares.toLocaleString()} sh @ {formatUsd(f.price)}
                      </span>
                      <span className="text-zinc-500">{f.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 5. MULE RINGS ─────────────────────────────────────────────── */}
        {activeTab === 'fraud' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-red-400" />
                <div>
                  <h2 className="text-lg font-bold">Money Mule Ring Detector</h2>
                  <p className="text-xs text-zinc-400">
                    Inspect detected rings &amp; click any account node to drill into its subgraph (read-only).
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFraudSubTab('detect')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    fraudSubTab === 'detect' ? 'bg-[#bef264] text-black' : 'bg-[#1A1A1A] text-zinc-300'
                  }`}
                >
                  Detect Rings
                </button>
                <button
                  onClick={() => setFraudSubTab('graph')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    fraudSubTab === 'graph' ? 'bg-[#bef264] text-black' : 'bg-[#1A1A1A] text-zinc-300'
                  }`}
                >
                  Account Graph
                </button>
              </div>
            </div>

            {fraudSubTab === 'detect' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  {DEMO_FRAUD_RINGS.map((ring) => (
                    <button
                      key={ring.id}
                      onClick={() => {
                        setSelectedRingId(ring.id);
                        setHighlightNode(ring.nodes[0].id);
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        selectedRingId === ring.id
                          ? 'border-[#bef264]/60 bg-[#1A1A1A]'
                          : 'border-white/10 bg-[#161616] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm">{ring.label}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                          Risk {ring.riskScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">{ring.pattern}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {ring.nodes.map((n) => (
                          <span
                            key={n.id}
                            className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-200"
                          >
                            {n.id}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-400">
                        Total moved: <strong className="text-white">{formatUsd(ring.totalMoved)}</strong>
                      </p>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070707] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                    <span>Ring Topology · {activeRing.label}</span>
                    <span>{activeRing.edges.length} edges</span>
                  </div>
                  <svg viewBox="0 0 510 280" className="w-full h-64">
                    <defs>
                      <marker id="demo-arrow" markerWidth="8" markerHeight="8" refX="18" refY="4" orient="auto">
                        <polygon points="0 0, 8 4, 0 8" fill="#bef264" />
                      </marker>
                    </defs>
                    {activeRing.edges.map((edge, i) => {
                      const src = activeRing.nodes.find((n) => n.id === edge.from)!;
                      const dst = activeRing.nodes.find((n) => n.id === edge.to)!;
                      return (
                        <g key={i}>
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={dst.x}
                            y2={dst.y}
                            stroke="#52525b"
                            strokeWidth="1.5"
                            markerEnd="url(#demo-arrow)"
                          />
                          <text
                            x={(src.x + dst.x) / 2}
                            y={(src.y + dst.y) / 2 - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#a1a1aa"
                          >
                            ${(edge.amount / 1000).toFixed(1)}k
                          </text>
                        </g>
                      );
                    })}
                    {activeRing.nodes.map((n) => (
                      <g
                        key={n.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setHighlightNode(n.id);
                          setFraudSubTab('graph');
                        }}
                      >
                        <circle cx={n.x} cy={n.y} r="22" fill="#18181b" stroke="#bef264" strokeWidth="1.5" />
                        <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">
                          {n.id}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-400">Select Account Node:</span>
                  {activeRing.nodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setHighlightNode(n.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                        highlightNode === n.id ? 'bg-[#bef264] text-black' : 'bg-[#1A1A1A] text-zinc-300'
                      }`}
                    >
                      {n.id} ({n.role})
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-[#070707] p-4">
                  <svg viewBox="0 0 510 280" className="w-full h-72">
                    <defs>
                      <marker id="demo-arrow-2" markerWidth="8" markerHeight="8" refX="18" refY="4" orient="auto">
                        <polygon points="0 0, 8 4, 0 8" fill="#bef264" />
                      </marker>
                    </defs>
                    {activeRing.edges.map((edge, i) => {
                      const src = activeRing.nodes.find((n) => n.id === edge.from)!;
                      const dst = activeRing.nodes.find((n) => n.id === edge.to)!;
                      const isConnected = edge.from === highlightNode || edge.to === highlightNode;
                      return (
                        <g key={i}>
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={dst.x}
                            y2={dst.y}
                            stroke={isConnected ? '#bef264' : '#3f3f46'}
                            strokeWidth={isConnected ? '2.2' : '1.2'}
                            markerEnd="url(#demo-arrow-2)"
                          />
                          <text
                            x={(src.x + dst.x) / 2}
                            y={(src.y + dst.y) / 2 - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fill={isConnected ? '#bef264' : '#71717a'}
                          >
                            {formatUsd(edge.amount)}
                          </text>
                        </g>
                      );
                    })}
                    {activeRing.nodes.map((n) => {
                      const selected = n.id === highlightNode;
                      return (
                        <g key={n.id} className="cursor-pointer" onClick={() => setHighlightNode(n.id)}>
                          <circle
                            cx={n.x}
                            cy={n.y}
                            r={selected ? 26 : 21}
                            fill={selected ? '#27272a' : '#18181b'}
                            stroke={selected ? '#bef264' : '#52525b'}
                            strokeWidth={selected ? '2.5' : '1.5'}
                          />
                          <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">
                            {n.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 6. EARNINGS STRESS ────────────────────────────────────────── */}
        {activeTab === 'earnings' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Mic size={20} className="text-[#bef264]" />
                <h2 className="text-lg font-bold">Earnings Call Stress Detector</h2>
              </div>
              <div className="flex gap-2">
                {(['AAPL', 'INTC', 'META'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setEarningsTicker(t);
                      setTranscriptOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                      earningsTicker === t
                        ? 'bg-[#bef264] text-black'
                        : 'bg-[#1A1A1A] text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="rounded-xl bg-[#161616] border border-white/10 p-4 flex justify-center">
                <StressGauge score={activeEarnings.stressScore} />
              </div>
              <div className="rounded-xl bg-[#161616] border border-white/10 p-5 flex flex-col items-center justify-center h-full">
                <span className="text-xs text-zinc-400">Hedge Words</span>
                <span className="text-3xl font-bold mt-1">{activeEarnings.hedgeWordCount}</span>
              </div>
              <div className="rounded-xl bg-[#161616] border border-white/10 p-5 flex flex-col items-center justify-center h-full">
                <span className="text-xs text-zinc-400">Self-Corrections</span>
                <span className="text-3xl font-bold mt-1">{activeEarnings.correctionCount}</span>
              </div>
              <div className="rounded-xl bg-[#161616] border border-white/10 p-5 flex flex-col items-center justify-center h-full">
                <span className="text-xs text-zinc-400">T+1 / T+5 Move</span>
                <span
                  className={`text-xl font-bold mt-1 ${
                    activeEarnings.moveT5Pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {activeEarnings.moveT1Pct >= 0 ? '+' : ''}
                  {activeEarnings.moveT1Pct}% / {activeEarnings.moveT5Pct >= 0 ? '+' : ''}
                  {activeEarnings.moveT5Pct}%
                </span>
                <span className="text-[11px] text-zinc-500 mt-1">
                  Call Price: {formatUsd(activeEarnings.priceT0)}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-zinc-300">Flagged Stress Passages</h3>
              {activeEarnings.passages.map((p, i) => (
                <div key={i} className="border-l-4 border-red-500 pl-4 py-2.5 pr-3 bg-red-500/10 rounded-r-lg">
                  <p className="text-sm italic text-red-200">&ldquo;{p.quote}&rdquo;</p>
                  <p className="text-xs text-zinc-400 mt-1">{p.reason}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#161616] border border-white/10 p-4">
              <button
                onClick={() => setTranscriptOpen((o) => !o)}
                className="w-full flex items-center justify-between text-sm font-semibold"
              >
                <span>Transcript Excerpt ({activeEarnings.company})</span>
                {transcriptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {transcriptOpen && (
                <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{activeEarnings.transcript}</p>
              )}
            </div>

            {/* Comparison Scatter & History Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-[#161616] border border-white/10 p-4">
                <h3 className="text-sm font-semibold mb-3">Stress Score vs. T+5 Price Move</h3>
                <svg viewBox="0 0 360 180" className="w-full h-44">
                  <line x1="40" y1="90" x2="340" y2="90" stroke="#3f3f46" strokeDasharray="3 3" />
                  <line x1="40" y1="15" x2="40" y2="160" stroke="#3f3f46" />
                  {allEarningsList.map((item) => {
                    const cx = 40 + (item.stressScore / 100) * 280;
                    const cy = 90 - (item.moveT5Pct / 12) * 70;
                    const color = item.stressScore < 30 ? '#22c55e' : item.stressScore < 60 ? '#eab308' : '#ef4444';
                    return (
                      <g key={item.ticker}>
                        <circle cx={cx} cy={cy} r="6" fill={color} />
                        <text x={cx + 9} y={cy + 3} fontSize="10" fill="#e4e4e7">
                          {item.ticker} ({item.moveT5Pct > 0 ? '+' : ''}
                          {item.moveT5Pct}%)
                        </text>
                      </g>
                    );
                  })}
                  <text x="190" y="174" textAnchor="middle" fontSize="9" fill="#a1a1aa">
                    Stress Score (0–100)
                  </text>
                </svg>
              </div>

              <div className="rounded-xl bg-[#161616] border border-white/10 p-4">
                <h3 className="text-sm font-semibold mb-3">Analyzed Calls Comparison</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-400 border-b border-white/10 text-left">
                      <th className="pb-2">Ticker</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Stress</th>
                      <th className="pb-2 text-right">T+5 Move</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEarningsList.map((row) => (
                      <tr key={row.ticker} className="border-b border-white/5">
                        <td className="py-2 font-mono font-bold">{row.ticker}</td>
                        <td className="py-2 text-zinc-400">{row.callDate}</td>
                        <td className="py-2 text-right font-bold">{row.stressScore}</td>
                        <td
                          className={`py-2 text-right font-bold ${
                            row.moveT5Pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {row.moveT5Pct >= 0 ? '+' : ''}
                          {row.moveT5Pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. RECOMMENDATIONS ────────────────────────────────────────── */}
        {activeTab === 'recommendations' && (
          <div className="flex flex-col gap-8 w-full pb-12">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Recommendations</h1>
              <h2 className="text-lg font-semibold text-white">AI Asset Recommendations</h2>
              <p className="text-sm text-zinc-400">
                Get on-demand trading strategies and 7-day target metrics using active market data, indicators, and media sentiment.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                  Demo Mode · Pre-Computed Snapshot (Recalculation Disabled)
                </span>
              </div>

              <div className="flex gap-2">
                {DEMO_RECOMMENDATIONS.map((r, i) => (
                  <button
                    key={r.symbol}
                    onClick={() => setRecIndex(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      recIndex === i
                        ? 'bg-[#bef264] text-black'
                        : 'bg-[#1A1A1A] text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {r.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Grounding Engine HUD */}
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-[#bef264] tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#bef264] animate-pulse" />
                BEACON AI GROUNDING ENGINE HUD
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">
                    Cognitive Model (MAIN)
                  </div>
                  <div className="text-xs font-semibold text-white">Groq qwen3.8-27b</div>
                </div>
                <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">
                    Sentiment NLP Model
                  </div>
                  <div className="text-xs font-semibold text-white">HuggingFace FinBERT</div>
                </div>
                <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">
                    Market Ingestion APIs
                  </div>
                  <div className="text-xs font-semibold text-white">Gold API v2 + Crypto WS</div>
                </div>
                <div className="bg-[#161616] border border-white/10 rounded-xl p-4 flex flex-col gap-1.5">
                  <div className="text-zinc-400 text-[9px] font-bold uppercase tracking-wider">
                    Caching &amp; Rate Limits
                  </div>
                  <div className="text-xs font-semibold text-white">9 Reqs/Hour (Strict Guard)</div>
                </div>
              </div>
            </div>

            {/* Recommendation Card (2-column split matching frontend) */}
            {(() => {
              const badgeStyle = (sig: string) => {
                if (sig === 'BUY' || sig === 'BULLISH' || sig === 'OVERSOLD')
                  return 'text-green-400 bg-green-500/10 border-green-500/20';
                if (sig === 'SELL' || sig === 'BEARISH' || sig === 'OVERBOUGHT')
                  return 'text-red-400 bg-red-500/10 border-red-500/20';
                return 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20';
              };

              return (
                <div className="flex flex-col xl:flex-row border border-white/10 rounded-xl bg-[#111111] overflow-hidden">
                  {/* Left Column */}
                  <div className="w-full xl:w-[280px] p-6 border-b xl:border-b-0 xl:border-r border-white/10 bg-[#141414] flex flex-col gap-6 shrink-0">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-bold text-white">{activeRec.symbol}</h3>
                        <span className="text-[9px] bg-[#1f1f1f] px-2 py-0.5 rounded text-zinc-400 font-bold tracking-wider uppercase">
                          {activeRec.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex flex-col gap-2">
                        <p>
                          Position: {activeRec.amount} units @ ${activeRec.buyingPrice.toFixed(2)}
                        </p>
                        <p>Last Analyzed: {activeRec.lastAnalyzed}</p>
                      </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/10 text-zinc-400 px-4 py-2 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-2">
                      <Lock size={12} className="text-[#bef264]" />
                      Read-Only Snapshot
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="w-full p-6 flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded text-[10px] font-bold border tracking-wider ${badgeStyle(
                          activeRec.action
                        )}`}
                      >
                        {activeRec.action}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        Confidence Score:{' '}
                        <span className="text-white font-semibold">{activeRec.confidence}%</span>
                      </span>
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          7D Price Target
                        </div>
                        <div className="text-sm font-medium text-white tabular-nums">
                          ${activeRec.priceTarget.toFixed(5)}
                        </div>
                      </div>
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Risk Profile
                        </div>
                        <div className="text-sm font-medium text-white uppercase">
                          {activeRec.riskLevel}
                        </div>
                      </div>
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          7D Price Change
                        </div>
                        <div
                          className={`text-sm font-medium tabular-nums ${
                            activeRec.priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {activeRec.priceChange7d > 0 ? '+' : ''}
                          {activeRec.priceChange7d.toFixed(2)}%
                        </div>
                      </div>
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Media Sentiment
                        </div>
                        <div className="text-sm font-medium text-white">
                          {activeRec.sentimentLabel} ({activeRec.sentimentScore.toFixed(2)})
                        </div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Current Price
                        </div>
                        <div className="text-sm font-medium text-white tabular-nums">
                          ${activeRec.currentPrice.toFixed(5)}
                        </div>
                      </div>
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Volatility (30D)
                        </div>
                        <div className="text-sm font-medium text-white tabular-nums">
                          {activeRec.volatility.toFixed(5)}
                        </div>
                      </div>
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Market Cap
                        </div>
                        <div className="text-sm font-medium text-white tabular-nums">
                          {activeRec.marketCapUsd
                            ? `$${(activeRec.marketCapUsd / 1e6).toFixed(2)}M`
                            : '—'}
                        </div>
                      </div>
                      <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-1.5">
                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Global Rank
                        </div>
                        <div className="text-sm font-medium text-white">
                          {activeRec.globalRank ? `#${activeRec.globalRank}` : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Technical Indicators */}
                    <div className="flex flex-col gap-4">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        Advanced Technical Indicators (30-Day Calculations)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-3">
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            RSI (14-Period)
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white tabular-nums">
                              {activeRec.rsi.toFixed(2)}
                            </span>
                            <span
                              className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeStyle(
                                activeRec.rsiSignal
                              )}`}
                            >
                              {activeRec.rsiSignal}
                            </span>
                          </div>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-3">
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            MACD (12/26/9 EMA)
                          </div>
                          <div className="flex flex-col gap-1.5 text-[11px]">
                            <span className="text-white font-medium tabular-nums">
                              Line: {activeRec.macd.macdLine.toFixed(2)} | Signal:{' '}
                              {activeRec.macd.signalLine.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-zinc-400 tabular-nums">
                                Hist: {activeRec.macd.histogram.toFixed(2)}
                              </span>
                              <span
                                className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeStyle(
                                  activeRec.macd.signal
                                )}`}
                              >
                                {activeRec.macd.signal}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-3">
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            Bollinger Bands (20-Period)
                          </div>
                          <div className="flex flex-col gap-1 text-[11px] tabular-nums">
                            <span className="text-white font-medium">
                              Upper: ${activeRec.bollingerBands.upper.toFixed(2)}
                            </span>
                            <span className="text-white font-medium">
                              Middle: ${activeRec.bollingerBands.middle.toFixed(2)}
                            </span>
                            <span className="text-white font-medium">
                              Lower: ${activeRec.bollingerBands.lower.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-zinc-400">BB Signal:</span>
                              <span
                                className={`text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${badgeStyle(
                                  activeRec.bollingerBands.signal
                                )}`}
                              >
                                {activeRec.bollingerBands.signal}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-white/10 rounded-lg p-4 bg-[#141414] flex flex-col gap-3">
                          <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            7D Moving Average
                          </div>
                          <div className="text-sm font-bold text-white tabular-nums">
                            ${activeRec.movingAverage.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* OBV */}
                    <div className="flex flex-col gap-2">
                      <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                        On-Balance Volume (OBV)
                      </div>
                      <div className="text-sm font-bold text-white tabular-nums">
                        {activeRec.obv.toLocaleString()}
                      </div>
                    </div>

                    {/* Analytical Reasoning */}
                    <div className="flex flex-col gap-4 mt-1">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        Analytical Reasoning
                      </div>
                      <ul className="flex flex-col gap-3.5 text-xs text-zinc-400">
                        {activeRec.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex gap-3 leading-relaxed">
                            <span className="text-zinc-500 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── 8. DCA SIMULATOR ──────────────────────────────────────────── */}
        {activeTab === 'simulator' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Beaker size={20} className="text-[#bef264]" />
              <div>
                <h2 className="text-lg font-bold">DCA Backtest Simulator (Interactive Preview)</h2>
                <p className="text-xs text-zinc-400">
                  Adjust asset, frequency, contribution, and duration to preview growth client-side.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <label className="text-xs text-zinc-400 block mb-2">Asset</label>
                <div className="flex gap-2">
                  {(['BTC', 'ETH', 'XAU'] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setDcaAsset(a)}
                      className={`flex-1 py-1.5 rounded text-xs font-bold ${
                        dcaAsset === a ? 'bg-[#bef264] text-black' : 'bg-[#222] text-zinc-300'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <label className="text-xs text-zinc-400 block mb-2">Frequency</label>
                <div className="flex gap-2">
                  {(['weekly', 'monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setDcaFrequency(freq)}
                      className={`flex-1 py-1.5 rounded text-xs font-bold capitalize ${
                        dcaFrequency === freq ? 'bg-[#bef264] text-black' : 'bg-[#222] text-zinc-300'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <label className="text-xs text-zinc-400 flex justify-between mb-2">
                  <span>Contribution</span>
                  <strong className="text-white">{formatUsd(dcaAmount)}</strong>
                </label>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={dcaAmount}
                  onChange={(e) => setDcaAmount(Number(e.target.value))}
                  className="w-full accent-[#bef264]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <label className="text-xs text-zinc-400 flex justify-between mb-2">
                  <span>Duration</span>
                  <strong className="text-white">{dcaMonths} months</strong>
                </label>
                <input
                  type="range"
                  min={3}
                  max={36}
                  step={1}
                  value={dcaMonths}
                  onChange={(e) => setDcaMonths(Number(e.target.value))}
                  className="w-full accent-[#bef264]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Total Invested</span>
                <span className="text-xl font-bold">{formatUsd(dcaSimulation.finalInvested)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Simulated Value</span>
                <span className="text-xl font-bold text-[#bef264]">
                  {formatUsd(dcaSimulation.finalValue)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Simulated ROI</span>
                <span className="text-xl font-bold text-emerald-400">
                  +{dcaSimulation.roi.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#070707] border border-white/10 p-4">
              <svg viewBox="0 0 600 180" className="w-full h-44">
                {(() => {
                  const pts = dcaSimulation.points;
                  const maxY = Math.max(...pts.map((p) => Math.max(p.value, p.invested)), 1);
                  const stepX = pts.length > 1 ? 560 / (pts.length - 1) : 560;
                  const investedPath = pts
                    .map((p, i) => `${20 + i * stepX},${160 - (p.invested / maxY) * 140}`)
                    .join(' ');
                  const valuePath = pts
                    .map((p, i) => `${20 + i * stepX},${160 - (p.value / maxY) * 140}`)
                    .join(' ');
                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#71717a"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        points={investedPath}
                      />
                      <polyline fill="none" stroke="#bef264" strokeWidth="2.5" points={valuePath} />
                    </>
                  );
                })()}
              </svg>
              <div className="flex justify-center gap-6 text-xs text-zinc-400 mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#bef264] inline-block" /> Portfolio Value
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-zinc-500 inline-block" /> Total Invested
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── 9. INDIA HUB ──────────────────────────────────────────────── */}
        {activeTab === 'india' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-[#bef264]" />
                <h2 className="text-lg font-bold">India Crypto Hub · Arbitrage, Ranks &amp; Tax</h2>
              </div>
              <div className="flex gap-2">
                {(['BTC', 'ETH', 'SOL'] as const).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setIndiaSymbol(sym)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                      indiaSymbol === sym ? 'bg-[#bef264] text-black' : 'bg-[#1A1A1A] text-zinc-300'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-base">{activeIndia.symbol} India Premium</span>
                    <span className="text-xs font-bold text-amber-400">
                      +{activeIndia.premiumPct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                    <div>
                      <span className="text-zinc-400 block">Global Implied (USD × ₹{activeIndia.usdInr})</span>
                      <strong className="text-sm">₹{activeIndia.impliedInr.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Local INR Price</span>
                      <strong className="text-sm text-[#bef264]">
                        ₹{activeIndia.localInr.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                    Local Exchange Rankings
                  </h3>
                  <div className="space-y-2 text-xs">
                    {activeIndia.ranks.map((r, idx) => (
                      <div key={r.exchange} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <span>
                          #{idx + 1} <strong className="text-white">{r.exchange}</strong>{' '}
                          <span className="text-zinc-500">({r.liquidity} liquidity)</span>
                        </span>
                        <span className="font-mono">
                          ₹{r.priceInr.toLocaleString('en-IN')} · {r.spreadPct}% spread
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#161616] border border-white/10 flex flex-col gap-4">
                <h3 className="text-sm font-bold">30% Crypto Tax + 1% TDS Calculator (Local Preview)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Buy Cost (INR)</label>
                    <input
                      type="number"
                      value={buyInr}
                      onChange={(e) => setBuyInr(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg bg-[#222] border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Sell Value (INR)</label>
                    <input
                      type="number"
                      value={sellInr}
                      onChange={(e) => setSellInr(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg bg-[#222] border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
                  <div>
                    <span className="text-zinc-400 block">Gross Gain</span>
                    <strong className="text-sm">₹{indiaTax.gain.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">30% Flat Tax</span>
                    <strong className="text-sm text-red-400">
                      -₹{indiaTax.flatTax.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">1% TDS</span>
                    <strong className="text-sm text-amber-400">
                      -₹{indiaTax.tds.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Net Receivable</span>
                    <strong className="text-sm text-[#bef264]">
                      ₹{indiaTax.netInr.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 10. DERIVATIVES / FUTURES ─────────────────────────────────── */}
        {activeTab === 'derivatives' && (
          <div className="rounded-xl bg-[#111111] border border-white/10 p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-[#bef264]" />
                <h2 className="text-lg font-bold">Derivatives &amp; Liquidation Heat</h2>
              </div>
              <div className="flex gap-2">
                {(['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setDerivSymbol(sym)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                      derivSymbol === sym ? 'bg-[#bef264] text-black' : 'bg-[#1A1A1A] text-zinc-300'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Mark Price</span>
                <span className="text-xl font-bold">{formatUsd(activeDeriv.markPrice)}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Funding Rate</span>
                <span className="text-xl font-bold text-amber-400">{activeDeriv.fundingRate}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Open Interest</span>
                <span className="text-xl font-bold">{activeDeriv.openInterest}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#161616] border border-white/10">
                <span className="text-xs text-zinc-400 block">Long / Short Ratio</span>
                <span className="text-xl font-bold">{activeDeriv.longShortRatio}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#161616] border border-white/10">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-semibold text-zinc-300">
                  Liquidation Heat: {activeDeriv.heatLabel}
                </span>
                <span className="font-bold text-[#bef264]">{activeDeriv.liquidationHeat}/100</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
                  style={{ width: `${activeDeriv.liquidationHeat}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── 11. CHATBOT ───────────────────────────────────────────────── */}
        {activeTab === 'chatbot' && (
          <div className="max-w-4xl mx-auto w-full rounded-2xl bg-[#111111] border border-white/10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#161616]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#bef264]/15 text-[#bef264] flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">FinPilot AI (Read-Only Demo)</h2>
                  <p className="text-xs text-zinc-400">Time-Grounded RAG Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setChatMessages((prev) => prev.slice(0, 1))}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-[#222]"
              >
                Reset Thread
              </button>
            </div>

            <div className="p-5 space-y-4 min-h-[300px] max-h-[420px] overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className="h-7 w-7 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center shrink-0">
                    {msg.role === 'user' ? <User size={13} /> : <Bot size={13} className="text-[#bef264]" />}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#bef264] text-black font-medium'
                        : 'bg-[#1A1A1A] border border-white/10 text-zinc-200'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#141414] space-y-2">
              <p className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#bef264]" /> Try a sample prompt (custom input disabled in demo)
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_CHAT_PRESETS.map((preset) => (
                  <button
                    key={preset.question}
                    onClick={() =>
                      setChatMessages((prev) => [
                        ...prev,
                        { role: 'user', content: preset.question },
                        { role: 'assistant', content: preset.answer },
                      ])
                    }
                    className="text-left text-xs px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#282828] border border-white/10 text-zinc-200 transition-colors"
                  >
                    {preset.question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
