import { Router } from 'express';
import insiderController from '../controllers/insider.controller';

const router = Router();

router.get('/alerts', insiderController.getAlerts);
router.get('/alerts/:ticker', insiderController.getAlertsByTicker);
router.get('/filings', insiderController.getRecentFilings);
router.get('/filings/:ticker', insiderController.getFilingsByTicker);
router.patch('/alerts/:id/seen', insiderController.markAlertSeen);
router.post('/scan', insiderController.triggerScan);

export default router;
