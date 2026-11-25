import { Request, Response, NextFunction } from 'express';
import insiderService from '../services/insider.service';
import { logger } from '../utils/logger';

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const alerts = await insiderService.getAlerts(limit);
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    logger.error('getAlerts error:', error);
    next(error);
  }
};

export const getAlertsByTicker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticker = (req.params.ticker || '').toUpperCase();
    const alerts = await insiderService.getAlertsByTicker(ticker);
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    logger.error('getAlertsByTicker error:', error);
    next(error);
  }
};

export const getRecentFilings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const filings = await insiderService.getRecentFilings(limit);
    res.json({ success: true, data: filings, count: filings.length });
  } catch (error) {
    logger.error('getRecentFilings error:', error);
    next(error);
  }
};

export const getFilingsByTicker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticker = (req.params.ticker || '').toUpperCase();
    const filings = await insiderService.getFilingsByTicker(ticker);
    res.json({ success: true, data: filings, count: filings.length });
  } catch (error) {
    logger.error('getFilingsByTicker error:', error);
    next(error);
  }
};

export const markAlertSeen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await insiderService.markAlertSeen(id);
    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('markAlertSeen error:', error);
    next(error);
  }
};

export const triggerScan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scanStats = await insiderService.scanInsiderFilings();
    const [alerts, recentFilings] = await Promise.all([
      insiderService.getAlerts(50),
      insiderService.getRecentFilings(25),
    ]);
    res.json({
      success: true,
      message: 'Scan completed',
      data: alerts,
      recentFilings,
      scanStats,
      count: alerts.length,
    });
  } catch (error) {
    logger.error('triggerScan error:', error);
    next(error);
  }
};

export default {
  getAlerts,
  getAlertsByTicker,
  getRecentFilings,
  getFilingsByTicker,
  markAlertSeen,
  triggerScan,
};
