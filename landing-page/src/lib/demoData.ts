export interface DemoHolding {
  id: string;
  assetName: string;
  symbol: string;
  assetType: 'CRYPTO' | 'METAL';
  amount: number;
  buyingPrice: number;
  currentPrice: number;
  change24h: number;
}

export const DEMO_HOLDINGS: DemoHolding[] = [
  {
    id: 'h-btc',
    assetName: 'Bitcoin',
    symbol: 'BTC',
    assetType: 'CRYPTO',
    amount: 0.85,
    buyingPrice: 52400,
    currentPrice: 61480,
    change24h: 3.42,
  },
  {
    id: 'h-eth',
    assetName: 'Ethereum',
    symbol: 'ETH',
    assetType: 'CRYPTO',
    amount: 6.4,
    buyingPrice: 2890,
    currentPrice: 3120,
    change24h: 1.85,
  },
  {
    id: 'h-xau',
    assetName: 'Gold',
    symbol: 'XAU',
    assetType: 'METAL',
    amount: 4.5,
    buyingPrice: 2380,
    currentPrice: 2675,
    change24h: 0.74,
  },
  {
    id: 'h-xag',
    assetName: 'Silver',
    symbol: 'XAG',
    assetType: 'METAL',
    amount: 120,
    buyingPrice: 28.4,
    currentPrice: 31.2,
    change24h: -0.45,
  },
];

export const DEMO_GLOBAL_MARKET = {
  totalMarketCap: '$2.41T',
  volume24h: '$84.6B',
  btcDominance: '56.4%',
  fearGreed: {
    value: 64,
    label: 'Greed',
    history30d: [48, 51, 49, 44, 46, 52, 55, 58, 54, 57, 60, 62, 59, 61, 64],
  },
};

export interface DemoNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  asset: string;
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    details: { positive: number; neutral: number; negative: number };
  };
}

export const DEMO_NEWS: DemoNewsItem[] = [
  {
    id: 'n-1',
    title: 'Institutional spot Bitcoin ETF inflows accelerate past $420M on strong treasury demand',
    source: 'CoinDesk',
    publishedAt: '12 mins ago',
    asset: 'BTC',
    sentiment: { label: 'positive', score: 0.91, details: { positive: 0.91, neutral: 0.07, negative: 0.02 } },
  },
  {
    id: 'n-2',
    title: 'Central banks extend gold reserve accumulation for ninth consecutive quarter',
    source: 'Financial Times',
    publishedAt: '34 mins ago',
    asset: 'XAU',
    sentiment: { label: 'positive', score: 0.84, details: { positive: 0.84, neutral: 0.13, negative: 0.03 } },
  },
  {
    id: 'n-3',
    title: 'Federal Reserve minutes signal patient stance on rate cuts amid sticky services inflation',
    source: 'Bloomberg Crypto',
    publishedAt: '1 hr ago',
    asset: 'MACRO',
    sentiment: { label: 'neutral', score: 0.04, details: { positive: 0.14, neutral: 0.76, negative: 0.10 } },
  },
  {
    id: 'n-4',
    title: 'Cross-chain bridge pauses withdrawals following $18M smart contract exploit investigation',
    source: 'The Block',
    publishedAt: '2 hrs ago',
    asset: 'ETH',
    sentiment: { label: 'negative', score: -0.88, details: { positive: 0.02, neutral: 0.10, negative: 0.88 } },
  },
  {
    id: 'n-5',
    title: 'Ethereum Layer-2 rollup throughput hits new daily transaction peak as blob fees drop',
    source: 'The Defiant',
    publishedAt: '3 hrs ago',
    asset: 'ETH',
    sentiment: { label: 'positive', score: 0.79, details: { positive: 0.79, neutral: 0.17, negative: 0.04 } },
  },
  {
    id: 'n-6',
    title: 'Crypto exchange liquidity concentrates in top-5 venues as smaller offshore books thin out',
    source: 'CryptoSlate',
    publishedAt: '5 hrs ago',
    asset: 'BTC',
    sentiment: { label: 'neutral', score: -0.06, details: { positive: 0.12, neutral: 0.70, negative: 0.18 } },
  },
];

