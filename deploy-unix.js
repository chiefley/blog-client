#!/usr/bin/env node

// deploy-unix.js - Unix-compatible deployment script using lftp
/**
 * XBlog Deployment Script - Unix Version
 * 
 * This script builds the React application and deploys it using lftp (Unix/Linux/WSL)
 * 
 * Usage:
 *   node deploy-unix.js clean                   # Clean dist directory
 *   node deploy-unix.js build                   # Build only (includes clean)
 *   node deploy-unix.js deploy [target]         # Deploy to one or all targets
 *   node deploy-unix.js full [target]           # Full build and deploy
 */

import { promises as fs, existsSync } from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables from .env file if present
// Use custom parsing to handle # in passwords
const envPath = '.env';
try {
  const envContent = readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) return;
    
    // Split only on first = to handle = in values
    const index = line.indexOf('=');
    if (index > 0) {
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim();
      envVars[key] = value;
    }
  });
  
  // Merge with process.env
  Object.assign(process.env, envVars);
} catch (e) {
  // Fall back to dotenv if custom parsing fails
  dotenv.config();
}

// Define constants
const DIST_DIR = path.resolve('./dist');

// Define deployment targets
const targets = [
  {
    name: 'wa1x',
    ftpHost: process.env.FTP_HOST || 'wa1x.thechief.com',
    ftpUser: process.env.FTP_USER_WA1X || 'u598898806.wa1x.thechief.com',
    ftpPass: process.env.FTP_PASS_WA1X || '',
    remotePath: process.env.FTP_WA1X_PATH || '/public_html'
  },
  {
    name: 'applefinch',
    ftpHost: process.env.FTP_HOST || 'applefinch.thechief.com',
    ftpUser: process.env.FTP_USER_APPLEFINCH || 'u598898806.applefinch.thechief.com',
    ftpPass: process.env.FTP_PASS_APPLEFINCH || '',
    remotePath: process.env.FTP_APPLEFINCH_PATH || '/public_html'
  }
];

/**
 * Check if lftp is installed
 */
function checkLftp() {
  try {
    execSync('which lftp', { stdio: 'ignore' });
    return true;
  } catch {
    console.error('❌ lftp is not installed!');
    console.log('Please install lftp:');
    console.log('  Ubuntu/Debian: sudo apt-get install lftp');
    console.log('  macOS: brew install lftp');
    console.log('  WSL: sudo apt-get install lftp');
    return false;
  }
}

/**
 * Clean the dist directory
 */
async function cleanDist() {
  console.log('Cleaning dist directory...');
  try {
    if (existsSync(DIST_DIR)) {
      await fs.rm(DIST_DIR, { recursive: true, force: true });
    }
    console.log('✅ Dist directory cleaned!\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to clean dist directory:', error.message);
    return false;
  }
}

/**
 * Build the project
 */
async function buildProject() {
  console.log('Building project...');
  try {
    // Clean first
    await cleanDist();
    
    // Run Vite build directly
    execSync('npx vite build', { stdio: 'inherit' });
    
    // Copy .htaccess file from public directory
    const htaccessSource = path.resolve('./public/.htaccess');
    const htaccessDest = path.join(DIST_DIR, '.htaccess');
    if (existsSync(htaccessSource)) {
      await fs.copyFile(htaccessSource, htaccessDest);
      console.log('✅ .htaccess file copied to dist directory');
    }
    
    console.log('✅ Build completed successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
}

/**
 * Deploy using lftp
 * @param {object} target - The deployment target
 * @returns {Promise<boolean>} - Success status
 */
async function deployWithLftp(target) {
  console.log(`\n=== Deploying to ${target.name} ===`);
  console.log(`Server: ${target.ftpHost}`);
  console.log(`Username: ${target.ftpUser}`);
  console.log(`Remote path: ${target.remotePath}`);
  console.log(`Source directory: ${DIST_DIR}`);

  if (!target.ftpPass) {
    console.error('❌ FTP password not found in environment variables!');
    return false;
  }

  // Don't use URL format with special characters - use separate user command
  // This avoids issues with special characters in passwords
  
  // Create lftp command
  const lftpCommands = `
set ssl:verify-certificate no
set ftp:passive-mode on
set ftp:list-options -a
open ${target.ftpHost}
user ${target.ftpUser} ${target.ftpPass}
mirror --reverse --delete --verbose --parallel=3 ${DIST_DIR} ${target.remotePath}
bye
`;

  try {
    // Execute lftp with commands
    console.log('\nStarting FTP upload...');
    const child = spawn('lftp', ['-c', lftpCommands], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle output
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    // Wait for completion
    return new Promise((resolve) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`\n✅ Deployment to ${target.name} completed successfully!`);
          resolve(true);
        } else {
          console.error(`\n❌ Deployment to ${target.name} failed with code ${code}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error(`\n❌ Deployment error: ${error.message}`);
    return false;
  }
}

/**
 * Main deployment function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const targetName = args[1];

  if (!command) {
    console.log(`
XBlog Deployment Script - Unix Version

Usage:
  node deploy-unix.js clean                   # Clean dist directory
  node deploy-unix.js build                   # Build only (includes clean)
  node deploy-unix.js deploy [target]         # Deploy to one or all targets
  node deploy-unix.js full [target]           # Full build and deploy

Available targets:
  - wa1x
  - applefinch

Examples:
  node deploy-unix.js deploy wa1x            # Deploy to wa1x
  node deploy-unix.js full applefinch        # Build and deploy to applefinch
  node deploy-unix.js full                    # Build and deploy to all targets
`);
    process.exit(0);
  }

  // Check if lftp is installed
  if (!checkLftp()) {
    process.exit(1);
  }

  // Handle commands
  switch (command) {
    case 'pre-build':
    case 'clean':
      await cleanDist();
      break;
      
    case 'build':
      await buildProject();
      break;

    case 'deploy':
      if (!existsSync(DIST_DIR)) {
        console.error('❌ Build directory not found! Run build first.');
        process.exit(1);
      }

      if (targetName) {
        const target = targets.find(t => t.name === targetName);
        if (!target) {
          console.error(`❌ Unknown target: ${targetName}`);
          console.log('Available targets:', targets.map(t => t.name).join(', '));
          process.exit(1);
        }
        await deployWithLftp(target);
      } else {
        // Deploy to all targets
        for (const target of targets) {
          await deployWithLftp(target);
        }
      }
      break;

    case 'full':
      if (await buildProject()) {
        if (targetName) {
          const target = targets.find(t => t.name === targetName);
          if (!target) {
            console.error(`❌ Unknown target: ${targetName}`);
            console.log('Available targets:', targets.map(t => t.name).join(', '));
            process.exit(1);
          }
          await deployWithLftp(target);
        } else {
          // Deploy to all targets
          for (const target of targets) {
            await deployWithLftp(target);
          }
        }
      }
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Run the script
main().catch(console.error);