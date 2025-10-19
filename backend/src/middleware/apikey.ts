import { Request, Response, NextFunction } from 'express';
import { ApiRole } from '../types';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const INSTALLER_API_KEY = process.env.INSTALLER_API_KEY || '';

export interface AuthRequest extends Request {
  apiRole?: ApiRole;
}

/**
 * Middleware to validate API key and assign role
 */
export function requireApiKey(allowedRoles: ApiRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const apiKey = req.header('X-API-KEY');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    let role: ApiRole | null = null;
    
    if (apiKey === ADMIN_API_KEY && ADMIN_API_KEY) {
      role = 'admin';
    } else if (apiKey === INSTALLER_API_KEY && INSTALLER_API_KEY) {
      role = 'installer';
    }
    
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Invalid or insufficient API key' });
    }
    
    req.apiRole = role;
    next();
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireApiKey(['admin']);

/**
 * Middleware to require installer role
 */
export const requireInstaller = requireApiKey(['installer', 'admin']);
