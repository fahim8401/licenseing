import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../services/db';
import { CreateLicenseRequest } from '../types';
import { requireAdmin } from '../middleware/apikey';

const router = Router();

/**
 * POST /v1/licenses
 * Create a new license
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, license_key, expires_at } = req.body as CreateLicenseRequest;
    
    // Generate license key if not provided
    const key = license_key || uuidv4();
    
    // Parse expires_at if provided
    const expiresAtDate = expires_at ? new Date(expires_at) : null;
    
    const result = await query(
      'INSERT INTO licenses (name, license_key, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [name || null, key, expiresAtDate]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating license:', error);
    
    // Check for duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return res.status(409).json({ error: 'License key already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to create license' });
  }
});

/**
 * GET /v1/licenses
 * List all licenses
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM licenses ORDER BY created_at DESC');
    return res.json(result.rows);
  } catch (error) {
    console.error('Error listing licenses:', error);
    return res.status(500).json({ error: 'Failed to list licenses' });
  }
});

/**
 * GET /v1/licenses/:id
 * Get a specific license with allowed IPs
 */
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const licenseResult = await query('SELECT * FROM licenses WHERE id = $1', [id]);
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    const license = licenseResult.rows[0];
    
    // Get allowed IPs
    const ipsResult = await query(
      'SELECT * FROM allowed_ips WHERE license_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    return res.json({
      ...license,
      allowed_ips: ipsResult.rows,
    });
  } catch (error) {
    console.error('Error getting license:', error);
    return res.status(500).json({ error: 'Failed to get license' });
  }
});

/**
 * PATCH /v1/licenses/:id
 * Update a license
 */
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, active, expires_at } = req.body;
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | boolean | Date | null)[] = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    
    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    
    if (expires_at !== undefined) {
      updates.push(`expires_at = $${paramCount++}`);
      values.push(expires_at ? new Date(expires_at) : null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const result = await query(
      `UPDATE licenses SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating license:', error);
    return res.status(500).json({ error: 'Failed to update license' });
  }
});

/**
 * DELETE /v1/licenses/:id
 * Delete a license
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM licenses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    return res.json({ message: 'License deleted successfully' });
  } catch (error) {
    console.error('Error deleting license:', error);
    return res.status(500).json({ error: 'Failed to delete license' });
  }
});

export default router;