export const DEMO_NEWS_SUMMARIES: Record<string, string> = {
  BTC: 'Recent news sentiment for BTC: POSITIVE (1 positive, 1 neutral out of 2 articles). Institutional ETF inflows continue anchoring upside conviction while venue liquidity consolidates.',
  ETH: 'Recent news sentiment for ETH: NEUTRAL (1 positive, 1 negative out of 2 articles). Strong L2 throughput growth is offset by caution around a cross-chain bridge exploit.',
  XAU: 'Recent news sentiment for XAU: POSITIVE (1 positive out of 1 article). Sovereign central bank accumulation remains a durable tailwind for spot gold.',
};

export interface DemoDebate {
  ticker: string;
  companyName: string;
  stockPrice: number;
  winner: 'BULL' | 'BEAR' | 'DRAW';
  bullArg: string[];
  bearArg: string[];
  verdict: string;
  sources: string[];
  history: Array<{ date: string; winner: 'BULL' | 'BEAR' | 'DRAW'; summary: string }>;
}

export const DEMO_DEBATES: Record<string, DemoDebate> = {
  AAPL: {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    stockPrice: 229.45,
    winner: 'BULL',
    bullArg: [
      'Services revenue continues compounding at double-digit margins (>70% gross margin), insulating operating cash flow even when hardware replacement cycles lengthen.',
      'On-device Apple Intelligence narrows upgrade friction across 2.2B active devices, creating an asymmetric services attach-rate expansion over FY26–FY27.',
      'Aggressive share repurchases ($90B+ annual authorization) steadily boost EPS growth and provide consistent downside support.',
    ],
    bearArg: [
      'Trading above 31x trailing earnings leaves minimal margin of safety if iPhone unit growth in Greater China remains pressured by domestic competitors.',
      'Regulatory scrutiny on App Store take-rates in the EU and US DOJ antitrust remedies directly threaten the highest-margin Services profit pool.',
      'Revenue growth has hovered in low single digits, making the current multiple vulnerable to any macro consumer spending slowdown.',
    ],
    verdict:
      'The Bull thesis carries stronger empirical weight: Services recurring cash flow, unmatched ecosystem retention, and disciplined capital return outweigh near-term China headwinds, though valuation sensitivity warrants staggered entries.',
    sources: ['https://www.sec.gov/edgar/browse/?CIK=0000320193', 'https://finance.yahoo.com/quote/AAPL'],
    history: [
      { date: '7 days ago', winner: 'BULL', summary: 'Services margin durability & buyback floor outweighed hardware cycle concerns.' },
      { date: '14 days ago', winner: 'DRAW', summary: 'China market share risk balanced against upcoming AI replacement cycle.' },
    ],
  },
  NVDA: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    stockPrice: 138.2,
    winner: 'BULL',
    bullArg: [
      'Blackwell rack-scale shipments are booked out multiple quarters ahead with hyperscaler CapEx still accelerating across training and inference clusters.',
      'CUDA software moat + NVLink networking lock in full-stack data-center economics, defending 73%+ gross margins.',
    ],
    bearArg: [
      'Customer concentration among four hyperscalers building custom ASICs (TPUs, Trainium) introduces medium-term pricing pressure.',
      'Any digestion pause in AI CapEx ROI could trigger sharp multiple compression from elevated expectations.',
    ],
    verdict:
      'Bull wins on near-term earnings visibility and full-stack networking advantage, while custom silicon competition remains the key metric to monitor over the next 4 quarters.',
    sources: ['https://www.sec.gov/edgar/browse/?CIK=0001045810', 'https://finance.yahoo.com/quote/NVDA'],
    history: [
      { date: '5 days ago', winner: 'BULL', summary: 'Data-center backlog & CUDA lock-in dominated hyperscaler ASIC worries.' },
    ],
  },
  TSLA: {
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    stockPrice: 254.1,
    winner: 'BEAR',
    bullArg: [
      'Energy storage deployments (Megapack) are growing >100% YoY with expanding margins, diversifying away from pure auto cyclicality.',
      'FSD v13 neural network improvements and fleet telemetry scale position Tesla for high-margin autonomy software monetization.',
    ],
    bearArg: [
      'Core automotive gross margins ex-credits compressed sharply following repeated global price cuts and intensifying EV competition.',
      'Valuation prices in multi-year Robotaxi execution that still faces regulatory approvals and timeline slippage risk.',
    ],
    verdict:
      'Bear prevails on current risk/reward: automotive margin compression is observable today in 10-Q filings, whereas autonomous fleet cash flows remain unproven at scale.',
    sources: ['https://www.sec.gov/edgar/browse/?CIK=0001318605', 'https://finance.yahoo.com/quote/TSLA'],
    history: [
      { date: '10 days ago', winner: 'BEAR', summary: 'Auto gross margin compression outweighed energy storage momentum.' },
    ],
  },
};

