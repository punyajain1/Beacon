import { Request, Response, NextFunction } from 'express';
import earningsService from '../services/earnings.service';
import { logger } from '../utils/logger';

class EarningsController {
  analyzeCall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticker, audioUrl, callDate } = req.body;

      if (!ticker || !audioUrl || !callDate) {
        res.status(400).json({
          success: false,
          error: 'ticker, audioUrl, and callDate are required',
        });
        return;
      }

      logger.info(`POST /earnings/analyze — ticker=${ticker}`);
      const result = await earningsService.analyzeCall(
        ticker.toString().toUpperCase(),
        audioUrl.toString(),
        callDate.toString()
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  runDemo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('POST /earnings/demo');
      const result = await earningsService.runDemoAnalysis();
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getByTicker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticker } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const data = await earningsService.getCallsByTicker(ticker, limit);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };

  getTopStressed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const data = await earningsService.getTopStressed(limit);
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };

  compareData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await earningsService.compareData();
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  };
}

export default new EarningsController();
