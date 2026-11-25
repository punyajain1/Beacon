import { Router } from 'express';
import debateController from '../controllers/debate.controller';

const router = Router();

router.get('/:ticker/history', debateController.getHistory);
router.get('/:ticker', debateController.runDebate);

export default router;
