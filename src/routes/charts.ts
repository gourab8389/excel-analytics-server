import { Router } from 'express';
import {
  createChart,
  getCharts,
  getChart,
  updateChart,
  deleteChart,
} from '../controllers/chartController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/upload/:uploadId', createChart);
router.get('/upload/:uploadId', getCharts);

router.get('/:chartId', getChart);
router.put('/:chartId', updateChart);
router.delete('/:chartId', deleteChart);

export default router;