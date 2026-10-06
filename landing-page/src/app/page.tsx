"use client";

import { motion } from "framer-motion";
import { Cpu, LineChart, Terminal, Server, MessageSquare, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const features = [
  {
    icon: <LineChart className="w-4 h-4 text-neutral-400" />,
    title: "Real-Time Tracking",
    description: "Track cryptocurrencies (BTC, ETH) and precious metals (Gold, Silver) via CoinGecko and Metals-API with zero latency."
  },
  {
    icon: <Cpu className="w-4 h-4 text-neutral-400" />,
    title: "AI-Powered Insights",
    description: "Groq GPT-OSS 120B evaluates technicals like SMA and volatility to recommend high-confidence BUY, SELL, or HOLD actions."
  },
  {
    icon: <Globe className="w-4 h-4 text-neutral-400" />,
    title: "Sentiment Analysis",
    description: "Integrated HuggingFace FinBERT pipeline categorizes global financial news into positive, neutral, or negative sentiment."
  },
  {
    icon: <MessageSquare className="w-4 h-4 text-neutral-400" />,
    title: "Grounded Chatbot",
    description: "Interact with an AI assistant that uses Time-Based RAG to eliminate hallucinations by referencing live market metrics."
  }
];

const steps = [
  {
    title: "Clone the Repository",
    code: "git clone https://github.com/yourusername/beacon.git\ncd beacon",
  },
  {
    title: "Configure Environment",
    code: "cp .env.example .env\n# Add your Groq, HuggingFace, and Market API keys",
  },
  {
    title: "Start the Backend & Frontend",
    code: "npm install\nnpx prisma migrate dev\nnpm run dev",
  }
];

const modules = [
  {
    title: "AI Portfolio Recommendations",
    description: "The API automatically calculates 7-day Simple Moving Average, volatility, and trend, feeding it into Groq's 120B model for accurate BUY, SELL, or HOLD decisions.",
    image: "/recommendations.png",
  },
  {
    title: "Financial Sentiment News Engine",
    description: "Automatically scans global media every 5 minutes. Articles are parsed by FinBERT to score sentiment from positive to negative, streaming instantly via WebSockets.",
    image: "/news.png",
  },
  {
    title: "Interactive Grounded Chatbot",
    description: "Converse with a state-of-the-art AI that pulls real-time PostgreSQL news and pricing data into its context window, ensuring 100% mathematically grounded responses.",
    image: "/simulator.png",
  },
  {
    title: "Dynamic Two-Tier Caching System",
    description: "Eliminates external API rate limits and achieves sub-millisecond response times with a sophisticated dual in-memory RAM and PostgreSQL persistent cache hierarchy.",
    image: "/futures.png",
  },
  {
    title: "Background Automation & Cron Engine",
    description: "Fully self-sustaining background workers fetch market arrays, compute technical indicators, and purge stale database entries without user intervention.",
    image: "/india-hub.png",
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
              <LineChart className="w-3 h-3 text-black" />
            </div>
            <span className="text-sm font-medium tracking-tight">Beacon</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#architecture" className="text-xs text-neutral-400 hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="#instructions" className="text-xs text-neutral-400 hover:text-white transition-colors">
              Docs
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 text-xs text-neutral-400 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            AI-Powered & API-Driven
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.1] mb-6"
          >
            Your Private <br className="hidden md:block" />
            <span className="text-neutral-500">Financial Advisor</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-neutral-400 text-base max-w-xl font-light leading-relaxed mb-10"
          >
            Beacon is an AI-powered financial advisor and portfolio monitoring system.
            It utilizes Groq's high-capacity GPT-OSS 120B model and HuggingFace FinBERT to provide 24/7 technical and sentiment analysis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <Link
              href="https://github.com"
              className="h-9 px-5 rounded-md bg-white text-black text-sm font-medium flex items-center justify-center hover:bg-neutral-200 transition-colors"
            >
              Download Now
            </Link>
            <Link
              href="#instructions"
              className="h-9 px-5 rounded-md bg-transparent border border-neutral-800 text-sm font-medium flex items-center justify-center hover:bg-neutral-900 transition-colors text-neutral-300"
            >
              View Instructions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h2 className="text-xl font-medium tracking-tight mb-2">Core Capabilities</h2>
            <p className="text-neutral-500 text-sm">Engineered for precise financial intelligence.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="space-y-4"
              >
                <div className="w-8 h-8 rounded border border-neutral-800 bg-neutral-900/30 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-medium">{feature.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules List */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16">
          <div className="md:w-1/3">
            <h2 className="text-xl font-medium tracking-tight mb-2 sticky top-24">Everything You Need</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              A full suite of professional financial tools built directly into your private dashboard.
            </p>
          </div>
          <div className="md:w-2/3 flex flex-col">
            {modules.map((mod, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="group border-b border-neutral-900 py-12 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="flex items-baseline gap-4 mb-3">
                  <span className="text-xs font-mono text-neutral-600">0{i + 1}</span>
                  <h3 className="text-lg font-medium">{mod.title}</h3>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed pl-8 mb-6">{mod.description}</p>
                <div className="pl-8">
                  <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-neutral-900 bg-neutral-950">
                    <Image
                      src={mod.image}
                      alt={mod.title}
                      fill
                      className="object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Deep Dive */}
      <section id="architecture" className="py-24 px-6 border-t border-white/5 bg-neutral-950/20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h2 className="text-xl font-medium tracking-tight mb-2">Technical Architecture</h2>
            <p className="text-neutral-500 text-sm">A decoupled, deterministic system engineered for high-frequency data ingestion.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Frontend */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 border-b border-neutral-900 pb-4 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" /> Frontend
              </h3>
              <ul className="space-y-4 text-xs text-neutral-500">
                <li><strong className="text-neutral-300 font-medium block mb-1">Next.js 14</strong> SSR and optimized routing.</li>
                <li><strong className="text-neutral-300 font-medium block mb-1">Tailwind CSS</strong> Utility-first minimal styling.</li>
                <li><strong className="text-neutral-300 font-medium block mb-1">Live WebSockets</strong> Subscribes to the backend event bus.</li>
              </ul>
            </div>
            {/* Backend */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 border-b border-neutral-900 pb-4 flex items-center gap-2">
                <Server className="w-3.5 h-3.5" /> Backend Engine
              </h3>
              <ul className="space-y-4 text-xs text-neutral-500">
                <li><strong className="text-neutral-300 font-medium block mb-1">Express.js & TypeScript</strong> Modular REST & WS controllers.</li>
                <li><strong className="text-neutral-300 font-medium block mb-1">Two-Tier Cache</strong> Memory & DB caching for API limits.</li>
                <li><strong className="text-neutral-300 font-medium block mb-1">Deterministic Math</strong> Server-side indicator calculations.</li>
              </ul>
            </div>
            {/* Cognitive */}
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400 border-b border-neutral-900 pb-4 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> DB & AI Layer
              </h3>
              <ul className="space-y-4 text-xs text-neutral-500">
                <li><strong className="text-neutral-300 font-medium block mb-1">PostgreSQL + Prisma</strong> Relational persistence with JSONB.</li>
                <li><strong className="text-neutral-300 font-medium block mb-1">FinBERT NLP</strong> Real-time news sentiment scoring.</li>
                <li><strong className="text-neutral-300 font-medium block mb-1">Groq 120B</strong> High-capacity RAG prompt evaluation.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions Section */}
      <section id="instructions" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h2 className="text-xl font-medium tracking-tight mb-2">Get Started Locally</h2>
            <p className="text-neutral-500 text-sm">Have your personal advisor up and running in minutes.</p>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="text-xs font-mono text-neutral-600 mt-1">
                  0{i + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-medium">{step.title}</h3>
                  <div className="bg-neutral-950 border border-neutral-900 rounded p-4">
                    <pre className="text-xs font-mono text-neutral-400"><code>{step.code}</code></pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} Beacon. Open Source.</p>
          <div className="flex gap-6">
            <Link href="https://github.com" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
