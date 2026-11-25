# Beacon Frontend

Next.js 16 (App Router) dashboard for **Beacon**, communicating with the Express backend over REST (`http://localhost:4000/api`) and WebSocket (`ws://localhost:4000/ws/news`).

## Stack
- Next.js 16 / React 19
- Tailwind CSS v4
- Framer Motion, Recharts, `react-force-graph-2d`, Lucide React

## Views
- **Dashboard**: Portfolio overview, Fear & Greed Index, Market Stats, Holdings table
- **News**: Live RSS/WebSocket stream with on-demand FinBERT sentiment (single article or latest 10)
- **AI Debate**: Bull vs Bear vs Judge multi-agent stock debate
- **Insider Radar**: SEC Form 4 open-market buys and 7-day cluster alerts
- **Mule Rings**: Interactive transaction fraud ring graph & CSV ingestion
- **Earnings Stress**: Audio stress gauge & T+1/T+5 stock move scatter plot
- **Recommendations, Simulator, India Hub, Futures, Chatbot, Docs**

## Running Locally

Ensure the backend is running on port `4000`, then:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.
