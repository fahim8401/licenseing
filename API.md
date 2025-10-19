# API Documentation

Base URL: `http://localhost:3000/v1` (development)

All authenticated endpoints require an `X-API-KEY` header with either:
- **Admin API Key**: For management operations
- **Installer API Key**: For license validation

## Authentication

All API requests must include the API key in the header:

```
X-API-KEY: your-api-key-here
```

### Roles

- **Admin**: Full access to all endpoints (CRUD operations)
- **Installer**: Limited to license validation endpoint only

## Endpoints

### Health Check

#### GET `/health`

Check if the API is running.

**Authentication**: None required

**Response**: 200 OK
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication Endpoints

### POST `/v1/auth/check`

Validate a license key for a specific IP address.

**Authentication**: Installer or Admin API key required

**Rate Limit**: 60 requests per minute per IP

**Request Body**:
```json
{
  "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "public_ip": "103.7.4.81",
  "machine_id": "a1b2c3d4e5f6"
}
```

**Success Response**: 200 OK
```json
{
  "allowed": true,
  "message": "OK"
}
```

**Failure Responses**: 403 Forbidden

License not found:
```json
{
  "allowed": false,
  "message": "License not found"
}
```

License inactive:
```json
{
  "allowed": false,
  "message": "License is inactive"
}
```

License expired:
```json
{
  "allowed": false,
  "message": "License has expired"
}
```

IP not authorized:
```json
{
  "allowed": false,
  "message": "IP address not authorized for this license"
}
```

---

## License Management

### GET `/v1/licenses`

List all licenses.

**Authentication**: Admin API key required

**Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "Customer A",
    "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "active": true,
    "created_at": "2024-01-15T10:30:00.000Z",
    "expires_at": "2025-12-31T23:59:59.000Z"
  }
]
```

### POST `/v1/licenses`

Create a new license.

**Authentication**: Admin API key required

**Request Body**:
```json
{
  "name": "Customer A",
  "license_key": "optional-custom-key",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Notes**:
- `name`: Optional, human-readable identifier
- `license_key`: Optional, auto-generated UUID if not provided
- `expires_at`: Optional, ISO 8601 datetime, null means never expires

**Response**: 201 Created
```json
{
  "id": 1,
  "name": "Customer A",
  "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "active": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "expires_at": "2025-12-31T23:59:59.000Z"
}
```

**Error Responses**:

409 Conflict (duplicate key):
```json
{
  "error": "License key already exists"
}
```

### GET `/v1/licenses/:id`

Get a specific license with its allowed IPs.

**Authentication**: Admin API key required

**Response**: 200 OK
```json
{
  "id": 1,
  "name": "Customer A",
  "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "active": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "expires_at": "2025-12-31T23:59:59.000Z",
  "allowed_ips": [
    {
      "id": 1,
      "license_id": 1,
      "ip_cidr": "103.7.4.81",
      "note": "Customer A WAN",
      "created_at": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**Error Response**: 404 Not Found
```json
{
  "error": "License not found"
}
```

### PATCH `/v1/licenses/:id`

Update a license.

**Authentication**: Admin API key required

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "active": false,
  "expires_at": "2026-12-31T23:59:59Z"
}
```

**Response**: 200 OK
```json
{
  "id": 1,
  "name": "Updated Name",
  "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "active": false,
  "created_at": "2024-01-15T10:30:00.000Z",
  "expires_at": "2026-12-31T23:59:59.000Z"
}
```

### DELETE `/v1/licenses/:id`

Delete a license (cascades to allowed IPs).

**Authentication**: Admin API key required

**Response**: 200 OK
```json
{
  "message": "License deleted successfully"
}
```

---

## IP Management

### GET `/v1/licenses/:licenseId/ips`

List all allowed IPs for a license.

**Authentication**: Admin API key required

**Response**: 200 OK
```json
[
  {
    "id": 1,
    "license_id": 1,
    "ip_cidr": "103.7.4.81",
    "note": "Customer A WAN",
    "created_at": "2024-01-15T10:35:00.000Z"
  },
  {
    "id": 2,
    "license_id": 1,
    "ip_cidr": "192.168.1.0/24",
    "note": "Customer A LAN",
    "created_at": "2024-01-15T10:40:00.000Z"
  }
]
```

### POST `/v1/licenses/:licenseId/ips`

Add an IP or CIDR range to a license.

**Authentication**: Admin API key required

**Request Body**:
```json
{
  "ip_cidr": "103.7.4.81",
  "note": "Customer A WAN"
}
```

**Notes**:
- `ip_cidr`: Can be a single IP (e.g., `103.7.4.81`) or CIDR range (e.g., `192.168.1.0/24`)
- `note`: Optional, descriptive text
- If MikroTik sync is enabled, IP is automatically added to the router

**Response**: 201 Created
```json
{
  "id": 1,
  "license_id": 1,
  "ip_cidr": "103.7.4.81",
  "note": "Customer A WAN",
  "created_at": "2024-01-15T10:35:00.000Z"
}
```

**Error Responses**:

400 Bad Request (invalid IP):
```json
{
  "error": "Invalid IP address or CIDR format"
}
```

404 Not Found (license doesn't exist):
```json
{
  "error": "License not found"
}
```

### DELETE `/v1/licenses/:licenseId/ips/:ipId`

Remove an IP from a license.

**Authentication**: Admin API key required

**Notes**:
- If MikroTik sync is enabled, IP is automatically removed from the router

**Response**: 200 OK
```json
{
  "message": "IP removed successfully"
}
```

---

## Logging

### GET `/v1/logs`

List authentication logs with pagination and filtering.

**Authentication**: Admin API key required

**Query Parameters**:
- `page`: Page number (default: 1)
- `perPage`: Results per page, max 100 (default: 50)
- `result`: Filter by result (`allowed`, `denied`, `license-not-found`, `license-inactive`, `license-expired`)
- `license_key`: Filter by license key
- `start_date`: Filter logs after this date (ISO 8601)
- `end_date`: Filter logs before this date (ISO 8601)

**Example**:
```
GET /v1/logs?page=1&perPage=20&result=allowed
```

**Response**: 200 OK
```json
{
  "logs": [
    {
      "id": 123,
      "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "request_ip": "103.7.4.81",
      "machine_identifier": "a1b2c3d4e5f6",
      "result": "allowed",
      "raw_request": {
        "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "public_ip": "103.7.4.81",
        "machine_id": "a1b2c3d4e5f6"
      },
      "created_at": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET `/v1/logs/stats`

Get authentication statistics.

**Authentication**: Admin API key required

**Response**: 200 OK
```json
{
  "total": 1523,
  "last24Hours": {
    "allowed": 245,
    "denied": 12,
    "license-not-found": 5,
    "license-inactive": 3
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Resource created successfully |
| 400 | Bad request (invalid input) |
| 401 | Unauthorized (missing API key) |
| 403 | Forbidden (invalid API key or insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

## Rate Limiting

- **Auth Check Endpoint**: 60 requests per minute per IP
- **General API Endpoints**: 100 requests per minute per IP

Rate limit information is included in response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705318800
```

## Examples

### Complete Workflow Example

#### 1. Create a License

```bash
curl -X POST http://localhost:3000/v1/licenses \
  -H "X-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer A",
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

#### 2. Add Allowed IPs

```bash
# Add single IP
curl -X POST http://localhost:3000/v1/licenses/1/ips \
  -H "X-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_cidr": "103.7.4.81",
    "note": "Office WAN"
  }'

# Add CIDR range
curl -X POST http://localhost:3000/v1/licenses/1/ips \
  -H "X-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_cidr": "192.168.1.0/24",
    "note": "Office LAN"
  }'
```

#### 3. Validate License

```bash
curl -X POST http://localhost:3000/v1/auth/check \
  -H "X-API-KEY: your-installer-key" \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "public_ip": "103.7.4.81",
    "machine_id": "server-01"
  }'
```

#### 4. View Logs

```bash
curl -X GET "http://localhost:3000/v1/logs?result=allowed&page=1" \
  -H "X-API-KEY: your-admin-key"
```

#### 5. Deactivate License

```bash
curl -X PATCH http://localhost:3000/v1/licenses/1 \
  -H "X-API-KEY: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "active": false
  }'
```

## SDKs and Integration

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/v1',
  headers: {
    'X-API-KEY': 'your-admin-key',
    'Content-Type': 'application/json'
  }
});

// Create license
const license = await api.post('/licenses', {
  name: 'Customer A',
  expires_at: '2025-12-31T23:59:59Z'
});

// Add IP
await api.post(`/licenses/${license.data.id}/ips`, {
  ip_cidr: '103.7.4.81',
  note: 'Customer WAN'
});
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000/v1'
API_KEY = 'your-admin-key'

headers = {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
}

# Create license
response = requests.post(f'{API_BASE}/licenses', 
    headers=headers,
    json={
        'name': 'Customer A',
        'expires_at': '2025-12-31T23:59:59Z'
    })

license_data = response.json()

# Add IP
requests.post(f'{API_BASE}/licenses/{license_data["id"]}/ips',
    headers=headers,
    json={
        'ip_cidr': '103.7.4.81',
        'note': 'Customer WAN'
    })
```

### PHP

```php
<?php
$apiBase = 'http://localhost:3000/v1';
$apiKey = 'your-admin-key';

$headers = [
    'X-API-KEY: ' . $apiKey,
    'Content-Type: application/json'
];

// Create license
$ch = curl_init($apiBase . '/licenses');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'name' => 'Customer A',
    'expires_at' => '2025-12-31T23:59:59Z'
]));

$response = curl_exec($ch);
$license = json_decode($response, true);

// Add IP
$ch = curl_init($apiBase . '/licenses/' . $license['id'] . '/ips');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'ip_cidr' => '103.7.4.81',
    'note' => 'Customer WAN'
]));

curl_exec($ch);
?>
```