export interface DemoInsiderAlert {
  id: string;
  ticker: string;
  company: string;
  insiderCount: number;
  totalValue: number;
  windowDays: number;
  clusterDate: string;
  filings: Array<{
    insiderName: string;
    insiderRole: string;
    shares: number;
    pricePerShare: number;
  }>;
}

export const DEMO_INSIDER_ALERTS: DemoInsiderAlert[] = [
  {
    id: 'ins-1',
    ticker: 'PLTR',
    company: 'Palantir Technologies Inc.',
    insiderCount: 3,
    totalValue: 4820000,
    windowDays: 7,
    clusterDate: '2 days ago',
    filings: [
      { insiderName: 'Alexander Moore', insiderRole: 'Director', shares: 45000, pricePerShare: 58.2 },
      { insiderName: 'Lauren Stat', insiderRole: 'Director', shares: 22000, pricePerShare: 57.9 },
      { insiderName: 'David Glazer', insiderRole: 'CFO', shares: 16000, pricePerShare: 57.6 },
    ],
  },
  {
    id: 'ins-2',
    ticker: 'SOFI',
    company: 'SoFi Technologies, Inc.',
    insiderCount: 4,
    totalValue: 1945000,
    windowDays: 7,
    clusterDate: '4 days ago',
    filings: [
      { insiderName: 'Anthony Noto', insiderRole: 'CEO', shares: 65000, pricePerShare: 14.1 },
      { insiderName: 'Chris Lapointe', insiderRole: 'CFO', shares: 30000, pricePerShare: 14.05 },
      { insiderName: 'Harvey Schwartz', insiderRole: 'Director', shares: 25000, pricePerShare: 13.95 },
      { insiderName: 'Ahmed Al-Hammadi', insiderRole: 'Director', shares: 18500, pricePerShare: 14.2 },
    ],
  },
  {
    id: 'ins-3',
    ticker: 'RIVN',
    company: 'Rivian Automotive, Inc.',
    insiderCount: 2,
    totalValue: 865000,
    windowDays: 7,
    clusterDate: '6 days ago',
    filings: [
      { insiderName: 'Claire McDonough', insiderRole: 'CFO', shares: 42000, pricePerShare: 10.65 },
      { insiderName: 'Karen Boone', insiderRole: 'Director', shares: 39000, pricePerShare: 10.7 },
    ],
  },
];

export const DEMO_RECENT_FORM4_BUYS = [
  { id: 'f4-1', ticker: 'PLTR', insiderName: 'Alexander Moore', role: 'Director', shares: 45000, price: 58.2, total: 2619000, date: 'Nov 23' },
  { id: 'f4-2', ticker: 'SOFI', insiderName: 'Anthony Noto', role: 'CEO', shares: 65000, price: 14.1, total: 916500, date: 'Nov 22' },
  { id: 'f4-3', ticker: 'CRWD', insiderName: 'George Kurtz', role: 'CEO', shares: 5000, price: 342.0, total: 1710000, date: 'Nov 21' },
  { id: 'f4-4', ticker: 'RIVN', insiderName: 'Claire McDonough', role: 'CFO', shares: 42000, price: 10.65, total: 447300, date: 'Nov 20' },
];

