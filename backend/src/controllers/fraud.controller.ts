import { Request, Response, NextFunction } from 'express';
import fraudService from '../services/fraud.service';
import { logger } from '../utils/logger';

class FraudController {
  /**
   * POST /ingest
   * Body: { transactions: TransactionInput[] }
   */
  ingestTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactions } = req.body;
      if (!Array.isArray(transactions) || transactions.length === 0) {
        res.status(400).json({ success: false, message: 'transactions array is required' });
        return;
      }

      const count = await fraudService.ingestTransactions(transactions);
      res.json({ success: true, data: { ingested: count } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /detect
   * Triggers ring detection and returns detected rings
   */
  detectRings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const rings = await fraudService.detectRings();
      res.json({ success: true, data: rings, count: rings.length });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /rings?status=OPEN
   */
  getRings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const rings = await fraudService.getRings(status);
      res.json({ success: true, data: rings, count: rings.length });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /graph/:accountId
   */
  getAccountGraph = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { accountId } = req.params;
      if (!accountId) {
        res.status(400).json({ success: false, message: 'accountId is required' });
        return;
      }

      const graph = await fraudService.getAccountGraph(accountId);
      res.json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /rings/:id/status
   * Body: { status: string }
   */
  updateRingStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
        res.status(400).json({ success: false, message: 'id and status are required' });
        return;
      }

      const allowedStatuses = ['OPEN', 'INVESTIGATED', 'CLEARED'];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `status must be one of: ${allowedStatuses.join(', ')}`,
        });
        return;
      }

      const ring = await fraudService.updateRingStatus(id, status);
      res.json({ success: true, data: ring });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /upload-csv
   * Multipart file upload — parses CSV and ingests transactions
   */
  uploadCSV = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'CSV file is required' });
        return;
      }

      const csvText = req.file.buffer.toString('utf-8');
      const transactions = fraudService.parseCSV(csvText);

      if (transactions.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid transactions found in CSV. Expected headers: fromAccount,toAccount,amount,currency,date,description',
        });
        return;
      }

      const count = await fraudService.ingestTransactions(transactions);
      res.json({
        success: true,
        data: { parsed: transactions.length, ingested: count },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new FraudController();
