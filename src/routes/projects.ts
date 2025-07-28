import { Router } from 'express';
import {
  createProject,
  getUserProjects,
  getProject,
  inviteUser,
  acceptInvitation,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { checkProjectAccess, requireProjectAdmin } from '../middleware/roleCheck';

const router = Router();

router.use(authenticate);

router.post('/', createProject);
router.get('/', getUserProjects);
router.post('/accept-invitation', acceptInvitation);

router.get('/:projectId', checkProjectAccess, getProject);

// we have check access of admin or member in controllers so here we just check if user is authenticated
router.put('/:projectId', checkProjectAccess, updateProject);
router.delete('/:projectId', checkProjectAccess, deleteProject);

router.post('/:projectId/invite', checkProjectAccess, requireProjectAdmin, inviteUser);

export default router;