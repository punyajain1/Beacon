"use client";
import Script from "next/script";

export default function Page() {
  return (
    <>
      

  {/* Premium Glassmorphic Loading Screen */}
  <div id="app-loading-screen" className="loading-overlay">
    <div className="loading-card">
      <div className="logo" style={{"marginBottom":"24px","fontSize":"24px","textAlign":"center","letterSpacing":"3px"}}>FINPILOT</div>
      <div className="loading-spinner-container">
        <div className="loading-pulse"></div>
      </div>
      <div className="loading-text" id="loading-status-text">Waking up cognitive grounding engines...</div>
      <div className="loading-subtext">FinPilot is establishing secure connections to active market rates and media sentiment feeds. This may take a few seconds on first boot.</div>
    </div>
  </div>

  {/* App Shell */}
  <div className="app-container">
    
    {/* Top Navigation Header */}
    <header className="app-header">
      <div className="logo">FINPILOT</div>
      <nav className="nav-tabs">
        <button className="nav-tab active" data-tab="dashboard">Dashboard</button>
        <button className="nav-tab" data-tab="chatbot">AI Assistant</button>
        <button className="nav-tab" data-tab="news">News Stream</button>
        <button className="nav-tab" data-tab="recommendations">Recommendations</button>
        <button className="nav-tab" data-tab="simulators">Simulators</button>
        <button className="nav-tab" data-tab="docs">Docs & Architecture</button>
      </nav>
      <div className="connection-status">
        <span className="status-indicator offline" id="ws-indicator"></span>
        <span className="status-text" id="ws-status-text">Disconnected</span>
      </div>
    </header>

    {/* Main Content Container */}
    <main className="app-main">

      {/* ================= DASHBOARD TAB ================= */}
      <section id="tab-dashboard" className="tab-content active">
        {/* Global Market Stats Header */}
        <div className="global-stats-header" style={{
          display: 'flex', gap: '15px', background: 'var(--panel-bg)', padding: '15px 20px', 
          borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px',
          alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'}}>Total Crypto Market Cap</span>
            <span id="global-mcap" style={{fontSize: '18px', fontWeight: '600', color: 'var(--text-main)'}}>---</span>
            <span id="global-mcap-change" style={{fontSize: '12px', marginTop: '4px'}}>---</span>
          </div>
          <div style={{height: '40px', width: '1px', background: 'var(--border-color)'}}></div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'}}>24h Global Volume</span>
            <span id="global-vol" style={{fontSize: '18px', fontWeight: '600', color: 'var(--text-main)'}}>---</span>
            <span id="global-vol-change" style={{fontSize: '12px', marginTop: '4px'}}>---</span>
          </div>
          <div style={{height: '40px', width: '1px', background: 'var(--border-color)'}}></div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'}}>BTC Dominance</span>
            <span id="global-btcd" style={{fontSize: '18px', fontWeight: '600', color: 'var(--accent-gold)'}}>---</span>
            <span id="global-btcd-label" style={{fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)'}}>Data via CoinLore</span>
          </div>
        </div>

        <div className="dashboard-summary">
          <div className="summary-card">
            <span className="summary-label">Total Value</span>
            <span className="summary-value" id="stat-total-value">$0.00</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Total Cost</span>
            <span className="summary-value" id="stat-total-cost">$0.00</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Profit / Loss</span>
            <span className="summary-value" id="stat-total-pl">$0.00 (0.00%)</span>
          </div>
        </div>

        <div className="section-header">
          <h2>Assets Portfolio</h2>
          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn btn-secondary" id="open-sync-wallet-btn" style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <span>⟳</span> Sync Wallet
            </button>
            <button className="btn btn-primary" id="open-add-asset-btn">+ Add Asset</button>
          </div>
        </div>

        <div className="table-container">
          <table id="assets-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Holdings</th>
                <th>Buy Price</th>
                <th>Current Price</th>
                <th>P&L</th>
                <th style={{"textAlign":"right"}}>Actions</th>
              </tr>
            </thead>
            <tbody id="assets-list">
              {/* Rendered dynamically */}
              <tr>
                <td colSpan={8} className="text-muted text-center" style={{"padding":"40px 0"}}>No assets found in your portfolio.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= AI CHATBOT TAB ================= */}
      <section id="tab-chatbot" className="tab-content">
        <div className="chat-container">
          <div className="chat-main">
            <div className="chat-history" id="chat-history-box">
              <div className="chat-message assistant">
                <div className="message-content">
                  Hello, I am FinPilot, your advanced AI financial advisor powered by <strong>Groq GPT-OSS 120B</strong> and <strong>HuggingFace FinBERT</strong> sentiment models. How can I help you analyze cryptocurrencies, precious metals, or your portfolio positions today?
                </div>
              </div>
            </div>
            
            <form className="chat-input-form" id="chat-form">
              <input type="text" id="chat-input" placeholder="Ask about markets, trends, or asset allocation..." required autoComplete="off" />
              <button type="button" className="btn btn-secondary" id="clear-chat-btn">Clear Chat</button>
              <button type="submit" className="btn btn-secondary">Send</button>
            </form>
          </div>
          
          <div className="chat-sidebar">
            <h3>FinPilot Ingestion Engine</h3>
            <div style={{"marginBottom":"24px","fontSize":"11px","color":"var(--text-muted)","lineHeight":"1.6"}}>
              <span style={{"display":"block","marginBottom":"8px","fontWeight":"500"}}>Active Grounding Pipelines:</span>
              <ul style={{"paddingLeft":"12px","listStyle":"none","display":"flex","flexDirection":"column","gap":"6px"}}>
                <li><span style={{"color":"var(--accent-blue)","marginRight":"6px"}}>✔</span> HuggingFace Sentiment API</li>
                <li><span style={{"color":"var(--accent-blue)","marginRight":"6px"}}>✔</span> Gold & Metals Rate Engine</li>
                <li><span style={{"color":"var(--accent-blue)","marginRight":"6px"}}>✔</span> Active News Analytics Feed</li>
                <li><span style={{"color":"var(--accent-blue)","marginRight":"6px"}}>✔</span> User Portfolio Database</li>
              </ul>
            </div>
            <h3>Verified Data Sources</h3>
            <div id="sources-container" className="sources-list">
              <p className="text-muted small">Verified source links crawled by Groq GPT-OSS 120B during chat turns will appear here.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEWS STREAM TAB ================= */}
      <section id="tab-news" className="tab-content">
        <div className="section-header">
          <h2>Real-Time News Stream</h2>
          <div>
            <span id="last-fetched-time" style={{"fontSize":"12px","color":"var(--text-muted)","marginRight":"15px","fontWeight":"500"}}></span>
            <button className="btn btn-secondary small" id="trigger-news-fetch-btn">Force Fetch News</button>
          </div>
        </div>
        <div className="news-container">
          <div className="news-list" id="news-feed">
            {/* Rendered dynamically via REST or WS */}
            <p className="text-muted" style={{"padding":"20px 0"}}>Connecting to news socket feed...</p>
          </div>
          <div className="news-sidebar">
            <div className="sentiment-box">
              <h3>24H Market Sentiment</h3>
              <div className="sentiment-bar-container">
                <div className="sentiment-bar">
                  <div className="sentiment-progress positive" style={{"width":"33%"}}></div>
                  <div className="sentiment-progress neutral" style={{"width":"34%"}}></div>
                  <div className="sentiment-progress negative" style={{"width":"33%"}}></div>
                </div>
                <div className="sentiment-legend">
                  <span>Positive: <strong id="sentiment-pos-val">0</strong></span>
                  <span>Neutral: <strong id="sentiment-neu-val">0</strong></span>
                  <span>Negative: <strong id="sentiment-neg-val">0</strong></span>
                </div>
              </div>
            </div>
            <div className="top-assets-box">
              <h3>Hot Assets Mentioned</h3>
              <ul className="top-assets-list" id="hot-assets-list">
                <li className="text-muted small">Waiting for news metrics...</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= RECOMMENDATIONS TAB ================= */}
      <section id="tab-recommendations" className="tab-content">
        <div className="section-header">
          <div>
            <h2>AI Asset Recommendations</h2>
            <p className="section-sub">Get on-demand trading strategies and 7-day target metrics using active market data, indicators, and media sentiment.</p>
          </div>
        </div>
        
        <div className="alert alert-warning" style={{"marginBottom":"20px","fontSize":"13px","background":"rgba(255, 170, 0, 0.1)","color":"#ffaa00","border":"1px solid rgba(255, 170, 0, 0.2)","padding":"12px","borderRadius":"8px"}}>
          <strong>Note:</strong> If the backend has been asleep, auto-fetching pauses. Ensure you trigger a <strong>Force Fetch</strong> in the News tab so the AI has the absolute latest market context before analyzing.
        </div>

        {/* AI Engine & Sentiment Scanner HUD Banner */}
        <div className="ai-hud-container">
          <div className="hud-header">
            <div className="hud-status-bulb"></div>
            <span className="hud-label" style={{"fontWeight":"600","color":"var(--text-main)","fontSize":"11px"}}>FinPilot AI Grounding Engine HUD</span>
          </div>
          <div className="ai-hud-grid">
            <div className="ai-hud-item">
              <span className="hud-label">Cognitive Model Brain</span>
              <span className="hud-value"><strong>Groq GPT-OSS 120B</strong></span>
            </div>
            <div className="ai-hud-item">
              <span className="hud-label">Sentiment NLP Model</span>
              <span className="hud-value">HuggingFace FinBERT</span>
            </div>
            <div className="ai-hud-item">
              <span className="hud-label">Market Ingestion APIs</span>
              <span className="hud-value">Gold API v2 + Crypto WS</span>
            </div>
            <div className="ai-hud-item">
              <span className="hud-label">Caching & Rate Limits</span>
              <span className="hud-value">9 Reqs/Hour (Strict Guard)</span>
            </div>
          </div>
        </div>

        <div className="recommendations-container" id="recommendations-deck">
          {/* Rendered dynamically */}
          <p className="text-muted" style={{"padding":"20px 0"}}>Select your assets and request a customized analysis to generate recommendations.</p>
        </div>
      </section>

      {/* ================= SIMULATORS TAB ================= */}
      <section id="tab-simulators" className="tab-content">
        <div className="section-header">
          <div>
            <h2>Dollar-Cost Averaging (DCA) Simulator</h2>
            <p className="section-sub">See how consistent investing over the past year would have performed.</p>
          </div>
        </div>

        <div className="simulator-grid" style={{display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px"}}>
          {/* Controls Panel */}
          <div className="simulator-controls panel-box" style={{padding: "20px"}}>
            <h3>Simulation Setup</h3>
            <form id="dca-form" className="dca-form" style={{display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px"}}>
              <div className="form-group" style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                <label style={{fontSize: "12px", color: "var(--text-muted)"}}>Asset Symbol</label>
                <input type="text" id="dca-symbol" defaultValue="BTC" placeholder="e.g. BTC, ETH" style={{padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--surface-color)", color: "var(--text-main)"}} />
              </div>
              <div className="form-group" style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                <label style={{fontSize: "12px", color: "var(--text-muted)"}}>Investment Amount (USD)</label>
                <input type="number" id="dca-amount" defaultValue="50" min="1" style={{padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--surface-color)", color: "var(--text-main)"}} />
              </div>
              <div className="form-group" style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                <label style={{fontSize: "12px", color: "var(--text-muted)"}}>Frequency</label>
                <select id="dca-frequency" defaultValue="weekly" style={{padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--surface-color)", color: "var(--text-main)"}}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group" style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                <label style={{fontSize: "12px", color: "var(--text-muted)"}}>Duration (Days)</label>
                <select id="dca-duration" defaultValue="365" style={{padding: "8px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--surface-color)", color: "var(--text-main)"}}>
                  <option value="90">3 Months (90 Days)</option>
                  <option value="180">6 Months (180 Days)</option>
                  <option value="365">1 Year (365 Days)</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{width: "100%", marginTop: "10px", padding: "10px"}}>Run Simulation</button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="simulator-results">
            <div className="dca-summary-cards" id="dca-summary" style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px"}}>
              <div className="panel-box" style={{padding: "15px"}}><div style={{fontSize: "12px", color: "var(--text-muted)"}}>Total Invested</div><div id="dca-val-invested" style={{fontSize: "18px", fontWeight: "600", marginTop: "5px"}}>--</div></div>
              <div className="panel-box" style={{padding: "15px"}}><div style={{fontSize: "12px", color: "var(--text-muted)"}}>Final Value</div><div id="dca-val-final" style={{fontSize: "18px", fontWeight: "600", marginTop: "5px"}}>--</div></div>
              <div className="panel-box" style={{padding: "15px"}}><div style={{fontSize: "12px", color: "var(--text-muted)"}}>Net Profit</div><div id="dca-val-profit" style={{fontSize: "18px", fontWeight: "600", marginTop: "5px"}}>--</div></div>
              <div className="panel-box" style={{padding: "15px"}}><div style={{fontSize: "12px", color: "var(--text-muted)"}}>ROI %</div><div id="dca-val-roi" style={{fontSize: "18px", fontWeight: "600", marginTop: "5px"}}>--</div></div>
            </div>
            
            <div className="dca-chart-container panel-box" style={{padding: "20px", height: "350px"}}>
              <canvas id="dcaChart"></canvas>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DOCS & ARCHITECTURE TAB ================= */}
      <section id="tab-docs" className="tab-content">
        <div className="docs-layout">
          {/* Sticky Sub-Navigation Sidebar */}
          <aside className="docs-sidebar">
            <div className="docs-sidebar-header">
              <span className="docs-badge">Technical Guide</span>
              <h3>FinPilot System Specs</h3>
            </div>
            <nav className="docs-nav">
              <a href="#docs-overview" className="docs-nav-link active">
                <span className="nav-bullet"></span>Overview & Vision
              </a>
              <a href="#docs-architecture" className="docs-nav-link">
                <span className="nav-bullet"></span>System Topology
              </a>
              <a href="#docs-ai-pipeline" className="docs-nav-link">
                <span className="nav-bullet"></span>AI Sentiment Pipeline
              </a>
              <a href="#docs-indicators" className="docs-nav-link">
                <span className="nav-bullet"></span>Technical Indicators
              </a>
              <a href="#docs-standby" className="docs-nav-link">
                <span className="nav-bullet"></span>Standby Optimizer
              </a>
              <a href="#docs-api" className="docs-nav-link">
                <span className="nav-bullet"></span>API Endpoint Registry
              </a>
              <a href="#docs-techstack" className="docs-nav-link">
                <span className="nav-bullet"></span>Tech Stack
              </a>
            </nav>
          </aside>

          {/* Documentation Content Area */}
          <div className="docs-content-area">
            
            {/* Section 1: Overview */}
            <div id="docs-overview" className="docs-section">
              <span className="section-tag">01 / OVERVIEW</span>
              <h2>Project Vision & Core Capabilities</h2>
              <p className="lead-text">FinPilot is an advanced, dark-minimalist real-time financial portfolio technical analyst and AI recommendation system. It aggregates live asset telemetry across volatile cryptocurrencies and precious metals markets, merging it with multi-channel media sentiments to provide on-demand, institutional-grade insights.</p>
              
              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h4>24/7 Live Monitoring</h4>
                  <p>Keeps dynamic indices updated on precious metals (Gold, Silver) and cryptocurrencies (Bitcoin, Ethereum) automatically.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🧠</div>
                  <h4>FinBERT Sentiment Engine</h4>
                  <p>Applies a localized HuggingFace FinBERT model specifically pre-trained to classify financial text sentiments with high precision.</p>
                </div>
                 <div className="feature-card">
                  <div className="feature-icon">🔍</div>
                  <h4>Sliding Context Memory</h4>
                  <p>Maintains multi-turn conversation states, retaining the last 10 dialog exchanges to yield highly cohesive replies.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📈</div>
                  <h4>Mathematical Indicators</h4>
                  <p>Runs sub-millisecond multi-period standard deviation and moving averages on price vectors to generate trading signals.</p>
                </div>
              </div>
            </div>

            <hr className="docs-divider" />

            {/* Section 2: Architecture Topology Diagram */}
            <div id="docs-architecture" className="docs-section">
              <span className="section-tag">02 / SYSTEM TOPOLOGY</span>
              <h2>System Architecture & Conceptual Flow</h2>
              <p className="section-desc">The application operates on a robust Service-Oriented Architecture (SOA), coordinating WebSocket connections, REST APIs, background cron schedules, double-tiered caching databases, and multiple cognitive model pipelines.</p>
              
              {/* Pure CSS Interactive Diagram */}
              <div className="arch-diagram-wrapper">
                <div className="arch-diagram">
                  
                  {/* Layer 1: Client */}
                  <div className="diagram-layer">
                    <div className="layer-title">Browser Client Tier</div>
                    <div className="nodes-row">
                      <div className="diagram-node node-client">
                        <div className="node-icon">💻</div>
                        <div className="node-title">HTML5 / CSS3 / Vanilla JS</div>
                        <div className="node-details">Client Interface app.js</div>
                        <div className="node-status"><span className="status-dot green"></span>Active Client</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="diagram-path"><div className="path-line pulse-down"></div></div>

                  {/* Layer 2: API Gateway & Server */}
                  <div className="diagram-layer">
                    <div className="layer-title">Application Core Tier</div>
                    <div className="nodes-row">
                      <div className="diagram-node node-server">
                        <div className="node-icon">⚙️</div>
                        <div className="node-title">Express.js Node Server</div>
                        <div className="node-details">TypeScript Controller Registry</div>
                        <div className="node-status"><span className="status-dot green"></span>HTTP / WebSocket Gateway</div>
                      </div>
                      <div className="diagram-node node-cron">
                        <div className="node-icon">⏱️</div>
                        <div className="node-title">Cron Automation Engine</div>
                        <div className="node-details">5m Crawlers / 24h Purge</div>
                        <div className="node-status"><span className="status-dot blue"></span>Active-Client Standby</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="diagram-path"><div className="path-line pulse-down"></div></div>

                  {/* Layer 3: Persistence & Cache */}
                  <div className="diagram-layer">
                    <div className="layer-title">Data & State Persistence Tier</div>
                    <div className="nodes-row flex-three">
                      <div className="diagram-node node-db">
                        <div className="node-icon">🗄️</div>
                        <div className="node-title">PostgreSQL Database</div>
                        <div className="node-details">Prisma ORM Persistence Layer</div>
                        <div className="node-status"><span className="status-dot green"></span>Neon Serverless DB</div>
                      </div>
                      <div className="diagram-node node-cache">
                        <div className="node-icon">💾</div>
                        <div className="node-title">Two-Tier Cache Hub</div>
                        <div className="node-details">RAM Miss ➔ DB Miss ➔ API Fetch</div>
                        <div className="node-status"><span className="status-dot gold"></span>1m Rates / 5m Historical Cache</div>
                      </div>
                    </div>
                  </div>

                  <div className="diagram-path"><div className="path-line pulse-down"></div></div>

                  {/* Layer 4: Cognitive & External Services */}
                  <div className="diagram-layer">
                    <div className="layer-title">External Integration & Cognitive AI Tier</div>
                    <div className="nodes-row flex-three">
                      <div className="diagram-node node-external">
                        <div className="node-icon">🌐</div>
                        <div className="node-title">Market & News Feeds</div>
                        <div className="node-details">CoinGecko, GoldAPI, Global News</div>
                        <div className="node-status"><span className="status-dot blue"></span>External API Integration</div>
                      </div>
                      <div className="diagram-node node-ai">
                        <div className="node-icon">🧠</div>
                        <div className="node-title">Cognitive AI Models</div>
                        <div className="node-details">GPT-OSS 120B + FinBERT NLP</div>
                        <div className="node-status"><span className="status-dot gold"></span>FinBERT Sentiment NLP</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <hr className="docs-divider" />

            {/* Section 3: AI Cognitive Pipeline */}
            <div id="docs-ai-pipeline" className="docs-section">
              <span className="section-tag">03 / COGNITIVE AI PIPELINE</span>
              <h2>Advanced AI Ingestion & Grounding Pipeline</h2>
              <p className="section-desc">FinPilot coordinates textual semantics and numerical vectors using a robust multi-tiered cognitive framework.</p>
              
              <div className="pipeline-flow">
                <div className="pipeline-step">
                  <div className="step-num">A</div>
                  <div className="step-content">
                    <h4>Primary NLP: HuggingFace FinBERT Model</h4>
                    <p>Financial media is highly nuanced. The system ingests crawled articles and streams them through the <code>ProsusAI/finbert</code> NLP model. It evaluates word semantics to output precise weights: Positive, Negative, and Neutral. Sentiment signals are stored alongside articles in Neon PostgreSQL.</p>
                  </div>
                </div>
                
                <div className="pipeline-step">
                  <div className="step-num">B</div>
                  <div className="step-content">
                    <h4>Zero-Downtime Fallback: Groq GPT-OSS 120B</h4>
                    <p>If the primary HuggingFace sentiment API hits rate limits or authorization constraints (e.g. HTTP 403), the system triggers an instantaneous fallback. It routes the text to the ultra-low latency Groq <code>openai/gpt-oss-120b</code> engine, requesting response formatting as a strictly validated JSON structure.</p>
                  </div>
                </div>
                
                <div className="pipeline-step">
                  <div className="step-num">C</div>
                  <div className="step-content">
                    <h4>Grounded Assistant: Groq GPT-OSS 120B</h4>
                    <p>For dialog interactions, the assistant calls the high-capacity <code>openai/gpt-oss-120b</code> model via Groq. It processes financial data vectors, evaluates market news metrics, maintains dialogue state across a 10-turn sliding history buffer, and formulates precise analytical replies.</p>
                  </div>
                </div>
                
                <div className="pipeline-step">
                  <div className="step-num">D</div>
                  <div className="step-content">
                    <h4>Time-Based RAG Injection</h4>
                    <p>The chatbot employs a fast keyword extractor to intercept asset tickers (e.g., BTC, Gold) from user prompts. It bypasses complex vector embeddings by querying the PostgreSQL database directly, strictly filtering by <code>publishedAt DESC</code>. This ultra-fresh market context and live portfolio data is dynamically pre-pended to the AI system prompt, effectively eliminating hallucinations.</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="docs-divider" />

            {/* Section 4: Technical Indicators Mathematics */}
            <div id="docs-indicators" className="docs-section">
              <span className="section-tag">04 / ALGORITHMIC INDICATORS</span>
              <h2>Asset Indicator Mathematics Engine</h2>
              <p className="section-desc">To formulate BUY, SELL, or HOLD recommendations, FinPilot calculates high-precision technical indicator vectors over 30-day market price sequences.</p>
              
              <div className="math-grid">
                
                {/* RSI */}
                <div className="math-card">
                  <div className="math-card-header">
                    <span className="math-badge blue">Momentum</span>
                    <h4>Relative Strength Index (RSI - 14 Period)</h4>
                  </div>
                  <p className="math-description">Evaluates velocity and magnitude of price changes to identify overbought or oversold boundaries.</p>
                  <div className="formula-box">
                    RSI = 100 - [ 100 / (1 + RS) ]
                  </div>
                  <div className="math-legend">
                    <p><strong>RS (Relative Strength)</strong> = Average Gain of 14 periods / Average Loss of 14 periods.</p>
                    <p><span className="label-trigger buy">RSI &lt; 30</span>: Oversold boundary ➔ Triggers <strong>BUY</strong> signal.</p>
                    <p><span className="label-trigger sell">RSI &gt; 70</span>: Overbought boundary ➔ Triggers <strong>SELL</strong> signal.</p>
                  </div>
                </div>

                {/* MACD */}
                <div className="math-card">
                  <div className="math-card-header">
                    <span className="math-badge green">Trend Following</span>
                    <h4>Moving Average Convergence Divergence (MACD)</h4>
                  </div>
                  <p className="math-description">Tracks relationship between two Exponential Moving Averages (EMA) of asset closed prices.</p>
                  <div className="formula-box">
                    MACD = EMA₁₂ (Close) - EMA₂₆ (Close)<br />
                    Signal = EMA₉ (MACD)
                  </div>
                  <div className="math-legend">
                    <p><strong>Histogram</strong> = MACD Line - Signal Line.</p>
                    <p><span className="label-trigger buy">MACD &gt; Signal</span>: Bullish crossover ➔ Triggers <strong>BUY</strong> cue.</p>
                    <p><span className="label-trigger sell">MACD &lt; Signal</span>: Bearish crossover ➔ Triggers <strong>SELL</strong> cue.</p>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="math-card">
                  <div className="math-card-header">
                    <span className="math-badge gold">Volatility</span>
                    <h4>Bollinger Bands (20-Period SD)</h4>
                  </div>
                  <p className="math-description">Establishes upper and lower threshold bands offset by standard deviations around an asset's moving average.</p>
                  <div className="formula-box">
                    Middle Band = SMA₂₀ (Close)<br />
                    Upper / Lower = Middle Band ± (2 × σ₂₀)
                  </div>
                  <div className="math-legend">
                    <p><strong>σ₂₀</strong> = 20-period historical closed standard deviation.</p>
                    <p><span className="label-trigger buy">Price &le; Lower Band</span>: Support breach ➔ Triggers <strong>BUY</strong> signal.</p>
                    <p><span className="label-trigger sell">Price &ge; Upper Band</span>: Resistance breach ➔ Triggers <strong>SELL</strong> signal.</p>
                  </div>
                </div>

                {/* OBV */}
                <div className="math-card">
                  <div className="math-card-header">
                    <span className="math-badge red">Volume Dynamics</span>
                    <h4>On-Balance Volume (OBV)</h4>
                  </div>
                  <p className="math-description">Combines asset volume and price action to determine cumulative buying or selling pressure.</p>
                  <div className="formula-box">
                    OBV_t = OBV_&#123;t-1&#125; &#177; Volume_t
                  </div>
                  <div className="math-legend">
                    <p><strong>+ Volume_t</strong>: If current close &gt; previous close.</p>
                    <p><strong>- Volume_t</strong>: If current close &lt; previous close.</p>
                    <p>Indicates whether institutional capital is accumulating or distributing.</p>
                  </div>
                </div>

              </div>
            </div>

            <hr className="docs-divider" />

            {/* Section 5: Standby Logic & Cost Savings */}
            <div id="docs-standby" className="docs-section">
              <span className="section-tag">05 / RESOURCE OPTIMIZATION</span>
              <h2>Client-Aware Standby Engine & Cost Savings</h2>
              <p className="section-desc">FinPilot implements a custom cost-saving topology specifically optimized for cloud container runtimes (like Render and Railway) to bypass rate limitations and reduce resource exhaustion.</p>
              
              <div className="standby-card">
                <div className="standby-header">
                  <div className="standby-status-bulb connected"></div>
                  <h4>Active-Client Sensing Architecture</h4>
                </div>
                
                <div className="standby-grid">
                  <div className="standby-box">
                    <span className="icon">💤</span>
                    <h5>1. Inactivity Standby</h5>
                    <p>Background jobs (5-minute media crawler, hourly portfolio analyzer) query the WebSocket status before doing heavy lifting. If <code>getClientCount() === 0</code>, all fetches, LLM evaluations, and database operations are instantly skipped.</p>
                  </div>
                  <div className="standby-box">
                    <span className="icon">⚡</span>
                    <h5>2. Instant Connection Wake</h5>
                    <p>When a user opens the browser interface, the WebSocket listener detects the connection, instantly wakes the container, and initiates a rates refresh, crawling headlines, scoring sentiments, and broadcasting the data.</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="docs-divider" />

            {/* Section 6: API Endpoints */}
            <div id="docs-api" className="docs-section">
              <span className="section-tag">06 / DEVELOPER API REFERENCE</span>
              <h2>Unified Backend API Directory</h2>
              <p className="section-desc">Explore the REST API endpoints exposed by the FinPilot Express server to interact with portfolios, AI chat agents, and sentiment news caches.</p>
              
              <div className="api-deck">
                
                {/* GET /api/portfolio */}
                <div className="api-item">
                  <div className="api-header">
                    <span className="api-badge get">GET</span>
                    <span className="api-route">/api/portfolio</span>
                    <span className="api-summary">Retrieve active portfolio assets &amp; current values</span>
                  </div>
                  <div className="api-details">
                    <p>Retrieves all user positions, fetches real-time prices (CoinGecko / GoldAPI), calculates profit/loss values, and lists timestamps.</p>
                    <pre><code>{`{
  "success": true,
  "data": [
    {
      "id": "c1a6b09e-7119-4a34-be57-4148e6580f1d",
      "assetName": "Bitcoin",
      "symbol": "BTC",
      "assetType": "CRYPTO",
      "amount": 0.25,
      "buyingPrice": 62500.00,
      "currentPrice": 68450.50,
      "profitDecimal": 1487.625
    }
  ]
}`}</code></pre>
                  </div>
                </div>

                {/* POST /api/portfolio/add */}
                <div className="api-item">
                  <div className="api-header">
                    <span className="api-badge post">POST</span>
                    <span className="api-route">/api/portfolio/add</span>
                    <span className="api-summary">Create or update asset holdings</span>
                  </div>
                  <div className="api-details">
                    <p>Adds a new position or adjusts current metrics in the user portfolio database.</p>
                    <div className="param-title">Request Payload:</div>
                    <pre><code>{`{
  "assetName": "Ethereum",
  "symbol": "ETH",
  "assetType": "CRYPTO",
  "amount": 1.5,
  "buyingPrice": 3120.00
}`}</code></pre>
                  </div>
                </div>

                {/* POST /api/chat */}
                <div className="api-item">
                  <div className="api-header">
                    <span className="api-badge post">POST</span>
                    <span className="api-route">/api/chat</span>
                    <span className="api-summary">Interact with Groq GPT-OSS 120B Chatbot</span>
                  </div>
                  <div className="api-details">
                    <p>Sends queries to the cognitive Groq GPT-OSS 120B chat assistant, maintaining multi-turn context indices.</p>
                    <div className="param-title">Request Payload:</div>
                    <pre><code>{`{
  "message": "What is the positive or negative sentiment impact on ETH today?",
  "conversationId": "7e3b5a19-b223-4554-b4a1-b8471e991204"
}`}</code></pre>
                  </div>
                </div>

                {/* GET /api/news */}
                <div className="api-item">
                  <div className="api-header">
                    <span className="api-badge get">GET</span>
                    <span className="api-route">/api/news</span>
                    <span className="api-summary">Retrieve cached financial sentiment news</span>
                  </div>
                  <div className="api-details">
                    <p>Queries database for parsed news articles, positive/negative sentiment weights, and relevance scores sorted by publication dates.</p>
                  </div>
                </div>

              </div>
            </div>

            <hr className="docs-divider" />

            {/* Section 7: Tech Stack */}
            <div id="docs-techstack" className="docs-section">
              <span className="section-tag">07 / TECH STACK & TOPO</span>
              <h2>Core Technical Stack Details</h2>
              <p className="section-desc">FinPilot combines industry-standard frameworks, serverless datastores, low-latency AI inference channels, and secure cloud topologies.</p>
              
              <div className="tech-grid">
                <div className="tech-card-mini">
                  <span className="tech-icon">🟢</span>
                  <div className="tech-info">
                    <h5>TypeScript Node.js</h5>
                    <p>Server architecture & type safety</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">⚡</span>
                  <div className="tech-info">
                    <h5>Express.js</h5>
                    <p>REST Router & SSE Gateway</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">⬡</span>
                  <div className="tech-info">
                    <h5>Prisma ORM</h5>
                    <p>Type-safe schema modeling</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">🐘</span>
                  <div className="tech-info">
                    <h5>Neon PostgreSQL</h5>
                    <p>Serverless relational database</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">🤖</span>
                  <div className="tech-info">
                    <h5>GPT-OSS 120B</h5>
                    <p>Advanced LLM cognitive engine</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">🚀</span>
                  <div className="tech-info">
                    <h5>Groq SDK</h5>
                    <p>Ultra-low latency AI inference</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">🤗</span>
                  <div className="tech-info">
                    <h5>Hugging Face</h5>
                    <p>FinBERT model for NLP sentiment</p>
                  </div>
                </div>
                <div className="tech-card-mini">
                  <span className="tech-icon">☁️</span>
                  <div className="tech-info">
                    <h5>Render + Vercel</h5>
                    <p>Dual-cloud app hosting setup</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  </div>

  {/* ================= ADD ASSET MODAL ================= */}
  <div className="modal-overlay" id="add-asset-modal">
    <div className="modal-card">
      <div className="modal-header">
        <h3>Add Position to Portfolio</h3>
        <button className="close-btn" id="close-add-asset-btn">&times;</button>
      </div>
      <form id="add-asset-form">
        <div className="form-group">
          <label htmlFor="asset-name">Asset Name</label>
          <input type="text" id="asset-name" placeholder="e.g. Bitcoin" required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="asset-type">Asset Type</label>
            <select id="asset-type" required>
              <option value="CRYPTO">Crypto</option>
              <option value="METAL">Precious Metal</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="asset-symbol">Symbol</label>
            <input type="text" id="asset-symbol" placeholder="e.g. BTC" required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="asset-amount">Holdings (Amount)</label>
            <input type="number" id="asset-amount" step="any" min="0" placeholder="e.g. 0.05" required />
          </div>
          <div className="form-group">
            <label htmlFor="asset-price">Buying Price ($)</label>
            <input type="number" id="asset-price" step="any" min="0" placeholder="e.g. 58200" required />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" id="cancel-add-asset-btn">Cancel</button>
          <button type="submit" className="btn btn-primary">Add Position</button>
        </div>
      </form>
    </div>
  </div>

  {/* ================= UPDATE ASSET MODAL ================= */}
  <div className="modal-overlay" id="update-asset-modal">
    <div className="modal-card">
      <div className="modal-header">
        <h3>Update Position</h3>
        <button className="close-btn" id="close-update-asset-btn">&times;</button>
      </div>
      <form id="update-asset-form">
        <input type="hidden" id="update-asset-id" />
        <div className="form-group">
          <label>Asset Position</label>
          <div className="static-value" id="update-asset-name-static">Bitcoin (BTC)</div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="update-asset-amount">Holdings (Optional)</label>
            <input type="number" id="update-asset-amount" step="any" min="0" placeholder="Keep current or enter new amount" />
          </div>
          <div className="form-group">
            <label htmlFor="update-asset-price">Buying Price (Optional)</label>
            <input type="number" id="update-asset-price" step="any" min="0" placeholder="Keep current or enter new buy price" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" id="cancel-update-asset-btn">Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  


  {/* ================= SYNC WALLET MODAL ================= */}
  <div className="modal-overlay" id="sync-wallet-modal">
    <div className="modal-card" style={{maxWidth: '640px', width: '100%'}}>
      <div className="modal-header">
        <h3>⟳ Sync Wallet Holdings</h3>
        <button className="close-btn" id="close-sync-wallet-btn">&times;</button>
      </div>
      <div style={{display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px'}}>
        <button id="sync-tab-wallet" data-sync-tab="wallet" style={{padding: '10px 20px', background: 'none', border: 'none', borderBottom: '2px solid var(--accent-blue)', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: '600', fontSize: '13px'}}>🔗 From Wallet Address</button>
        <button id="sync-tab-manual" data-sync-tab="manual" style={{padding: '10px 20px', background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '13px'}}>✏️ Manual Entry</button>
      </div>
      <div id="sync-panel-wallet">
        <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6'}}>Enter an <strong>Ethereum / EVM wallet address</strong> to auto-fetch your token balances. Detected holdings will be pre-filled for review before syncing.</p>
        <div className="form-group">
          <label htmlFor="wallet-address-input">Wallet Address (0x...)</label>
          <div style={{display: 'flex', gap: '10px'}}>
            <input type="text" id="wallet-address-input" placeholder="0xAbC123..." style={{flex: 1}} />
            <button className="btn btn-secondary" id="fetch-wallet-btn" style={{whiteSpace: 'nowrap'}}>Fetch Holdings</button>
          </div>
        </div>
        <div id="wallet-fetch-status" style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', minHeight: '18px'}}></div>
      </div>
      <div id="sync-panel-manual" style={{display: 'none'}}>
        <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: '1.6'}}>Add your crypto holdings manually. Existing symbols will have their <strong>amount updated</strong>; new ones will be <strong>added at current market price</strong>.</p>
      </div>
      <div style={{marginTop: '16px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
          <span style={{fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Holdings to Sync</span>
          <button id="sync-add-row-btn" className="btn btn-secondary small" style={{fontSize: '11px', padding: '4px 12px'}}>+ Add Row</button>
        </div>
        <div style={{overflowX: 'auto', overflowY: 'auto', maxHeight: '300px', borderBottom: '1px solid var(--border-color)'}}>
          <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
            <thead style={{position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1}}>
              <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                <th style={{padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', fontSize: '11px'}}>SYMBOL</th>
                <th style={{padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', fontSize: '11px'}}>ASSET NAME</th>
                <th style={{padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', fontSize: '11px'}}>TYPE</th>
                <th style={{padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', fontSize: '11px'}}>AMOUNT</th>
                <th style={{padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '500', fontSize: '11px'}}>BUY PRICE ($)</th>
                <th style={{padding: '8px 6px'}}></th>
              </tr>
            </thead>
            <tbody id="sync-holdings-body"></tbody>
          </table>
        </div>
        <div id="sync-empty-state" style={{textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px'}}>No holdings added yet. Fetch from wallet or add rows manually.</div>
      </div>
      <div id="sync-result-banner" style={{display: 'none', marginTop: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '13px'}}></div>
      <div className="modal-footer" style={{marginTop: '20px'}}>
        <button type="button" className="btn btn-secondary" id="cancel-sync-wallet-btn">Cancel</button>
        <button type="button" className="btn btn-primary" id="confirm-sync-wallet-btn">⟳ Sync to Portfolio</button>
      </div>
    </div>
  </div>

      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
      <Script src="/app.js" strategy="afterInteractive" />

    </>
  );
}
