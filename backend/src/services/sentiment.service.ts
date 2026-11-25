import Groq from 'groq-sdk';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import cacheService from './cache.service';
import finbertModel, { FinBertScore } from '../models/finbert.model';

export interface SentimentResult {
  score: number; // -1 to 1 (negative to positive)
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
  details?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/**
 * Service for analyzing financial sentiment.
 * Primary: ProsusAI/finbert hosted on a free Hugging Face Gradio Space (via finbert.model.ts).
 * Fallback: Rate-limited Groq LLM if Gradio Space is unconfigured or unavailable.
 */
class SentimentService {
  private groq: Groq;
  private groqQueue: Promise<void> = Promise.resolve();
  private groqLastCallAt = 0;
  private readonly GROQ_MIN_INTERVAL_MS = 2100; // Stay under Groq 30 RPM free tier
  private warnedMissingGradio = false;

  constructor() {
    this.groq = new Groq({ apiKey: config.apiKeys.groq });
  }

  /**
   * Analyze sentiment of a single text.
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!text || text.trim().length === 0) {
      return this.createNeutralSentiment();
    }

    const cacheKey = `sentiment:${this.hashText(text)}`;
    const cached = await cacheService.get<SentimentResult>(cacheKey);
    if (cached) {
      return cached;
    }

    if (finbertModel.isConfigured()) {
      try {
        const scores = await finbertModel.predict(text);
        const sentimentResult = this.processSentimentResult(scores);
        await cacheService.set(cacheKey, sentimentResult, 3600); // Cache for 1 hour
        return sentimentResult;
      } catch (error) {
        logger.error('Error analyzing sentiment via FinBERT Gradio Space:', error);
      }
    } else if (!this.warnedMissingGradio) {
      this.warnedMissingGradio = true;
      logger.warn('FINBERT_GRADIO_URL not set; falling back to rate-limited Groq sentiment');
    }

    const fallback = await this.analyzeSentimentWithGroq(text);
    await cacheService.set(cacheKey, fallback, 3600);
    return fallback;
  }

  /**
   * Analyze sentiment of multiple texts in batch.
   * Uses a single batch Gradio call per chunk when FINBERT_GRADIO_URL is configured.
   */
  async analyzeBatchSentiment(texts: string[]): Promise<SentimentResult[]> {
    if (texts.length === 0) return [];

    const results: Array<SentimentResult | null> = new Array(texts.length).fill(null);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || text.trim().length === 0) {
        results[i] = this.createNeutralSentiment();
        continue;
      }

