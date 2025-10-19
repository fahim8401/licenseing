import { Router, Request, Response } from 'express';
import { query } from '../services/db';
import { requireAdmin } from '../middleware/apikey';

const router = Router();

/**
 * GET /v1/logs
 * List authentication logs with pagination and filters
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.perPage as string) || 50, 100);
    const result = req.query.result as string | undefined;
    const licenseKey = req.query.license_key as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    
    const offset = (page - 1) * perPage;
    
    // Build WHERE clause
    const conditions: string[] = [];
    const values: (string | number | Date)[] = [];
    let paramCount = 1;
    
    if (result) {
      conditions.push(`result = $${paramCount++}`);
      values.push(result);
    }
    
    if (licenseKey) {
      conditions.push(`license_key = $${paramCount++}`);
      values.push(licenseKey);
    }
    
    if (startDate) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(new Date(startDate));
    }
    
    if (endDate) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(new Date(endDate));
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM auth_logs ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Get logs
    values.push(perPage, offset);
    const logsResult = await query(
      `SELECT * FROM auth_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );
    
    return res.json({
      logs: logsResult.rows,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /v1/logs/stats
 * Get authentication statistics
 */
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Count by result in last 24 hours
    const statsResult = await query(
      `SELECT result, COUNT(*) as count 
       FROM auth_logs 
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY result`,
      []
    );
    
    // Total logs
    const totalResult = await query('SELECT COUNT(*) FROM auth_logs', []);
    
    return res.json({
      total: parseInt(totalResult.rows[0].count),
      last24Hours: statsResult.rows.reduce((acc, row) => {
        acc[row.result] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return res.status(500).json({ error: 'Failed to fetch log stats' });
  }
});

export default router;
