import { Router } from 'express';
import { register, login, getProfile, updateProfile, deleteAccount } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/delete', authenticate, deleteAccount);

export default router;