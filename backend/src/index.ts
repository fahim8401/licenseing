import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { initMikroTik } from './services/mikrotik';
import { MikroTikConfig } from './types';
import { generalLimiter } from './middleware/ratelimit';

// Routes
import authRoutes from './routes/auth';
import licensesRoutes from './routes/licenses';
import ipsRoutes from './routes/ips';
import logsRoutes from './routes/logs';
import installerRoutes from './routes/installer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize MikroTik configuration
const mtConfig: MikroTikConfig = {
  enabled: process.env.ENABLE_MIKROTIK_SYNC === 'true',
  host: process.env.MT_HOST || '',
  user: process.env.MT_USER || '',
  pass: process.env.MT_PASS || '',
  port: parseInt(process.env.MT_PORT || '8728'),
  interface: process.env.MT_INTERFACE || '',
  publicNatIp: process.env.MT_PUBLIC_NAT_IP || '',
  addressList: process.env.MT_ADDRESS_LIST || 'LICENSED_IPS',
};

initMikroTik(mtConfig);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1/auth', authRoutes);
app.use('/v1/licenses', licensesRoutes);
app.use('/v1/licenses', ipsRoutes);
app.use('/v1/logs', logsRoutes);
app.use('/v1/installer', installerRoutes);

// Public installer endpoint (for bash <( curl ... ) usage)
app.use('/', installerRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MikroTik sync: ${mtConfig.enabled ? 'enabled' : 'disabled'}`);
});

export default app;
