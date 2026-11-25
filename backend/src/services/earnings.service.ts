import Groq from 'groq-sdk';
import axios from 'axios';
import YahooFinanceClass from 'yahoo-finance2';

const yahooFinance = new YahooFinanceClass();
import { config } from '../config/config';
import { logger } from '../utils/logger';
import prisma from '../config/database';
import sentimentService from './sentiment.service';

class EarningsService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: config.apiKeys.groq });
  }

  async analyzeCall(ticker: string, audioUrl: string, callDate: string): Promise<any> {
    logger.info(`Starting earnings call analysis for ${ticker} on ${callDate}`);

    // 1. Fetch quote for company name and priceT0
    let company = ticker;
    let priceT0: number | null = null;

    try {
      const quote: any = await yahooFinance.quote(ticker);
      company = quote.longName || quote.shortName || ticker;
      priceT0 = quote.regularMarketPrice ?? null;
    } catch (err) {
      logger.warn(`Failed to fetch Yahoo quote for ${ticker}:`, err);
    }

    // 2. Transcribe audio using Groq Whisper
    logger.info(`Downloading audio from ${audioUrl}`);
    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(audioResponse.data);

    const file = new File([audioBuffer], 'earnings.mp3', { type: 'audio/mpeg' });
    const transcription = await this.groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      response_format: 'text',
      language: 'en',
    });
    const transcript = transcription as unknown as string;
    logger.info(`Transcription complete (${transcript.length} chars)`);

    return this.analyzeTranscriptAndSave(ticker, company, callDate, audioUrl, transcript, priceT0);
  }

  /**
   * Run a realistic demo earnings call stress analysis without requiring an external MP3 URL.
   */
  async runDemoAnalysis(): Promise<any> {
    const ticker = 'AAPL';
    const demoDate = new Date();
    demoDate.setDate(demoDate.getDate() - 14);
    const callDate = demoDate.toISOString().split('T')[0];

    let company = 'Apple Inc.';
    let priceT0: number | null = null;
    try {
      const quote: any = await yahooFinance.quote(ticker);
      company = quote.longName || quote.shortName || company;
      priceT0 = quote.regularMarketPrice ?? null;
    } catch (err) {
      logger.warn('Demo Yahoo quote fallback:', err);
    }

    const demoTranscript =
      `Thank you everyone for joining today's Q4 call. Overall revenue grew steadily, though, um, we are seeing ` +
      `some headwinds in Greater China and, I mean, supply chain timing is—well, it's slightly tighter than we ` +
      `anticipated last quarter. Looking at gross margins, we expect them to hold around 45%, or perhaps 44.5% ` +
      `depending on component costs—we'll see how foreign exchange moves over the next several weeks. ` +
      `In Services, uh, engagement hit an all-time high, and maybe we can accelerate AI hardware upgrades earlier ` +
      `than consensus expects, though I think guidance remains prudent given macro uncertainty.`;

    return this.analyzeTranscriptAndSave(
      ticker,
      company,
      callDate,
      'demo://aapl-q4-earnings-qa',
      demoTranscript,
      priceT0
    );
  }

  private async analyzeTranscriptAndSave(
    ticker: string,
    company: string,
    callDate: string,
    audioUrl: string,
    transcript: string,
    initialPriceT0: number | null
  ): Promise<any> {
    let priceT0 = initialPriceT0;

    // 3. Run linguistic stress analysis via Groq LLM
    const truncatedTranscript = transcript.substring(0, 6000);
    let hedgeWordCount = 0;
    let correctionCount = 0;
    let linguisticStress = 0;
    let stressPassages: Array<{ quote: string; reason: string }> = [];

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'system',
            content:
              'Analyze this earnings call transcript for executive stress signals. Return ONLY valid JSON with keys: hedgeWordCount (integer, count of um/uh/you know/I think/maybe/perhaps/we\'ll see), correctionCount (integer, times speaker corrects themselves mid-sentence), overallLinguisticStress (integer 0-100), stressPassages (array of max 3 objects with: quote string, reason string)',
          },
          {
            role: 'user',
            content: truncatedTranscript,
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);
      hedgeWordCount = typeof parsed.hedgeWordCount === 'number' ? parsed.hedgeWordCount : 0;
      correctionCount = typeof parsed.correctionCount === 'number' ? parsed.correctionCount : 0;
      linguisticStress =
        typeof parsed.overallLinguisticStress === 'number' ? parsed.overallLinguisticStress : 0;
      stressPassages = Array.isArray(parsed.stressPassages) ? parsed.stressPassages.slice(0, 3) : [];
    } catch (err) {
      logger.warn('Groq linguistic stress analysis failed, using defaults:', err);
    }

    // 4. FinBERT sentiment on first 512 chars
    const sentimentResult = await sentimentService.analyzeSentiment(transcript.substring(0, 512));
    const sentimentLabel = sentimentResult.label;
    const sentimentScore = sentimentResult.score;

    // 5. Fetch price history for T0/T1/T5
    let priceT1: number | null = null;
    let priceT5: number | null = null;
    let moveT1Pct: number | null = null;
    let moveT5Pct: number | null = null;

    try {
      const callDateObj = new Date(callDate);
      const endDate = new Date(callDate);
      endDate.setDate(endDate.getDate() + 8);

      const historical: any[] = (await yahooFinance.historical(ticker, {
        period1: callDateObj.toISOString().split('T')[0],
        period2: endDate.toISOString().split('T')[0],
        interval: '1d',
      })) as any[];

      if (historical && historical.length >= 1) {
        priceT0 = historical[0].close ?? priceT0;
      }
      if (historical && historical.length >= 2) {
        priceT1 = historical[1].close ?? null;
      }
      if (historical && historical.length >= 6) {
        priceT5 = historical[5].close ?? null;
      }

      if (priceT0 && priceT1) {
        moveT1Pct = ((priceT1 - priceT0) / priceT0) * 100;
      }
      if (priceT0 && priceT5) {
        moveT5Pct = ((priceT5 - priceT0) / priceT0) * 100;
      }
    } catch (err) {
      logger.warn(`Failed to fetch price history for ${ticker}:`, err);
    }

    // 6. Compute composite stressScore
    const stressScore = Math.min(
      100,
      Math.round(linguisticStress * 0.6 + (sentimentScore < 0 ? Math.abs(sentimentScore) * 40 : 0))
    );

    // 7. Save to EarningsCall model
    const record = await prisma.earningsCall.create({
      data: {
        ticker: ticker.toUpperCase(),
        company,
        callDate: new Date(callDate),
        audioUrl,
        transcript,
        stressScore,
        sentimentLabel,
        sentimentScore,
        hedgeWordCount,
        correctionCount,
        stressPassages: stressPassages as any,
        priceT0,
        priceT1,
        priceT5,
        moveT1Pct,
        moveT5Pct,
      },
    });

    logger.info(`Earnings call analysis saved for ${ticker} with stressScore=${stressScore}`);
    return record;
  }

  async getCallsByTicker(ticker: string, limit = 20): Promise<any[]> {
    return prisma.earningsCall.findMany({
      where: { ticker: ticker.toUpperCase() },
      orderBy: { callDate: 'desc' },
      take: limit,
    });
  }

  async getTopStressed(limit = 10): Promise<any[]> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return prisma.earningsCall.findMany({
      where: {
        callDate: { gte: ninetyDaysAgo },
      },
      orderBy: { stressScore: 'desc' },
      take: limit,
    });
  }

  async compareData(): Promise<any[]> {
    const records = await prisma.earningsCall.findMany({
      where: {
        moveT5Pct: { not: undefined },
      },
      select: {
        id: true,
        ticker: true,
        company: true,
        callDate: true,
        stressScore: true,
        moveT5Pct: true,
        sentimentLabel: true,
      },
      orderBy: { callDate: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      ticker: r.ticker,
      company: r.company,
      callDate: r.callDate,
      stressScore: r.stressScore,
      moveT5Pct: r.moveT5Pct,
      sentimentLabel: r.sentimentLabel,
    }));
  }
}

export default new EarningsService();