export interface DemoFraudRing {
  id: string;
  label: string;
  pattern: string;
  riskScore: number;
  totalMoved: number;
  status: string;
  nodes: Array<{ id: string; x: number; y: number; role: string }>;
  edges: Array<{ from: string; to: string; amount: number }>;
}

export const DEMO_FRAUD_RINGS: DemoFraudRing[] = [
  {
    id: 'ring-1',
    label: 'Circular Layering Ring #1',
    pattern: '4-Hop Directed Cycle',
    riskScore: 94,
    totalMoved: 192200,
    status: 'OPEN',
    nodes: [
      { id: 'MULE-A', x: 160, y: 70, role: 'Originator' },
      { id: 'MULE-B', x: 360, y: 70, role: 'Pass-Through' },
      { id: 'MULE-C', x: 360, y: 210, role: 'Layering Hop' },
      { id: 'MULE-D', x: 160, y: 210, role: 'Return Node' },
    ],
    edges: [
      { from: 'MULE-A', to: 'MULE-B', amount: 48500 },
      { from: 'MULE-B', to: 'MULE-C', amount: 48200 },
      { from: 'MULE-C', to: 'MULE-D', amount: 47900 },
      { from: 'MULE-D', to: 'MULE-A', amount: 47600 },
    ],
  },
  {
    id: 'ring-2',
    label: 'Smurfing Fan-In Ring #2',
    pattern: 'Sub-$10k Structuring → Offshore Sweep',
    riskScore: 86,
    totalMoved: 87550,
    status: 'OPEN',
    nodes: [
      { id: 'SHELL-1', x: 80, y: 60, role: 'Smurf Account' },
      { id: 'SHELL-2', x: 80, y: 140, role: 'Smurf Account' },
      { id: 'SHELL-3', x: 80, y: 220, role: 'Smurf Account' },
      { id: 'HUB-9', x: 255, y: 140, role: 'Aggregator Hub' },
      { id: 'OFFSHORE-X', x: 430, y: 140, role: 'Exit Node' },
    ],
    edges: [
      { from: 'SHELL-1', to: 'HUB-9', amount: 9800 },
      { from: 'SHELL-2', to: 'HUB-9', amount: 9750 },
      { from: 'SHELL-3', to: 'HUB-9', amount: 9900 },
      { from: 'HUB-9', to: 'OFFSHORE-X', amount: 29200 },
      { from: 'OFFSHORE-X', to: 'SHELL-1', amount: 28900 },
    ],
  },
];

export interface DemoEarningsCall {
  ticker: string;
  company: string;
  callDate: string;
  stressScore: number;
  hedgeWordCount: number;
  correctionCount: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  priceT0: number;
  moveT1Pct: number;
  moveT5Pct: number;
  passages: Array<{ quote: string; reason: string }>;
  transcript: string;
}

