import axios from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface FinBertScore {
  label: string;
  score: number;
}

interface GradioInfoResponse {
  named_endpoints?: Record<string, unknown>;
}

/**
 * Separate model client for `ProsusAI/finbert` hosted on a free Hugging Face Gradio Space.
 *
 * Designed to match the `finbret/app.py` Gradio Space (`gr.Interface(fn=analyze_batch, inputs=gr.JSON(), outputs=gr.JSON())`),
 * sending all texts in a single `/predict` request with 0 MB local model RAM usage.
 *
 * Configure `FINBERT_GRADIO_URL` in `.env` with any of:
 *   - `YOUR_HF_USERNAME/YOUR_SPACE_NAME`
 *   - `https://huggingface.co/spaces/YOUR_HF_USERNAME/YOUR_SPACE_NAME`
 *   - `https://your-hf-username-your-space-name.hf.space`
 */
export class FinBertModel {
  readonly modelName = 'ProsusAI/finbert';
  private apiPrefix: '/gradio_api/call' | '/call' = '/gradio_api/call';
  private discoveredEndpoint: string | null = null;
  private skipAuth = false;
  private readonly timeoutMs = 60000; // Allow time for free HF Space cold-start wakeup

  /**
   * Normalizes the configured HF Space identifier or URL into a direct `.hf.space` base URL.
   */
  getSpaceUrl(): string {
    const raw = (config.apis.finbertGradio || '').trim().replace(/\/+$/, '');
    if (!raw) return '';

    // Support `owner/space-name` shorthand (like Gradio Client.connect)
    const shorthandMatch = raw.match(/^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
    if (shorthandMatch) {
      return this.toHfSpaceOrigin(shorthandMatch[1], shorthandMatch[2]);
    }

    // Support full Space page URLs: https://huggingface.co/spaces/owner/space-name
    const hfPageMatch = raw.match(/^https?:\/\/huggingface\.co\/spaces\/([^/]+)\/([^/?#]+)/i);
    if (hfPageMatch) {
      return this.toHfSpaceOrigin(hfPageMatch[1], hfPageMatch[2]);
    }

    return raw;
  }

  private toHfSpaceOrigin(owner: string, space: string): string {
    const cleanOwner = owner.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const cleanSpace = space.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `https://${cleanOwner}-${cleanSpace}.hf.space`;
  }

  /**
   * Whether a Gradio FinBERT Space URL is configured.
   */
  isConfigured(): boolean {
    return this.getSpaceUrl().length > 0;
  }

  /**
   * Run FinBERT sentiment classification on a single text.
   */
  async predict(text: string): Promise<FinBertScore[]> {
    const batch = await this.predictBatch([text]);
    return batch[0] ?? this.neutralScores();
  }

  /**
   * Run FinBERT sentiment classification on all texts in 1 single Gradio API request.
   */
  async predictBatch(texts: string[]): Promise<FinBertScore[][]> {
    if (texts.length === 0) return [];

    const baseUrl = this.getSpaceUrl();
    if (!baseUrl) {
      throw new Error('FINBERT_GRADIO_URL is not configured');
    }

    const cleaned = texts.map((t) => (t || '').trim().substring(0, 2000) || 'neutral');

    try {
      const headers = this.buildHeaders(!this.skipAuth);
      const endpoint = await this.resolveEndpoint(baseUrl, headers);
      const output = await this.callGradioEndpoint<unknown>(
        baseUrl,
        endpoint,
        [cleaned],
        headers
      );
      return this.normalizeBatchOutput(output, texts.length);
    } catch (err: any) {
      const status = err?.response?.status;
      if ((status === 401 || status === 403) && !this.skipAuth && config.apiKeys.huggingface) {
        this.skipAuth = true;
        const anonHeaders = this.buildHeaders(false);
        const endpoint = await this.resolveEndpoint(baseUrl, anonHeaders);
        const output = await this.callGradioEndpoint<unknown>(
          baseUrl,
          endpoint,
          [cleaned],
          anonHeaders
        );
        return this.normalizeBatchOutput(output, texts.length);
      }
      throw err;
    }
  }

  private buildHeaders(includeAuth: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (includeAuth && config.apiKeys.huggingface) {
      headers.Authorization = `Bearer ${config.apiKeys.huggingface}`;
    }
    return headers;
  }

  private async resolveEndpoint(
    baseUrl: string,
    headers: Record<string, string>
  ): Promise<string> {
    const envOverride = (process.env.FINBERT_GRADIO_API_NAME || '').trim().replace(/^\/+/, '');
    if (envOverride) {
      return envOverride;
    }

    if (this.discoveredEndpoint) {
      return this.discoveredEndpoint;
    }

    for (const infoPath of ['/gradio_api/info', '/info']) {
      try {
        const res = await axios.get<GradioInfoResponse>(`${baseUrl}${infoPath}`, {
          headers,
          timeout: this.timeoutMs,
        });

        const endpoints = Object.keys(res.data?.named_endpoints || {}).map((name) =>
          name.replace(/^\/+/, '')
        );

        if (endpoints.length > 0) {
          this.apiPrefix = infoPath.startsWith('/gradio_api') ? '/gradio_api/call' : '/call';
          const preferred = ['predict', 'analyze_batch', 'analyze'].find((c) =>
            endpoints.includes(c)
          );
          this.discoveredEndpoint = preferred || endpoints[0];
          logger.info(
            `Discovered FinBERT Gradio endpoint "${this.discoveredEndpoint}" at ${baseUrl}`
          );
          return this.discoveredEndpoint;
        }
      } catch {
        // Try next info path or fall back to default endpoint name
      }
    }

    this.discoveredEndpoint = 'predict';
    return this.discoveredEndpoint;
  }

  private async callGradioEndpoint<T>(
    baseUrl: string,
    apiName: string,
    data: unknown[],
    headers: Record<string, string>
  ): Promise<T> {
    const { eventId, prefix } = await this.initiateCall(baseUrl, apiName, data, headers);

    const streamUrl = `${baseUrl}${prefix}/${apiName}/${eventId}`;
    const sseResponse = await axios.get<string>(streamUrl, {
      headers,
      timeout: this.timeoutMs,
      responseType: 'text',
    });

    return this.parseSseResult<T>(sseResponse.data);
  }

  private async initiateCall(
    baseUrl: string,
    apiName: string,
    data: unknown[],
    headers: Record<string, string>
  ): Promise<{ eventId: string; prefix: '/gradio_api/call' | '/call' }> {
    const prefixes: Array<'/gradio_api/call' | '/call'> =
      this.apiPrefix === '/gradio_api/call'
        ? ['/gradio_api/call', '/call']
        : ['/call', '/gradio_api/call'];

    const candidates = apiName === 'predict' ? ['predict', 'analyze_batch', 'analyze'] : [apiName];
    let lastError: unknown;

    for (const candidate of candidates) {
      for (const prefix of prefixes) {
        try {
          const res = await axios.post<{ event_id?: string }>(
            `${baseUrl}${prefix}/${candidate}`,
            { data },
            { headers, timeout: this.timeoutMs }
          );

          if (res.data?.event_id) {
            this.apiPrefix = prefix;
            this.discoveredEndpoint = candidate;
            return { eventId: res.data.event_id, prefix };
          }
        } catch (err: any) {
          lastError = err;
          if (err?.response?.status !== 404) {
            throw err;
          }
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Failed to invoke Gradio endpoint "${apiName}" at ${baseUrl}`);
  }

  private parseSseResult<T>(ssePayload: string): T {
    const lines = String(ssePayload).split(/\r?\n/);
    let currentEvent = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
        continue;
      }

      if (line.startsWith('data:')) {
        const jsonPart = line.slice(5).trim();
        if (currentEvent === 'error') {
          throw new Error(`FinBERT Gradio Space error: ${jsonPart || 'unknown error'}`);
        }
        if (currentEvent === 'complete') {
          const parsed = JSON.parse(jsonPart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0] as T;
          }
          return parsed as T;
        }
      }
    }

    logger.warn('FinBERT Gradio SSE response did not contain a complete event', {
      preview: String(ssePayload).slice(0, 300),
    });
    throw new Error('Incomplete SSE response from FinBERT Gradio Space');
  }

  private normalizeBatchOutput(rawOutput: unknown, expectedCount: number): FinBertScore[][] {
    let payload: any = rawOutput;

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return Array.from({ length: expectedCount }, () => this.neutralScores());
      }
    }

    if (!Array.isArray(payload)) {
      const single = this.normalizeScoreItem(payload);
      return Array.from({ length: expectedCount }, () => single);
    }

    // Batch response: [ [ {label, score}, ... ], [ {label, score}, ... ] ]
    if (payload.length > 0 && Array.isArray(payload[0])) {
      return payload.map((item) => this.normalizeScoreItem(item));
    }

    // Single-article array returned when expectedCount === 1: [ {label, score}, ... ]
    if (
      expectedCount === 1 &&
      payload.length > 0 &&
      payload[0] &&
      typeof payload[0].label === 'string'
    ) {
      return [this.normalizeScoreItem(payload)];
    }

    // Batch where pipeline returned 1 top object per article: [ {label, score}, ... ]
    return payload.map((item) => this.normalizeScoreItem(item));
  }

  private normalizeScoreItem(item: unknown): FinBertScore[] {
    if (Array.isArray(item)) {
      const mapped = item
        .filter((entry: any) => entry && typeof entry.label === 'string')
        .map((entry: any) => ({
          label: entry.label.toLowerCase(),
          score: Number(entry.score ?? entry.confidence) || 0,
        }));
      return mapped.length > 0 ? mapped : this.neutralScores();
    }

    if (item && typeof item === 'object') {
      const obj = item as any;
      if (Array.isArray(obj.confidences)) {
        return this.normalizeScoreItem(obj.confidences);
      }
      if (typeof obj.label === 'string') {
        return [{ label: obj.label.toLowerCase(), score: Number(obj.score ?? obj.confidence) || 0.5 }];
      }
    }

    return this.neutralScores();
  }

  private neutralScores(): FinBertScore[] {
    return [
      { label: 'neutral', score: 1 },
      { label: 'positive', score: 0 },
      { label: 'negative', score: 0 },
    ];
  }
}

export default new FinBertModel();
