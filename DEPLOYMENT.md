# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15+ (if not using Docker)
- Node.js 18+ (for local development)
- Go 1.21+ (for building installer)

## Quick Start with Docker

### 1. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (IMPORTANT: Change API keys!)
nano .env
```

Required changes in `.env`:
- `ADMIN_API_KEY` - Use a strong, random key for admin access
- `INSTALLER_API_KEY` - Use a strong, random key for installer authentication
- `DATABASE_URL` - Configure database connection (default works with Docker)
- MikroTik settings (if using RouterOS integration)

### 2. Start Services

```bash
# Start all services (database, API, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 4. Initial Setup

The database will be automatically initialized with the schema from the migration file.

To seed with demo data:
```bash
docker-compose exec api npm run seed
```

## Manual Installation (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp ../.env.example .env
nano .env

# Run migrations
npm run migrate

# Start development server
npm run dev

# OR build and run production
npm run build
npm start
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint
export VITE_API_BASE=http://localhost:3000/v1

# Start development server
npm run dev

# OR build for production
npm run build

# Serve with nginx or any static server
# Built files are in dist/
```

### Database Setup

```bash
# Create database
createdb ipauth

# Set DATABASE_URL in .env
DATABASE_URL=postgres://user:pass@localhost:5432/ipauth

# Run migrations from backend directory
cd backend
npm run migrate
```

## Production Deployment

### Security Checklist

- [ ] Change all default API keys
- [ ] Use strong, random keys (32+ characters)
- [ ] Enable HTTPS for all endpoints
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up log rotation
- [ ] Enable database backups
- [ ] Review MikroTik access permissions

### Environment Variables for Production

```bash
# Backend
NODE_ENV=production
DATABASE_URL=postgres://user:pass@db-host:5432/ipauth
PORT=3000
ADMIN_API_KEY=<generate-strong-key>
INSTALLER_API_KEY=<generate-strong-key>

# MikroTik (if enabled)
ENABLE_MIKROTIK_SYNC=true
MT_HOST=<router-ip>
MT_USER=<api-user>
MT_PASS=<api-password>
MT_PORT=8728
MT_INTERFACE=<wan-interface>
MT_PUBLIC_NAT_IP=<public-ip>
MT_ADDRESS_LIST=LICENSED_IPS

# Frontend
VITE_API_BASE=https://your-domain.com/v1
```

### HTTPS Setup (Nginx Reverse Proxy)

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name panel.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Docker Production

```bash
# Build images
docker-compose build

# Start in production mode
NODE_ENV=production docker-compose up -d

# Monitor logs
docker-compose logs -f api

# Check health
curl http://localhost:3000/health
```

## MikroTik Configuration

### Create API User

```routeros
/user add name=apiuser password=<strong-password> group=full
```

### Enable API Service

```routeros
/ip service enable api
/ip service set api port=8728

# For TLS (recommended)
/ip service enable api-ssl
/ip service set api-ssl port=8729
```

### Verify Connection

Test from backend container:
```bash
docker-compose exec api node -e "
const { RouterOSAPI } = require('routeros-client');
const api = new RouterOSAPI({
  host: process.env.MT_HOST,
  user: process.env.MT_USER,
  password: process.env.MT_PASS,
  port: parseInt(process.env.MT_PORT)
});
api.connect()
  .then(() => console.log('Connected!'))
  .catch(console.error);
"
```

## Building Installers

### Bash Installer

The shell script is ready to use:
```bash
cd installer
chmod +x install.sh

# Configure
export API_BASE_URL="https://api.yourdomain.com/v1"
export INSTALLER_API_KEY="your-installer-key"

# Distribute
./install.sh
```

### Go Installer

```bash
cd installer/go

# Build for Linux
GOOS=linux GOARCH=amd64 go build \
  -ldflags "-X main.apiBaseURL=https://api.yourdomain.com/v1 -X main.installerAPIKey=your-installer-key" \
  -o ../installer-linux-amd64 main.go

# Build for ARM
GOOS=linux GOARCH=arm64 go build \
  -ldflags "-X main.apiBaseURL=https://api.yourdomain.com/v1 -X main.installerAPIKey=your-installer-key" \
  -o ../installer-linux-arm64 main.go
```

### Obfuscated Shell Script

```bash
# Install shc
sudo apt-get install shc

# Compile
cd installer
shc -f install.sh -o installer.bin

# Distribute installer.bin
```

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# Database connection
docker-compose exec db pg_isready -U user -d ipauth
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f db

# Follow with filter
docker-compose logs -f api | grep ERROR
```

### Database Backups

```bash
# Backup
docker-compose exec db pg_dump -U user ipauth > backup.sql

# Restore
docker-compose exec -T db psql -U user ipauth < backup.sql
```

## Troubleshooting

### Database Connection Failed

```bash
# Check database is running
docker-compose ps db

# Check connection string
docker-compose exec api printenv DATABASE_URL

# Test connection
docker-compose exec db psql -U user -d ipauth -c "SELECT 1"
```

### MikroTik Sync Not Working

1. Verify MikroTik is reachable
2. Check credentials are correct
3. Ensure API service is enabled on RouterOS
4. Check firewall rules allow API port (8728/8729)
5. Review backend logs for errors

### Frontend Cannot Connect to API

1. Verify `VITE_API_BASE` is set correctly
2. Check CORS configuration in backend
3. Ensure API is running and accessible
4. Check browser console for errors

### Installer Validation Fails

1. Verify license key exists and is active
2. Check IP is added to allowed list
3. Verify installer API key is correct
4. Check backend logs for the validation attempt
5. Ensure installer can reach the API endpoint

## Scaling

### Database

- Use managed PostgreSQL service (AWS RDS, Google Cloud SQL)
- Enable connection pooling
- Set up read replicas for scaling reads

### Backend

- Deploy multiple API instances behind load balancer
- Use Redis for session storage if needed
- Enable horizontal scaling with Docker Swarm or Kubernetes

### Frontend

- Deploy to CDN (Cloudflare, AWS CloudFront)
- Enable caching for static assets
- Use separate domain for API and frontend

## Maintenance

### Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations if needed
docker-compose exec api npm run migrate
```

### Rotating API Keys

1. Generate new keys
2. Update `.env` file
3. Restart backend: `docker-compose restart api`
4. Update all installers with new keys
5. Update admin panel users

### Database Maintenance

```bash
# Vacuum database
docker-compose exec db psql -U user -d ipauth -c "VACUUM ANALYZE"

# Check table sizes
docker-compose exec db psql -U user -d ipauth -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## Support

For issues and questions:
- Check logs first: `docker-compose logs -f`
- Review this guide and main README.md
- Open an issue on GitHub with relevant logs
