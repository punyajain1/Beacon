import { Request, Response, NextFunction } from 'express';
import debateService from '../services/debate.service';
import { logger } from '../utils/logger';

const TICKER_REGEX = /^[A-Z]{1,5}$/;

class DebateController {
  /**
   * GET /debate/:ticker
   * Runs or returns cached debate for a ticker.
   */
  runDebate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticker = (req.params.ticker || '').toUpperCase().trim();

      if (!TICKER_REGEX.test(ticker)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ticker. Must be 1–5 uppercase letters (e.g. AAPL, TSLA).',
        });
        return;
      }

      logger.info(`Debate requested for ticker: ${ticker}`);
      const result = await debateService.runDebate(ticker);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /debate/:ticker/history?limit=10
   * Returns past debates for a given ticker.
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticker = (req.params.ticker || '').toUpperCase().trim();

      if (!TICKER_REGEX.test(ticker)) {
        res.status(400).json({
          success: false,
          error: 'Invalid ticker. Must be 1–5 uppercase letters.',
        });
        return;
      }

      const limitParam = req.query.limit;
      const limit = limitParam ? Math.min(parseInt(limitParam as string, 10) || 10, 50) : 10;

      const history = await debateService.getDebateHistory(ticker, limit);
      res.status(200).json({ success: true, data: history, count: history.length });
    } catch (error) {
      next(error);
    }
  };
}

export default new DebateController();
