import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '@mekong/shared';

const router = Router();

// Routes
router.post('/otp/send', AuthController.sendOtp);
router.post('/otp/verify', AuthController.verifyOtp);

// Protected routes
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.get('/profiles', authMiddleware, AuthController.listProfiles);
router.get('/validate', AuthController.validateToken);

export default router;