export const DEMO_EARNINGS_CALLS: Record<string, DemoEarningsCall> = {
  AAPL: {
    ticker: 'AAPL',
    company: 'Apple Inc.',
    callDate: '2026-11-01',
    stressScore: 34,
    hedgeWordCount: 6,
    correctionCount: 2,
    sentimentLabel: 'positive',
    priceT0: 225.8,
    moveT1Pct: 1.62,
    moveT5Pct: 3.18,
    passages: [
      {
        quote: 'supply chain timing is—well, it is slightly tighter than we anticipated last quarter.',
        reason: 'Mid-sentence self-correction while addressing component lead times.',
      },
      {
        quote: 'around 45%, or perhaps 44.5% depending on component costs—we will see how FX moves.',
        reason: 'Hedging qualifier stack ("perhaps", "we will see") on gross margin range.',
      },
    ],
    transcript:
      'Thank you everyone for joining today’s Q4 call. Overall revenue grew steadily, though, um, we are seeing some headwinds in Greater China and, I mean, supply chain timing is—well, it is slightly tighter than we anticipated last quarter. Looking at gross margins, we expect them to hold around 45%, or perhaps 44.5% depending on component costs—we will see how foreign exchange moves over the next several weeks. In Services, engagement hit an all-time high.',
  },
  INTC: {
    ticker: 'INTC',
    company: 'Intel Corporation',
    callDate: '2026-10-28',
    stressScore: 76,
    hedgeWordCount: 19,
    correctionCount: 7,
    sentimentLabel: 'negative',
    priceT0: 24.9,
    moveT1Pct: -6.4,
    moveT5Pct: -9.85,
    passages: [
      {
        quote: 'foundry breakeven is maybe—well, we think late 2027, depending on external wafer ramps.',
        reason: 'Repeated hedging and timeline softening around foundry profitability.',
      },
      {
        quote: 'inventory digestion in traditional server CPUs is taking, uh, somewhat longer than modeled.',
        reason: 'Hesitation marker preceding core data-center demand admission.',
      },
    ],
    transcript:
      'Let me address gross margin guidance first. Inventory digestion in traditional server CPUs is taking, uh, somewhat longer than modeled, and foundry breakeven is maybe—well, we think late 2027, depending on external wafer ramps. We are executing restructuring aggressively, though visibility in Q1 remains mixed.',
  },
  META: {
    ticker: 'META',
    company: 'Meta Platforms, Inc.',
    callDate: '2026-10-30',
    stressScore: 22,
    hedgeWordCount: 3,
    correctionCount: 1,
    sentimentLabel: 'positive',
    priceT0: 582.4,
    moveT1Pct: 4.1,
    moveT5Pct: 6.75,
    passages: [
      {
        quote: 'CapEx will step up meaningfully in 2026, though we see clear ad-ranking ROI already.',
        reason: 'Minor defensive qualifier around infrastructure spend intensity.',
      },
    ],
    transcript:
      'Our AI-driven ranking models drove a 7% lift in ad conversions across Reels and Feed. CapEx will step up meaningfully in 2026, though we see clear ad-ranking ROI already and operating margins remain above 41%.',
  },
};

