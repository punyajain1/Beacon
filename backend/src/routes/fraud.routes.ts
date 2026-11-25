import { Router } from 'express';
import multer from 'multer';
import fraudController from '../controllers/fraud.controller';

const router = Router();

// Multer with memory storage for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.post('/ingest', fraudController.ingestTransactions);
router.post('/upload-csv', upload.single('file'), fraudController.uploadCSV);
router.get('/detect', fraudController.detectRings);
router.get('/rings', fraudController.getRings);
router.get('/graph/:accountId', fraudController.getAccountGraph);
router.patch('/rings/:id/status', fraudController.updateRingStatus);

export default router;
