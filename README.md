# IP-based License Authentication Platform

A complete system for license key validation based on IP addresses with MikroTik RouterOS integration for automatic NAT management.

## Features

- 🔐 **License Management** - Create and manage license keys with expiration dates
- 🌐 **IP-based Authentication** - Validate licenses against IP addresses or CIDR ranges
- 🔄 **MikroTik Integration** - Automatic synchronization with RouterOS address lists and NAT rules
- 📊 **Admin Dashboard** - React-based web interface for license management
- 📝 **Audit Logging** - Comprehensive authentication logs with filtering
- 🐳 **Docker Ready** - Complete Docker Compose setup for easy deployment
- 🔧 **Installer Scripts** - Bash and Go installers with license validation

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Installer      │────▶│   Backend API    │────▶│   PostgreSQL    │
│  (Bash/Go)      │     │  (Node.js)       │     │   Database      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               │
                        ┌──────▼──────┐
                        │  MikroTik   │
                        │  RouterOS   │
                        └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- Go 1.21+ (for building installer)

### 1. Clone and Setup

```bash
git clone https://github.com/fahim8401/licenseing.git
cd licenseing

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Environment Configuration

Update `.env` with your settings:

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/ipauth

# API Keys (CHANGE THESE!)
ADMIN_API_KEY=your-secure-admin-key
INSTALLER_API_KEY=your-secure-installer-key

# MikroTik (optional)
ENABLE_MIKROTIK_SYNC=true
MT_HOST=10.0.0.1
MT_USER=apiuser
MT_PASS=apipass
MT_PORT=8728
MT_INTERFACE=HPLINK_INT
MT_PUBLIC_NAT_IP=103.7.4.222
MT_ADDRESS_LIST=LICENSED_IPS
```

### 3. Run with Docker (Recommended)

```bash
# Start all services
make up

# View logs
make logs

# Stop services
make down
```

The services will be available at:
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173

### 4. Manual Installation

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Database Migration

```bash
cd backend
npm run migrate
npm run seed  # Optional: seed with demo data
```

## Usage

### Admin Panel

1. Navigate to http://localhost:5173
2. Login with your `ADMIN_API_KEY`
3. Create licenses and manage allowed IPs

### Creating a License

**Via API:**
```bash
curl -X POST http://localhost:3000/v1/licenses \
  -H "X-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer A",
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Customer A",
  "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

### Adding Allowed IPs

```bash
curl -X POST http://localhost:3000/v1/licenses/1/ips \
  -H "X-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_cidr": "103.7.4.81",
    "note": "Customer A WAN IP"
  }'
```

### Validating a License (Installer)

```bash
curl -X POST http://localhost:3000/v1/auth/check \
  -H "X-API-KEY: your-installer-key" \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "public_ip": "103.7.4.81",
    "machine_id": "a1b2c3d4e5f6"
  }'
```

**Success Response (200):**
```json
{
  "allowed": true,
  "message": "OK"
}
```

**Failure Response (403):**
```json
{
  "allowed": false,
  "message": "IP address not authorized for this license"
}
```

## Installer Usage

### Bash Installer

```bash
cd installer
chmod +x install.sh

# Set environment variables
export API_BASE_URL="https://api.example.com/v1"
export INSTALLER_API_KEY="your-installer-key"

# Run installer
./install.sh "license-key-here"
```

### Go Installer

```bash
cd installer/go

# Build
go build -o ../installer main.go

# Run
../installer -license "license-key-here"
```

### Build with Embedded Keys

```bash
go build -ldflags "\
  -X main.apiBaseURL=https://api.example.com/v1 \
  -X main.installerAPIKey=your-installer-key" \
  -o installer main.go
```

## API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/auth/check` | Installer | Validate license for IP |

### License Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/licenses` | Admin | List all licenses |
| POST | `/v1/licenses` | Admin | Create new license |
| GET | `/v1/licenses/:id` | Admin | Get license details |
| PATCH | `/v1/licenses/:id` | Admin | Update license |
| DELETE | `/v1/licenses/:id` | Admin | Delete license |

### IP Management Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/licenses/:id/ips` | Admin | List IPs for license |
| POST | `/v1/licenses/:id/ips` | Admin | Add IP to license |
| DELETE | `/v1/licenses/:id/ips/:ipId` | Admin | Remove IP from license |

### Log Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/v1/logs` | Admin | List authentication logs |
| GET | `/v1/logs/stats` | Admin | Get authentication statistics |

## MikroTik Integration

When `ENABLE_MIKROTIK_SYNC=true`, the system automatically:

1. **Creates Address List** - Ensures `LICENSED_IPS` address list exists
2. **Adds IPs** - When you add an IP to a license, it's added to the address list
3. **Creates NAT Rule** - Automatically creates a single NAT rule:
   ```
   chain=srcnat
   src-address-list=LICENSED_IPS
   out-interface=HPLINK_INT
   to-addresses=103.7.4.222
   action=src-nat
   ```
4. **Removes IPs** - When you delete an IP, it's removed from the address list

### MikroTik Setup

1. Create an API user:
```
/user add name=apiuser password=apipass group=full
```

2. Ensure API service is enabled:
```
/ip service enable api
/ip service set api port=8728
```

## Development

### Backend Development

```bash
cd backend
npm run dev        # Start dev server with hot reload
npm run build      # Build TypeScript
npm test           # Run tests
npm run lint       # Run linter
```

### Frontend Development

```bash
cd frontend
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run lint       # Run linter
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# With coverage
npm test -- --coverage
```

## Deployment

### Production Checklist

- [ ] Change default API keys in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all endpoints
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts
- [ ] Review MikroTik credentials and access

### Docker Production Deployment

```bash
# Build images
docker-compose build

# Start in production mode
NODE_ENV=production docker-compose up -d

# View logs
docker-compose logs -f
```

## Security

- **API Keys**: Use strong, random keys. Rotate regularly.
- **HTTPS**: Always use HTTPS in production.
- **Rate Limiting**: Built-in rate limiting (60 req/min for auth checks).
- **Input Validation**: All inputs are validated and sanitized.
- **Database**: Use parameterized queries to prevent SQL injection.
- **Logging**: All authentication attempts are logged with full details.

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps db

# View database logs
docker-compose logs db

# Connect to database
docker-compose exec db psql -U user -d ipauth
```

### MikroTik Connection Issues

```bash
# Test connection
docker-compose exec api node -e "
const { RouterOSAPI } = require('routeros-client');
const api = new RouterOSAPI({
  host: 'YOUR_MT_HOST',
  user: 'YOUR_MT_USER',
  password: 'YOUR_MT_PASS',
  port: 8728
});
api.connect().then(() => console.log('Connected!')).catch(console.error);
"
```

### View Backend Logs

```bash
# Docker
docker-compose logs -f api

# Local
cd backend
npm run dev  # Logs to stdout
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: https://github.com/fahim8401/licenseing/issues
- Documentation: See `/docs` directory

## Roadmap

- [ ] JWT-based admin authentication
- [ ] Redis caching for IP lookups
- [ ] Webhook notifications
- [ ] CSV export for logs
- [ ] Offline license files with RSA signatures
- [ ] Multi-tenancy support
- [ ] Advanced analytics dashboard