export interface DemoRecommendation {
  symbol: string;
  name: string;
  amount: number;
  buyingPrice: number;
  lastAnalyzed: string;
  action: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  priceTarget: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priceChange7d: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  currentPrice: number;
  volatility: number;
  marketCapUsd: number | null;
  globalRank: number | null;
  rsi: number;
  rsiSignal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  macd: { macdLine: number; signalLine: number; histogram: number; signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' };
  bollingerBands: { upper: number; middle: number; lower: number; signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT' };
  movingAverage: number;
  obv: number;
  reasoning: string[];
}

export const DEMO_RECOMMENDATIONS: DemoRecommendation[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 0.85,
    buyingPrice: 52400,
    lastAnalyzed: '11/25/2026, 12:21:35 PM',
    action: 'HOLD',
    confidence: 72,
    priceTarget: 62500.0,
    riskLevel: 'HIGH',
    priceChange7d: -5.13,
    sentimentLabel: 'negative',
    sentimentScore: -0.28,
    currentPrice: 59204.01,
    volatility: 7398.37034,
    marketCapUsd: 1181940900000,
    globalRank: 1,
    rsi: 24.66,
    rsiSignal: 'OVERSOLD',
    macd: { macdLine: -6154.15, signalLine: -2606.19, histogram: -3547.97, signal: 'BEARISH' },
    bollingerBands: { upper: 79981.77, middle: 67576.61, lower: 55171.44, signal: 'OVERSOLD' },
    movingAverage: 60942.32,
    obv: 26446,
    reasoning: [
      'RSI is at 24.66, indicating the asset is deeply oversold, which suggests a potential short-term technical bounce or reversal is imminent, making an immediate sale suboptimal.',
      'The price is currently trading below the 7-day Moving Average ($60,942.32) and the 20-period SMA ($67,576.61), confirming a short-term downtrend that argues against aggressive buying but supports holding for a recovery.',
      'MACD shows a bearish divergence with the MACD line (-6154.15) significantly below the signal line (-2606.19) and a negative histogram (-3547.97), indicating persistent downward momentum that requires caution.',
      'The price is approaching the lower Bollinger Band support at $55,171.44; holding allows the position to benefit from potential mean reversion toward the middle band if support holds.',
      'Negative market sentiment driven by ETF outflows and a negative news score (-0.28) suggests continued headwinds, while the unrealized gain provides a strong safety cushion against further downside.',
      'High volatility (30-day std dev of 7398.37) and negative momentum indicate selling pressure is still present, so waiting for a confirmed bullish crossover or RSI recovery is the prudent strategy.',
    ],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 6.4,
    buyingPrice: 2890,
    lastAnalyzed: '11/25/2026, 12:18:10 PM',
    action: 'HOLD',
    confidence: 68,
    priceTarget: 3240.0,
    riskLevel: 'MEDIUM',
    priceChange7d: 1.85,
    sentimentLabel: 'neutral',
    sentimentScore: 0.08,
    currentPrice: 3120.0,
    volatility: 142.85,
    marketCapUsd: 375620000000,
    globalRank: 2,
    rsi: 49.8,
    rsiSignal: 'NEUTRAL',
    macd: { macdLine: 18.21, signalLine: 14.05, histogram: 4.16, signal: 'BULLISH' },
    bollingerBands: { upper: 3310.4, middle: 3095.2, lower: 2880.0, signal: 'NEUTRAL' },
    movingAverage: 3088.45,
    obv: 148200,
    reasoning: [
      'RSI at 49.8 reflects balanced equilibrium after consolidating above the 20-period SMA ($3,095.20).',
      'MACD histogram (+4.16) recently flipped positive as Layer-2 rollup throughput hit daily highs.',
      'Mixed FinBERT media score (+0.08) balances L2 adoption tailwinds against DeFi bridge security caution.',
    ],
  },
  {
    symbol: 'XAU',
    name: 'Gold',
    amount: 4.5,
    buyingPrice: 2380,
    lastAnalyzed: '11/25/2026, 12:15:02 PM',
    action: 'BUY',
    confidence: 81,
    priceTarget: 2735.0,
    riskLevel: 'LOW',
    priceChange7d: 2.14,
    sentimentLabel: 'positive',
    sentimentScore: 0.72,
    currentPrice: 2675.0,
    volatility: 28.42,
    marketCapUsd: null,
    globalRank: null,
    rsi: 61.2,
    rsiSignal: 'NEUTRAL',
    macd: { macdLine: 14.8, signalLine: 10.4, histogram: 4.4, signal: 'BULLISH' },
    bollingerBands: { upper: 2718.5, middle: 2635.0, lower: 2551.5, signal: 'NEUTRAL' },
    movingAverage: 2652.1,
    obv: 89420,
    reasoning: [
      'Low 30-day volatility (28.42) paired with steady sovereign central bank reserve accumulation.',
      'MACD bullish expansion (+4.40 histogram) confirms trend continuation above the 7D Moving Average ($2,652.10).',
      'Strong positive FinBERT macro sentiment (+0.72) supports incremental accumulation as portfolio ballast.',
    ],
  },
];

export const DEMO_DERIVATIVES = {
  BTCUSDT: {
    symbol: 'BTCUSDT',
    markPrice: 61482,
    fundingRate: '+0.0142%',
    openInterest: '$18.4B',
    longShortRatio: 1.38,
    liquidationHeat: 68,
    heatLabel: 'Elevated Long Leverage',
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    markPrice: 3121,
    fundingRate: '+0.0095%',
    openInterest: '$8.9B',
    longShortRatio: 1.19,
    liquidationHeat: 44,
    heatLabel: 'Balanced Positioning',
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    markPrice: 174.6,
    fundingRate: '+0.0285%',
    openInterest: '$3.2B',
    longShortRatio: 1.72,
    liquidationHeat: 81,
    heatLabel: 'High Squeeze Risk',
  },
};

export const DEMO_INDIA_HUB: Record<
  string,
  {
    symbol: string;
    globalUsd: number;
    usdInr: number;
    impliedInr: number;
    localInr: number;
    premiumPct: number;
    ranks: Array<{ exchange: string; priceInr: number; spreadPct: number; liquidity: string }>;
  }
> = {
  BTC: {
    symbol: 'BTC',
    globalUsd: 61480,
    usdInr: 84.4,
    impliedInr: 5188912,
    localInr: 5342000,
    premiumPct: 2.95,
    ranks: [
      { exchange: 'CoinDCX', priceInr: 5342000, spreadPct: 0.18, liquidity: 'High' },
      { exchange: 'CoinSwitch', priceInr: 5351200, spreadPct: 0.35, liquidity: 'Medium' },
      { exchange: 'WazirX', priceInr: 5368400, spreadPct: 0.62, liquidity: 'Medium' },
    ],
  },
  ETH: {
    symbol: 'ETH',
    globalUsd: 3120,
    usdInr: 84.4,
    impliedInr: 263328,
    localInr: 269400,
    premiumPct: 2.31,
    ranks: [
      { exchange: 'CoinDCX', priceInr: 269400, spreadPct: 0.21, liquidity: 'High' },
      { exchange: 'CoinSwitch', priceInr: 270150, spreadPct: 0.42, liquidity: 'Medium' },
      { exchange: 'WazirX', priceInr: 271800, spreadPct: 0.74, liquidity: 'Low' },
    ],
  },
  SOL: {
    symbol: 'SOL',
    globalUsd: 174.6,
    usdInr: 84.4,
    impliedInr: 14736,
    localInr: 15190,
    premiumPct: 3.08,
    ranks: [
      { exchange: 'CoinDCX', priceInr: 15190, spreadPct: 0.25, liquidity: 'High' },
      { exchange: 'CoinSwitch', priceInr: 15245, spreadPct: 0.49, liquidity: 'Medium' },
      { exchange: 'WazirX', priceInr: 15360, spreadPct: 0.85, liquidity: 'Low' },
    ],
  },
};

export const DEMO_CHAT_PRESETS: Array<{ question: string; answer: string }> = [
  {
    question: 'How is my portfolio performing and where is the highest concentration?',
    answer:
      'Your sample portfolio totals $88,022.00 with +$14,040.00 (+18.98%) unrealized P/L. Bitcoin represents ~59.4% of value ($52,258), followed by Ethereum at 22.7% ($19,968), Gold at 13.7% ($12,038), and Silver at 4.2% ($3,744). Gold provides low-volatility ballast (1.1% 30D vol) offsetting crypto beta.',
  },
  {
    question: 'What does FinBERT say about Bitcoin & Ethereum today?',
    answer:
      'FinBERT news scoring is bullish on BTC (+0.91 on spot ETF inflows exceeding $420M) and mixed on ETH (+0.79 on Layer-2 rollup throughput vs -0.88 on a cross-chain bridge exploit). Overall macro stance is slightly constructive with Fear & Greed at 64 (Greed).',
  },
  {
    question: 'Summarize the latest insider & earnings signals.',
    answer:
      'SEC Form 4 radar flagged 3 cluster-buy alerts within 7 days led by SOFI (4 insiders, $1.95M) and PLTR (3 insiders, $4.82M). On earnings stress, INTC scored 76/100 (high hedge-word density before a -9.85% T+5 move) while META scored 22/100 (+6.75% T+5 move).',
  },
];
