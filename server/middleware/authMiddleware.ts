import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        phone?: string;
        user_metadata?: any;
        app_metadata?: any;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies Supabase access tokens and adds user data to request
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn(`Authentication attempt without token: ${req.method} ${req.path}`);
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify token with Supabase
    const authResult = await AuthService.getUserFromToken(token);

    if (!authResult.success || !authResult.data?.user) {
      logger.warn(`Invalid token attempt: ${req.method} ${req.path}`, {
        error: authResult.error
      });
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired access token',
        error: 'INVALID_TOKEN'
      });
    }

    // Add user data to request object
    req.user = authResult.data.user;
    
    logger.info(`Authenticated user: ${req.user?.email || req.user?.phone || req.user?.id} for ${req.method} ${req.path}`);
    next();

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user data to request if token is present, but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const authResult = await AuthService.getUserFromToken(token);
      
      if (authResult.success && authResult.data?.user) {
        req.user = authResult.data.user;
        logger.info(`Optional auth - User identified: ${req.user?.email || req.user?.phone || req.user?.id}`);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    // Continue without auth for optional middleware
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires specific roles or permissions
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userRoles = req.user.app_metadata?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn(`Insufficient permissions for user ${req.user.id}: required ${roles}, has ${userRoles}`);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles
      });
    }

    next();
  };
};

/**
 * Admin only middleware
 * Shorthand for requiring admin role
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user owns the resource
 * Useful for user-specific endpoints like /users/:id
 */
export const requireOwnership = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const resourceUserId = req.params[userIdParam];
    const currentUserId = req.user.id;

    // Allow admins to access any resource
    const isAdmin = req.user.app_metadata?.roles?.includes('admin');
    
    if (resourceUserId !== currentUserId && !isAdmin) {
      logger.warn(`Ownership check failed: User ${currentUserId} tried to access resource for user ${resourceUserId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};