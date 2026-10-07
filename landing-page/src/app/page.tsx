"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Terminal, 
  Server, 
  Globe, 
  Cpu, 
  TrendingUp, 
  BarChart2, 
  Calculator,
  ShieldAlert,
  Database,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ArchitectureDiagram from "../components/ArchitectureDiagram";
import PipelineFlowchart from "../components/PipelineFlowchart";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path>
  </svg>
);

const Mermaid = ({ chart, id }: { chart: string, id: string }) => {
  const [svg, setSvg] = useState<string>('');
  const renderRef = useRef(false);
  
  useEffect(() => {
    if (renderRef.current) return;
    renderRef.current = true;

    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
    const renderChart = async () => {
      try {
        const result = await mermaid.render(id, chart);
        setSvg(result.svg);
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };
    renderChart();
  }, [chart, id]);

  return (
    <div 
      className="flex justify-center w-full overflow-x-auto py-8 bg-neutral-950 rounded-lg border border-neutral-900" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};



const features = [
  {
    icon: <BarChart2 className="w-5 h-5 text-neutral-400" />,
    title: "1. Market Dashboard & Portfolio",
    description: "Tracks user-entered asset holdings, calculating real-time P/L by diffing current prices against Postgres buying prices. Visualizes total portfolio value, 24h market volume, and an active Fear & Greed Index gauge.",
    image: "/dashboard-mockup.png"
  },
  {
    icon: <Globe className="w-5 h-5 text-neutral-400" />,
    title: "2. Global News Stream",
    description: "Listens to a live WebSocket for breaking global news. Automatically calculates the macro sentiment split (Positive vs Neutral vs Negative) of the overall market using FinBERT. Includes an interactive AI summary tool.",
    image: "/news.png"
  },
  {
    icon: <Cpu className="w-5 h-5 text-neutral-400" />,
    title: "3. AI Recommendations",
    description: "Displays the results of the RAG pipeline. Shows advanced indicators (MACD line, signal, histogram, Bollinger Band bounds, 7D Moving Average, Volatility) and the AI's exact reasoning bullets alongside an action conviction score.",
    image: "/recommendations.png"
  },
  {
    icon: <ShieldAlert className="w-5 h-5 text-neutral-400" />,
    title: "4. Derivatives & Liquidation Tracker",
    description: "Queries Futures APIs for Funding Rates, Open Interest, and Long/Short Ratios. Calculates a proprietary Liquidation Heat score to warn users of impending long or short squeezes caused by over-leveraging.",
    image: "/futures.png"
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-neutral-400" />,
    title: "5. India Crypto Hub",
    description: "A localized arbitrage and tax tool for Indian users. Measures the 'India Premium' gap between global implied USD rates and local INR exchange prices. Features a Tax-aware sell preview.",
    image: "/india-hub.png"
  },
  {
    icon: <Calculator className="w-5 h-5 text-neutral-400" />,
    title: "6. DCA Simulator",
    description: "Allows users to backtest Dollar Cost Averaging strategies. Queries historical market data, calculates exact buy points based on daily/weekly/monthly intervals, and renders a precise Recharts AreaChart.",
    image: "/simulator.png"
  }
];

const steps = [
  {
    title: "1. Clone the repository",
    code: "git clone https://github.com/punyajain1/Beacon.git",
  },
  {
    title: "2. Setup Backend",
    code: "cd backend\nnpm install\n# Setup .env with DATABASE_URL, QWEN_API_KEY, etc.\nnpx prisma db push\nnpm run dev",
  },
  {
    title: "3. Setup Frontend",
    code: "cd frontend\nnpm install\n# Setup .env.local if needed\nnpm run dev",
  },
  {
    title: "4. View Dashboard",
    code: "Navigate to http://localhost:3000 to view the Beacon Dashboard.",
  }
];

export default function LandingPage() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
              <LineChart className="w-3 h-3 text-black" />
            </div>
            <span className="text-sm font-medium tracking-tight">Beacon <span className="text-neutral-500 font-normal">by <a href="https://www.punyajain.me/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Punya Jain</a></span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-xs text-neutral-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#architecture" className="text-xs text-neutral-400 hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="#getting-started" className="text-xs text-neutral-400 hover:text-white transition-colors">
              Getting Started
            </Link>
            <Link href="https://github.com/punyajain1/Beacon" target="_blank" className="text-xs text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ml-2">
              <GithubIcon className="w-3 h-3" />
              Star on GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 text-xs text-neutral-400 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Advanced AI-Driven Dashboard
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.1] mb-6"
          >
            Beacon
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg md:text-xl text-neutral-500 mb-6 -mt-3 font-light"
          >
            Built by <a href="https://www.punyajain.me/" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white hover:underline transition-colors font-medium">Punya Jain</a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-400 text-base max-w-2xl font-light leading-relaxed mb-10"
          >
            An advanced, AI-driven portfolio management and market intelligence dashboard. It transcends basic price tracking by deploying a multi-model cognitive engine to synthesize technical market conditions, parse natural language news, run historical DCA simulations, and provide highly opinionated, data-backed trading recommendations.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full max-w-5xl mt-8 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl relative"
          >
            <Image src="/dashboard-mockup.png" alt="Beacon Dashboard Mockup" width={1200} height={800} className="w-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-medium tracking-tight mb-4">Core Features</h2>
            <p className="text-neutral-500 text-sm">A robust suite of professional market intelligence tools.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-neutral-950 rounded-xl border border-neutral-900 hover:border-neutral-700 transition-colors overflow-hidden flex flex-col"
              >
                {feature.image && (
                  <div className="w-full h-48 relative border-b border-neutral-900 bg-neutral-900">
                    <Image src={feature.image} alt={feature.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div className="w-10 h-10 rounded-lg border border-neutral-800 bg-black flex items-center justify-center mb-2">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-medium">{feature.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed flex-1">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section id="architecture" className="w-full scroll-mt-14">
        <ArchitectureDiagram />
      </section>

      {/* RAG Pipeline */}
      <section className="pt-24 pb-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-medium tracking-tight mb-4">The AI Cognitive Engine (RAG Pipeline)</h2>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-3xl mb-8">
              Beacon’s Recommendation Engine doesn’t just guess or hallucinate. It relies on a rigorous <strong>Retrieval-Augmented Generation (RAG)</strong> pipeline tailored specifically for quantitative finance.
            </p>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                <div className="text-xl font-bold text-neutral-700 mb-2">01</div>
                <h4 className="font-medium text-neutral-200 mb-2">Data Ingestion</h4>
                <p className="text-sm text-neutral-500">Queries external APIs for exact 30-day OHLCV data, global market cap, and recent news articles.</p>
              </div>
              <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                <div className="text-xl font-bold text-neutral-700 mb-2">02</div>
                <h4 className="font-medium text-neutral-200 mb-2">Deterministic Math</h4>
                <p className="text-sm text-neutral-500">Computes exact technical indicators (RSI, MACD, BB) server-side to feed factual math to the LLM.</p>
              </div>
              <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                <div className="text-xl font-bold text-neutral-700 mb-2">03</div>
                <h4 className="font-medium text-neutral-200 mb-2">NLP Sentiment</h4>
                <p className="text-sm text-neutral-500">Feeds news titles/descriptions into FinBERT to get a weighted sentiment score (-1 to 1).</p>
              </div>
              <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                <div className="text-xl font-bold text-neutral-700 mb-2">04</div>
                <h4 className="font-medium text-neutral-200 mb-2">LLM Synthesis</h4>
                <p className="text-sm text-neutral-500">Forces the LLM to output a strict JSON schema with price targets, actions, and exact reasoning.</p>
              </div>
            </div>
          </div>
        </div>
        
        <PipelineFlowchart />
      </section>

      {/* Database Schema */}
      <section className="py-20 px-6 border-t border-white/5 bg-neutral-950/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-medium tracking-tight mb-4">Database Schema (JSONB Advantage)</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Beacon utilizes PostgreSQL's <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-300">JSON/JSONB</code> column typing via Prisma to elegantly handle unstructured LLM outputs.
            </p>
            <p className="text-neutral-500 text-sm leading-relaxed">
              This ensures that if the LLM prompt is updated to return new indicators (e.g., adding a new moving average or on-chain metric), the database doesn't require rigorous schema migrations. Everything returned by the AI is perfectly preserved exactly as generated.
            </p>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="bg-[#0d1117] rounded-xl border border-neutral-800 overflow-hidden">
              <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                <span className="ml-2 text-xs text-neutral-500 font-mono">schema.prisma</span>
              </div>
              <pre className="p-6 text-sm font-mono text-neutral-300 overflow-x-auto">
                <code className="language-prisma">
{`model PortfolioAnalysis {
  id             String    @id @default(uuid())
  portfolioId    String
  portfolio      Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  
  data           Json      // Contains full AI Recommendation JSON
  createdAt      DateTime  @default(now())
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions Section */}
      <section id="getting-started" className="py-20 px-6 border-t border-white/5 scroll-mt-14">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-medium tracking-tight mb-4">Getting Started</h2>
            <p className="text-neutral-500 text-sm">
              Prerequisites: Node.js v18+, PostgreSQL, and API Keys for Qwen 3.8 & HuggingFace.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start bg-neutral-950 p-6 rounded-xl border border-neutral-900">
                <div className="flex-1 space-y-4">
                  <h3 className="text-base font-medium text-neutral-200">{step.title}</h3>
                  <div className="bg-black border border-neutral-800 rounded-lg p-4 relative group">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(step.code);
                        setCopiedStep(i);
                        setTimeout(() => setCopiedStep(null), 2000);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:bg-neutral-800"
                      title="Copy to clipboard"
                    >
                      {copiedStep === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="text-sm font-mono text-neutral-400 leading-relaxed overflow-x-auto pr-12"><code>{step.code}</code></pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/5 bg-black">
        <p className="text-sm text-neutral-500">
          Built by <a href="https://www.punyajain.me/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-medium">Punya Jain</a>
        </p>
      </footer>
    </main>
  );
}
