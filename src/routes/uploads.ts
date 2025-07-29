import { Router } from 'express';
import {
  uploadFile,
  getUploads,
  getUpload,
  deleteUpload,
} from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { checkProjectAccess } from '../middleware/roleCheck';
import { uploadExcel } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/:projectId', checkProjectAccess, uploadExcel.single('file'), uploadFile);
router.get('/:projectId', checkProjectAccess, getUploads);

router.get('/file/:uploadId', checkProjectAccess, getUpload);
router.delete('/file/:uploadId', checkProjectAccess, deleteUpload);

export default router;