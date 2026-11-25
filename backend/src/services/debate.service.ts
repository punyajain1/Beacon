import Groq from 'groq-sdk';
import axios from 'axios';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import cacheService from './cache.service';
import YahooFinanceClass from 'yahoo-finance2';

const yahooFinance = new YahooFinanceClass();

export interface DebateResult {
  ticker: string;
  stockPrice: number;
  companyName: string;
  bullArg: string;
  bearArg: string;
  verdict: string;
  winner: 'BULL' | 'BEAR' | 'DRAW';
  sources: string[];
  createdAt: Date;
}

class DebateService {
  private groq: Groq;
  private model = 'qwen/qwen3.8-27b';
  private secUserAgent = 'Beacon/1.0 beacon-app@gmail.com';

  constructor() {
    this.groq = new Groq({ apiKey: config.apiKeys.groq });
  }

  async runDebate(ticker: string): Promise<DebateResult> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `debate:${ticker.toUpperCase()}:${today}`;

    // 1. Check cache
    const cached = await cacheService.get<DebateResult>(cacheKey);
    if (cached) {
      logger.info(`Cache hit for debate: ${ticker}`);
      return cached;
    }

    logger.info(`Starting debate for ticker: ${ticker}`);

    // 2. Fetch stock quote from Yahoo Finance
    let stockData: any = {};
    let stockPrice = 0;
    try {
      const quote = await yahooFinance.quote(ticker, {
        fields: [
          'regularMarketPrice',
          'trailingPE',
          'marketCap',
          'totalRevenue',
          'epsTrailingTwelveMonths',
          'fiftyTwoWeekHigh',
          'fiftyTwoWeekLow',
        ] as any,
      });
      stockData = quote;
      stockPrice = (quote as any).regularMarketPrice ?? 0;
      logger.debug(`Yahoo Finance quote fetched for ${ticker}`);
    } catch (err) {
      logger.warn(`Yahoo Finance fetch failed for ${ticker}: ${err}`);
    }

    // 3. Fetch SEC CIK
    let cik = '';
    let companyName = ticker;
    let secFilings: { date: string; description: string }[] = [];
    try {
      const searchResp = await axios.get(
        `https://efts.sec.gov/LATEST/search-index?q="${ticker}"&forms=10-K`,
        {
          headers: { 'User-Agent': this.secUserAgent },
          timeout: 8000,
        },
      );
      const hits = searchResp.data?.hits?.hits;
      if (hits && hits.length > 0) {
        const firstHit = hits[0];
        cik = firstHit?._source?.period_of_report
          ? firstHit?._id?.split(':')[0]
          : firstHit?._source?.entity_id || firstHit?._source?.cik || '';
        // Try alternative extraction
        if (!cik) {
          cik = firstHit?._source?.cik || '';
        }
        companyName = firstHit?._source?.display_names?.[0] || ticker;
      }
      logger.debug(`SEC CIK for ${ticker}: ${cik}`);
    } catch (err) {
      logger.warn(`SEC EDGAR search failed for ${ticker}: ${err}`);
    }

