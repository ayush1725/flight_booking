import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * Authentication Routes
 * All routes are prefixed with /auth
 */

// Google OAuth routes
router.get('/google', AuthController.initiateGoogleAuth);
router.get('/callback', AuthController.handleOAuthCallback);

// Email authentication routes
router.post('/email/register', AuthController.registerWithEmail);
router.post('/email/verify', AuthController.verifyEmail);
router.post('/email/login', AuthController.loginWithEmail);
router.post('/email/resend-verification', AuthController.resendEmailVerification);
router.post('/email/forgot-password', AuthController.requestPasswordReset);
router.post('/email/reset-password', AuthController.resetPassword);

// Phone OTP routes
router.post('/phone/send-otp', AuthController.sendPhoneOTP);
router.post('/phone/verify-otp', AuthController.verifyPhoneOTP);

// Session management
router.post('/refresh', AuthController.refreshSession);
router.post('/signout', AuthController.signOut);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, AuthController.getProfile);

// Optional auth routes (work with or without auth)
router.get('/status', optionalAuth, AuthController.getAuthStatus);

export default router;