      const cacheKey = `sentiment:${this.hashText(text)}`;
      const cached = await cacheService.get<SentimentResult>(cacheKey);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(text);
      }
    }

    if (uncachedTexts.length > 0 && finbertModel.isConfigured()) {
      try {
        // Send all uncached articles in 1 single Gradio batch request
        const batchScores = await finbertModel.predictBatch(uncachedTexts);

        for (let j = 0; j < uncachedIndices.length; j++) {
          const targetIdx = uncachedIndices[j];
          const scores = batchScores[j] ?? [];
          const sentiment = this.processSentimentResult(scores);
          results[targetIdx] = sentiment;
          await cacheService.set(`sentiment:${this.hashText(texts[targetIdx])}`, sentiment, 3600);
        }

        return results.map((r) => r ?? this.createNeutralSentiment());
      } catch (error) {
        logger.error('Batch FinBERT Gradio inference failed, falling back to Groq:', error);
      }
    }

    // Sequential Groq fallback for any remaining uncached entries (do NOT re-call FinBERT)
    for (const idx of uncachedIndices) {
      if (results[idx] === null) {
        const fallback = await this.analyzeSentimentWithGroq(texts[idx]);
        results[idx] = fallback;
        await cacheService.set(`sentiment:${this.hashText(texts[idx])}`, fallback, 3600);
      }
    }

    return results.map((r) => r ?? this.createNeutralSentiment());
  }

  /**
   * Calculate aggregate sentiment from multiple results.
   */
  aggregateSentiment(sentiments: SentimentResult[]): SentimentResult {
    if (sentiments.length === 0) {
      return this.createNeutralSentiment();
    }

    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (avgScore > 0.2) label = 'positive';
    else if (avgScore < -0.2) label = 'negative';

    const details = {
      positive: sentiments.filter((s) => s.label === 'positive').length / sentiments.length,
      negative: sentiments.filter((s) => s.label === 'negative').length / sentiments.length,
      neutral: sentiments.filter((s) => s.label === 'neutral').length / sentiments.length,
    };

    return {
      score: avgScore,
      label,
      confidence: avgConfidence,
      details,
    };
  }

  /**
   * Process FinBERT classification result into a normalized SentimentResult.
   */
  private processSentimentResult(result: FinBertScore[]): SentimentResult {
    if (!Array.isArray(result) || result.length === 0) {
      return this.createNeutralSentiment();
    }

    const sortedResults = [...result].sort((a, b) => b.score - a.score);
    const topResult = sortedResults[0];

    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (topResult.label.toLowerCase().includes('positive')) {
      score = topResult.score;
      label = 'positive';
    } else if (topResult.label.toLowerCase().includes('negative')) {
      score = -topResult.score;
      label = 'negative';
    } else {
      score = 0;
      label = 'neutral';
    }

    const details = { positive: 0, negative: 0, neutral: 0 };
    sortedResults.forEach((item) => {
      const lower = item.label.toLowerCase();
      if (lower.includes('positive')) details.positive = item.score;
      else if (lower.includes('negative')) details.negative = item.score;
      else details.neutral = item.score;
    });

    return {
      score,
      label,
      confidence: topResult.score,
      details,
    };
  }

  /**
   * Rate-limited fallback sentiment analysis using Groq.
   */
  private analyzeSentimentWithGroq(text: string): Promise<SentimentResult> {
    const task = this.groqQueue.then(async () => {
      const now = Date.now();
      const elapsed = now - this.groqLastCallAt;
      if (elapsed < this.GROQ_MIN_INTERVAL_MS) {
        await this.delay(this.GROQ_MIN_INTERVAL_MS - elapsed);
      }

      try {
        logger.info('Performing sentiment analysis fallback using Groq...');
        this.groqLastCallAt = Date.now();

        const prompt = `Analyze the sentiment of the following financial text and output a JSON object containing:
1. "score": a number from -1.0 (extremely negative) to 1.0 (extremely positive).
2. "label": one of "positive", "negative", or "neutral".
3. "confidence": a number from 0.0 to 1.0 representing your classification confidence.

Do not include any explanation or markdown formatting (like \`\`\`json). Output raw valid JSON only.

TEXT TO ANALYZE:
"${text.substring(0, 1000)}"`;

        const completion = await this.groq.chat.completions.create({
          model: 'qwen/qwen3.8-27b',
          messages: [
            { role: 'system', content: 'You are a financial sentiment analysis expert. Always respond with raw valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 256,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('Groq returned an empty response');
        }

        const result = JSON.parse(responseText.trim());
        const score = Number(result.score) || 0;
        const label = (['positive', 'negative', 'neutral'].includes((result.label || '').toLowerCase())
          ? result.label.toLowerCase()
          : 'neutral') as 'positive' | 'negative' | 'neutral';
        const confidence = Number(result.confidence) || 0.5;

        const details = {
          positive: label === 'positive' ? confidence : (label === 'negative' ? 0 : (1 - confidence) / 2),
          negative: label === 'negative' ? confidence : (label === 'positive' ? 0 : (1 - confidence) / 2),
          neutral: label === 'neutral' ? confidence : 1 - confidence,
        };

        logger.info(`Groq sentiment result: ${label} (score: ${score}, confidence: ${confidence})`);
        return { score, label, confidence, details };
      } catch (error) {
        logger.error('Groq fallback sentiment analysis failed:', error);
        return this.createNeutralSentiment();
      }
    });

    this.groqQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  private createNeutralSentiment(): SentimentResult {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0.33,
      details: { positive: 0.33, negative: 0.33, neutral: 0.34 },
    };
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new SentimentService();
