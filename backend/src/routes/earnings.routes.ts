import { Router } from 'express';
import earningsController from '../controllers/earnings.controller';

const router = Router();

router.post('/analyze', earningsController.analyzeCall);
router.post('/demo', earningsController.runDemo);
router.get('/top', earningsController.getTopStressed);
router.get('/compare', earningsController.compareData);
router.get('/:ticker', earningsController.getByTicker);

export default router;
