import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Seeding database...');
    
    // Create sample license
    const licenseKey = uuidv4();
    const result = await pool.query(
      'INSERT INTO licenses (name, license_key, expires_at) VALUES ($1, $2, $3) RETURNING *',
      ['Demo License', licenseKey, new Date('2025-12-31T23:59:59Z')]
    );
    
    const license = result.rows[0];
    console.log('Created demo license:', license.license_key);
    
    // Add sample IPs
    await pool.query(
      'INSERT INTO allowed_ips (license_id, ip_cidr, note) VALUES ($1, $2, $3)',
      [license.id, '127.0.0.1', 'Localhost for testing']
    );
    
    await pool.query(
      'INSERT INTO allowed_ips (license_id, ip_cidr, note) VALUES ($1, $2, $3)',
      [license.id, '192.168.1.0/24', 'Local network']
    );
    
    console.log('Added sample IPs to license');
    console.log('\nDemo credentials:');
    console.log('License Key:', licenseKey);
    console.log('Allowed IPs: 127.0.0.1, 192.168.1.0/24');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