    // 4. Fetch SEC submissions using CIK
    if (cik) {
      try {
        const paddedCik = cik.toString().padStart(10, '0');
        const submissionsResp = await axios.get(
          `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
          {
            headers: { 'User-Agent': this.secUserAgent },
            timeout: 8000,
          },
        );
        const data = submissionsResp.data;
        if (data.name) companyName = data.name;
        const recentFilings = data?.filings?.recent;
        if (recentFilings) {
          const forms: string[] = recentFilings.form || [];
          const dates: string[] = recentFilings.filingDate || [];
          const descriptions: string[] = recentFilings.primaryDocDescription || [];
          // Get last 3 filings
          for (let i = 0; i < Math.min(3, forms.length); i++) {
            secFilings.push({ date: dates[i] || '', description: `${forms[i]}: ${descriptions[i] || 'N/A'}` });
          }
        }
        logger.debug(`SEC submissions fetched for ${ticker}`);
      } catch (err) {
        logger.warn(`SEC submissions fetch failed for CIK ${cik}: ${err}`);
      }
    }

    // 5. Build context string
    const context = `
STOCK: ${ticker.toUpperCase()} — ${companyName}
Current Price: $${stockPrice}
Trailing P/E: ${stockData.trailingPE ?? 'N/A'}
Market Cap: ${stockData.marketCap ? `$${(stockData.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
Total Revenue: ${stockData.totalRevenue ? `$${(stockData.totalRevenue / 1e9).toFixed(2)}B` : 'N/A'}
EPS (TTM): ${stockData.epsTrailingTwelveMonths ?? 'N/A'}
52-Week High: ${stockData.fiftyTwoWeekHigh ?? 'N/A'}
52-Week Low: ${stockData.fiftyTwoWeekLow ?? 'N/A'}

RECENT SEC FILINGS:
${secFilings.length > 0 ? secFilings.map(f => `  - [${f.date}] ${f.description}`).join('\n') : '  No recent SEC filings found.'}
`.trim();

    // 6. Bull Agent call
    logger.info(`Running Bull agent for ${ticker}`);
    const bullCompletion = await this.groq.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are an aggressive, bullish Wall Street analyst. Using ONLY the provided data, make the strongest possible buy case in 250 words. Focus on growth catalysts, competitive moats, and upside scenarios.',
        },
        {
          role: 'user',
          content: `Here is the data:\n\n${context}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 512,
    });
    const bullArg = bullCompletion.choices[0]?.message?.content ?? 'No bull argument generated.';

    // 7. Bear Agent call
    logger.info(`Running Bear agent for ${ticker}`);
    const bearCompletion = await this.groq.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a skeptical, bearish analyst. Using ONLY the provided data, make the strongest possible sell/avoid case in 250 words. Focus on risks, overvaluation, and downside scenarios.',
        },
        {
          role: 'user',
          content: `Here is the data:\n\n${context}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 512,
    });
    const bearArg = bearCompletion.choices[0]?.message?.content ?? 'No bear argument generated.';

    // 8. Judge call
    logger.info(`Running Judge for ${ticker}`);
    const judgeCompletion = await this.groq.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            "You are an impartial senior analyst. Given the bull and bear arguments below, declare a winner (BULL, BEAR, or DRAW) and explain your reasoning in 150 words. Start your response with 'WINNER: BULL', 'WINNER: BEAR', or 'WINNER: DRAW'.",
        },
        {
          role: 'user',
          content: `Stock Data:\n${context}\n\nBULL ARGUMENT:\n${bullArg}\n\nBEAR ARGUMENT:\n${bearArg}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 384,
    });
    const verdict = judgeCompletion.choices[0]?.message?.content ?? 'No verdict generated.';

    // 9. Parse winner
    const winnerMatch = verdict.match(/WINNER:\s*(BULL|BEAR|DRAW)/i);
    const winner: 'BULL' | 'BEAR' | 'DRAW' = winnerMatch
      ? (winnerMatch[1].toUpperCase() as 'BULL' | 'BEAR' | 'DRAW')
      : 'DRAW';

    const sources = [
      `https://finance.yahoo.com/quote/${ticker}`,
      ...(cik ? [`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=10-K`] : []),
    ];

    // 10. Save to StockDebate
    const savedDebate = await prisma.stockDebate.create({
      data: {
        ticker: ticker.toUpperCase(),
        bullArg,
        bearArg,
        verdict,
        winner,
        stockPrice,
        sources,
      },
    });
    logger.info(`StockDebate saved for ${ticker}, winner: ${winner}`);

    const result: DebateResult = {
      ticker: savedDebate.ticker,
      stockPrice: savedDebate.stockPrice,
      companyName,
      bullArg: savedDebate.bullArg,
      bearArg: savedDebate.bearArg,
      verdict: savedDebate.verdict,
      winner: savedDebate.winner as 'BULL' | 'BEAR' | 'DRAW',
      sources: savedDebate.sources,
      createdAt: savedDebate.createdAt,
    };

    // 11. Cache result for 24 hours
    await cacheService.set(cacheKey, result, 86400);

    return result;
  }

  async getDebateHistory(ticker: string, limit = 10): Promise<any[]> {
    return prisma.stockDebate.findMany({
      where: { ticker: ticker.toUpperCase() },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default new DebateService();
