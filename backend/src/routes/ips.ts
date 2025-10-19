import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { isValidIpOrCidr } from '../services/ipmatch';
import { addIpToMikroTik, removeIpFromMikroTik } from '../services/mikrotik';
import { AddIPRequest } from '../types';
import { requireAdmin } from '../middleware/apikey';

const router = Router();

/**
 * POST /v1/licenses/:licenseId/ips
 * Add an IP or CIDR to a license
 */
router.post('/:licenseId/ips', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;
    const { ip_cidr, note } = req.body as AddIPRequest;
    
    if (!ip_cidr) {
      return res.status(400).json({ error: 'ip_cidr is required' });
    }
    
    // Validate IP/CIDR
    if (!isValidIpOrCidr(ip_cidr)) {
      return res.status(400).json({ error: 'Invalid IP address or CIDR format' });
    }
    
    // Check if license exists
    const licenseResult = await query('SELECT * FROM licenses WHERE id = $1', [licenseId]);
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    // Add IP to database
    const result = await query(
      'INSERT INTO allowed_ips (license_id, ip_cidr, note) VALUES ($1, $2, $3) RETURNING *',
      [licenseId, ip_cidr, note || null]
    );
    
    const newIp = result.rows[0];
    
    // Sync to MikroTik (non-blocking, log errors but don't fail the request)
    try {
      await addIpToMikroTik(ip_cidr, parseInt(licenseId));
    } catch (mtError) {
      console.error('MikroTik sync failed (non-fatal):', mtError);
    }
    
    return res.status(201).json(newIp);
  } catch (error) {
    console.error('Error adding IP:', error);
    
    // Check for duplicate
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return res.status(409).json({ error: 'IP already added to this license' });
    }
    
    return res.status(500).json({ error: 'Failed to add IP' });
  }
});

/**
 * DELETE /v1/licenses/:licenseId/ips/:ipId
 * Remove an IP from a license
 */
router.delete('/:licenseId/ips/:ipId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId, ipId } = req.params;
    
    // Get the IP record first (need ip_cidr for MikroTik removal)
    const ipResult = await query(
      'SELECT * FROM allowed_ips WHERE id = $1 AND license_id = $2',
      [ipId, licenseId]
    );
    
    if (ipResult.rows.length === 0) {
      return res.status(404).json({ error: 'IP not found' });
    }
    
    const ip = ipResult.rows[0];
    
    // Delete from database
    await query('DELETE FROM allowed_ips WHERE id = $1', [ipId]);
    
    // Remove from MikroTik (non-blocking)
    try {
      await removeIpFromMikroTik(ip.ip_cidr, parseInt(licenseId));
    } catch (mtError) {
      console.error('MikroTik removal failed (non-fatal):', mtError);
    }
    
    return res.json({ message: 'IP removed successfully' });
  } catch (error) {
    console.error('Error removing IP:', error);
    return res.status(500).json({ error: 'Failed to remove IP' });
  }
});

/**
 * GET /v1/licenses/:licenseId/ips
 * List all IPs for a license
 */
router.get('/:licenseId/ips', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;
    
    const result = await query(
      'SELECT * FROM allowed_ips WHERE license_id = $1 ORDER BY created_at DESC',
      [licenseId]
    );
    
    return res.json(result.rows);
  } catch (error) {
    console.error('Error listing IPs:', error);
    return res.status(500).json({ error: 'Failed to list IPs' });
  }
});

export default router;
