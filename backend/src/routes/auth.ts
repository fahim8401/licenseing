import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { ipMatches } from '../services/ipmatch';
import { AuthCheckRequest, AuthCheckResponse } from '../types';
import { authCheckLimiter } from '../middleware/ratelimit';
import { requireInstaller } from '../middleware/apikey';

const router = Router();

/**
 * POST /v1/auth/check
 * Check if a license key is valid for the given IP and machine ID
 */
router.post('/check', authCheckLimiter, requireInstaller, async (req: Request, res: Response) => {
  try {
    const { license_key, public_ip, machine_id } = req.body as AuthCheckRequest;
    
    // Validate input
    if (!license_key || !public_ip) {
      return res.status(400).json({ 
        allowed: false, 
        message: 'Missing required fields: license_key, public_ip' 
      });
    }
    
    // Log the request
    const logRequest = async (result: string) => {
      await query(
        'INSERT INTO auth_logs (license_key, request_ip, machine_identifier, result, raw_request) VALUES ($1, $2, $3, $4, $5)',
        [license_key, public_ip, machine_id || null, result, JSON.stringify(req.body)]
      );
    };
    
    // Find license
    const licenseResult = await query(
      'SELECT * FROM licenses WHERE license_key = $1',
      [license_key]
    );
    
    if (licenseResult.rows.length === 0) {
      await logRequest('license-not-found');
      return res.status(403).json({ 
        allowed: false, 
        message: 'License not found' 
      } as AuthCheckResponse);
    }
    
    const license = licenseResult.rows[0];
    
    // Check if license is active
    if (!license.active) {
      await logRequest('license-inactive');
      return res.status(403).json({ 
        allowed: false, 
        message: 'License is inactive' 
      } as AuthCheckResponse);
    }
    
    // Check if license is expired
    if (license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      if (expiresAt < new Date()) {
        await logRequest('license-expired');
        return res.status(403).json({ 
          allowed: false, 
          message: 'License has expired' 
        } as AuthCheckResponse);
      }
    }
    
    // Get allowed IPs for this license
    const ipsResult = await query(
      'SELECT * FROM allowed_ips WHERE license_id = $1',
      [license.id]
    );
    
    if (ipsResult.rows.length === 0) {
      await logRequest('no-allowed-ips');
      return res.status(403).json({ 
        allowed: false, 
        message: 'No IPs configured for this license' 
      } as AuthCheckResponse);
    }
    
    // Check if the public IP matches any allowed IP/CIDR
    const ipAllowed = ipsResult.rows.some(row => ipMatches(public_ip, row.ip_cidr));
    
    if (!ipAllowed) {
      await logRequest('denied');
      return res.status(403).json({ 
        allowed: false, 
        message: 'IP address not authorized for this license' 
      } as AuthCheckResponse);
    }
    
    // Success
    await logRequest('allowed');
    return res.status(200).json({ 
      allowed: true, 
      message: 'OK' 
    } as AuthCheckResponse);
    
  } catch (error) {
    console.error('Error in auth check:', error);
    return res.status(500).json({ 
      allowed: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;
