<h1 align="center">Beacon Backend</h1>

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Groq%20SDK-f55e5b?style=for-the-badge" alt="Groq SDK">
</div>

<br>

> **Beacon Backend API** built with Node.js, Express, TypeScript, Prisma, WebSockets, Groq (`qwen/qwen3.8-27b` & `whisper-large-v3`), and Hugging Face Gradio-hosted `ProsusAI/finbert`.

---

## Key Capabilities

- **Portfolio & Recommendations (`/api/portfolio`)**: Real-time tracking, deterministic technical indicators (RSI, MACD, Bollinger Bands), and grounded AI recommendations.
- **On-Demand News & FinBERT Sentiment (`/api/news`)**: Multi-feed RSS + News APIs streamed over `/ws/news`. Sentiment runs on demand for a single article (`POST /api/news/:id/sentiment`) or the 10 most recent articles (`POST /api/news/sentiment/recent`) via `src/models/finbert.model.ts`.
- **Bull vs Bear AI Debate (`/api/debate`)**: Yahoo Finance + SEC EDGAR grounding with Bull, Bear, and Judge agents.
- **Insider Cluster Radar (`/api/insider`)**: SEC EDGAR Form 4 XML parser detecting 7-day open-market (`P`) buy clusters (`POST /api/insider/scan`, `GET /api/insider/alerts`, `GET /api/insider/filings`).
- **Money Mule Ring Detector (`/api/fraud`)**: Graphology cycle/structuring detection on CSV or JSON transactions.
- **Earnings Call Stress (`/api/earnings`)**: Whisper audio transcription + linguistic stress scoring + T+1/T+5 price tracking.
- **India Hub, Derivatives & Simulator**: `/api/india`, `/api/derivatives`, `/api/simulation`, `/api/chat`.

---

## Directory Structure

```text
src/
├── config/         # Env validation & Prisma client
├── controllers/    # Express route handlers
├── middleware/     # Validation, rate limiting, error handling
├── models/         # External ML model clients (finbert.model.ts)
├── routes/         # REST API routes mounted under /api
├── services/       # Core services (news, sentiment, debate, insider, fraud, earnings, etc.)
├── types/          # TypeScript types
└── utils/          # Winston logger
```

---

## Getting Started

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Set at minimum:
   - `PORT=4000`
   - `DATABASE_URL` (PostgreSQL connection string)
   - `GROQ_API_KEY`
   - `FINBERT_GRADIO_URL` (e.g. `Punya01/finbret` or `https://your-space.hf.space`)

3. **Push Prisma schema & generate client**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:4000` (REST at `/api`, WebSocket at `/ws/news`).
