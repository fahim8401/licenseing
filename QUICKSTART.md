# Quick Start Guide

Get the IP-based License Authentication Platform up and running in 5 minutes!

## 1. Clone and Configure (1 minute)

```bash
# Clone the repository
git clone https://github.com/fahim8401/licenseing.git
cd licenseing

# Copy environment file
cp .env.example .env

# Edit .env and change at minimum:
# - ADMIN_API_KEY (for admin panel access)
# - INSTALLER_API_KEY (for installer authentication)
nano .env
```

**Important**: Change these default keys to strong, random values!

## 2. Start with Docker (2 minutes)

```bash
# Start all services (PostgreSQL, Backend API, Frontend)
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose logs -f
```

The database will be automatically initialized with the schema.

## 3. Access the System (1 minute)

Open your browser and navigate to:
- **Admin Panel**: http://localhost:5173
- **API**: http://localhost:3000

### Login to Admin Panel

1. Open http://localhost:5173
2. Enter your `ADMIN_API_KEY` from the `.env` file
3. Click "Sign in"

## 4. Create Your First License (1 minute)

### Via Admin Panel

1. Go to "Licenses" page
2. Click "Create License"
3. Fill in:
   - Name: "Demo License"
   - Leave license key blank (auto-generated)
   - Set expiration date (optional)
4. Click "Create"
5. Copy the generated license key

### Add Allowed IP

1. Click "View" on the license
2. Click "Add IP"
3. Enter an IP address or CIDR:
   - For testing locally: `127.0.0.1`
   - For your network: `192.168.1.0/24`
   - For specific IP: `103.7.4.81`
4. Add a note (optional)
5. Click "Add IP"

## 5. Test License Validation

### Using curl

```bash
curl -X POST http://localhost:3000/v1/auth/check \
  -H "X-API-KEY: your-installer-key-from-env" \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "your-license-key-here",
    "public_ip": "127.0.0.1",
    "machine_id": "test-machine"
  }'
```

**Expected Response (Success)**:
```json
{
  "allowed": true,
  "message": "OK"
}
```

### Using the Installer

```bash
cd installer

# Configure
export API_BASE_URL="http://localhost:3000/v1"
export INSTALLER_API_KEY="your-installer-key"

# Run installer
./install.sh "your-license-key-here"
```

## What's Next?

### Explore Features

- **Dashboard**: View stats and recent authentication logs
- **Licenses**: Manage license keys and their status
- **Logs**: View detailed authentication history with filters
- **Settings**: Review configuration information

### Add MikroTik Integration (Optional)

If you have a MikroTik router and want automatic NAT management:

1. Edit `.env`:
   ```bash
   ENABLE_MIKROTIK_SYNC=true
   MT_HOST=10.0.0.1
   MT_USER=apiuser
   MT_PASS=apipass
   MT_PORT=8728
   MT_INTERFACE=your-wan-interface
   MT_PUBLIC_NAT_IP=your-public-ip
   ```

2. Restart the backend:
   ```bash
   docker-compose restart api
   ```

3. Add an IP to a license - it will automatically sync to MikroTik!

### Build Production Installers

#### Bash Installer
```bash
cd installer
chmod +x install.sh

# Edit API_BASE_URL and INSTALLER_API_KEY in the script
# Then distribute install.sh to your customers
```

#### Go Installer (Compiled Binary)
```bash
cd installer/go

# Build with embedded API credentials
go build -ldflags "\
  -X main.apiBaseURL=https://your-api-domain.com/v1 \
  -X main.installerAPIKey=your-installer-key" \
  -o ../installer main.go

# Distribute the 'installer' binary
```

## Common Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# Restart a service
docker-compose restart api

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Seed demo data
docker-compose exec api npm run seed
```

## Troubleshooting

### Can't access the frontend
- Check if port 5173 is available: `lsof -i :5173`
- Check frontend logs: `docker-compose logs frontend`

### Can't access the API
- Check if port 3000 is available: `lsof -i :3000`
- Check API logs: `docker-compose logs api`

### Database errors
- Check database is running: `docker-compose ps db`
- Check database logs: `docker-compose logs db`

### License validation fails
1. Verify the license exists and is active in admin panel
2. Check the IP is in the allowed list
3. Verify API key is correct
4. Check backend logs: `docker-compose logs api`

## Need Help?

- Full documentation: See `README.md`
- Deployment guide: See `DEPLOYMENT.md`
- Installer guide: See `installer/README.md`
- GitHub Issues: https://github.com/fahim8401/licenseing/issues

## Development Mode (Without Docker)

### Backend
```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Access at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

**That's it!** You now have a fully functional IP-based license authentication system running.

Start creating licenses, adding IPs, and integrating with your installers!
