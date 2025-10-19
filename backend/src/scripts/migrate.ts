import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running migrations...');
    
    const migrationPath = join(__dirname, '../migrations/001_init.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    await pool.query(sql);
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
