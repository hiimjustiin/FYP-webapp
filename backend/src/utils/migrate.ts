#!/usr/bin/env node

/**
 * Migration runner that loads environment variables from parent .env file
 * This ensures DATABASE_URL is available for node-pg-migrate
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up: utils -> src -> backend -> root)
const envPath = resolve(__dirname, '../../../.env');
config({ path: envPath });

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL not found in environment');
  console.error(`   Looked for .env file at: ${envPath}`);
  console.error('   Please ensure .env file exists with DATABASE_URL set');
  console.error('   Example: DATABASE_URL=postgresql://ila_user:password@localhost:5432/ila_db');
  process.exit(1);
}

console.log('✓ Loaded environment from:', envPath);
console.log('✓ DATABASE_URL found');

// Get command arguments (e.g., "up", "down", "create")
const args = process.argv.slice(2);
const command = args.length > 0 ? args : ['up'];

// Run node-pg-migrate with the loaded environment
const migrate = spawn('node-pg-migrate', [...command, '--migrations-dir', './migrations'], {
  stdio: 'inherit',
  env: process.env,
  cwd: resolve(__dirname, '../../')  // Run from backend directory
});

migrate.on('close', (code) => {
  process.exit(code);
});
