#!/usr/bin/env node
// deploy.js - Build and deploy script for multiple Hostinger sites
//
// SECURITY NOTE: This script uses environment variables for sensitive information.
// NEVER commit actual credentials to Git. Use placeholder values for any default values.
// Set up a .env file locally (and add it to .gitignore) for actual deployment.
// For GitHub Actions, use GitHub Secrets to store credentials.

import { existsSync, mkdirSync, rmSync, cpSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Configuration for deployment
const config = {
  // Source directory (where the build files will be)
  distDir: 'dist',
  
  // Targets - add all your Hostinger deployment locations here
  targets: [
    {
      name: 'wa1x.thechief.com',
      ftpHost: 'wa1x.thechief.com',
      ftpUser: process.env.FTP_USER_WA1X || 'YOUR_USERNAME',  // ⚠️ Never use actual passwords here
      ftpPass: process.env.FTP_PASS_WA1X || 'YOUR_PASSWORD',  // ⚠️ Use environment variables instead
      remotePath: '/public_html/'
    },
    {
      name: 'applefinch.thechief.com',
      ftpHost: 'applefinch.thechief.com',
      ftpUser: process.env.FTP_USER_APPLEFINCH || 'YOUR_USERNAME',  // ⚠️ Placeholder only
      ftpPass: process.env.FTP_PASS_APPLEFINCH || 'YOUR_PASSWORD',  // ⚠️ Placeholder only
      remotePath: '/public_html/'
    }
  ]
};

// Create temp directory for deployment files
const tempDir = 'deploy-temp';

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const targetName = args[1] || 'all';

// Pre-build cleanup tasks
function preBuild() {
  console.log('=== Running pre-build tasks ===');
  
  // Clean the dist directory if it exists
  if (existsSync(config.distDir)) {
    console.log('Cleaning dist directory...');
    rmSync(config.distDir, { recursive: true, force: true });
  }
  
  // Clean the deploy temp directory if it exists
  if (existsSync(tempDir)) {
    console.log('Cleaning deploy temp directory...');
    rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log('Pre-build tasks completed successfully.');
}

// Post-build tasks
function postBuild() {
  console.log('=== Running post-build tasks ===');

  // Verify that the dist directory exists
  if (!existsSync(config.distDir)) {
    console.error('Error: Dist directory not found!');
    process.exit(1);
  }

  // Copy all files from public directory to dist
  try {
    const publicDir = 'public';
    if (existsSync(publicDir)) {
      console.log('Copying all files from public directory to dist...');
      
      // Get all files and directories in the public folder
      const items = readdirSync(publicDir, { withFileTypes: true });
      
      // Copy each item to dist
      for (const item of items) {
        const sourcePath = path.join(publicDir, item.name);
        const destPath = path.join(config.distDir, item.name);
        
        // Skip copying if the item is a directory used by Vite (like public/images)
        // and it's already been copied automatically by Vite
        if (item.isDirectory() && existsSync(destPath)) {
          console.log(`  Skipping directory that Vite already processed: ${item.name}`);
          continue;
        }
        
        // Copy the file or directory
        console.log(`  Copying ${item.isDirectory() ? 'directory' : 'file'}: ${item.name}`);
        cpSync(sourcePath, destPath, { recursive: true });
      }
      
      console.log('All public files copied to dist directory');
    } else {
      console.warn('Warning: Public directory not found!');
    }
    
    console.log('Post-build tasks completed successfully.');
  } catch (error) {
    console.error('Error during post-build tasks:', error);
    process.exit(1);
  }
}

// Build the application
function buildApp() {
  console.log('=== Building application ===');
  
  try {
    // Run the TypeScript compiler
    console.log('Running TypeScript compiler...');
    execSync('tsc -b', { stdio: 'inherit' });
    
    // Run the Vite build
    console.log('Running Vite build...');
    execSync('vite build --mode=production --base=./', { stdio: 'inherit' });
    
    console.log('Build completed successfully.');
  } catch (error) {
    console.error('Error during build:', error);
    process.exit(1);
  }
}

// Deploy to a specific target using FTP
function deployToTarget(target) {
  console.log(`=== Deploying to ${target.name} ===`);
  
  try {
    // Create temp directory for this target if it doesn't exist
    const targetTempDir = path.join(tempDir, target.name);
    if (!existsSync(targetTempDir)) {
      mkdirSync(targetTempDir, { recursive: true });
    }
    
    // Copy dist files to the target temp directory
    console.log('Copying build files to deployment directory...');
    cpSync(config.distDir, targetTempDir, { recursive: true });
    
    // Ask the user if they want to proceed with FTP upload
    console.log(`\nReady to deploy to ${target.name} via FTP.`);
    console.log(`Server: ${target.ftpHost}`);
    console.log(`Username: ${target.ftpUser}`);
    console.log(`Remote path: ${target.remotePath}`);
    
    // Create a deployment script for this target
    const deployScriptPath = path.join(targetTempDir, 'deploy.sh');
    const deployScript = `#!/bin/bash
echo "Deploying to ${target.name}..."

# Install lftp if not already installed
# Uncomment these lines if needed
# if ! command -v lftp &> /dev/null; then
#     echo "lftp is not installed. Installing..."
#     sudo apt-get update
#     sudo apt-get install -y lftp
# fi

# Use lftp to mirror the local directory to the remote server
lftp -c "
open -u ${target.ftpUser},${target.ftpPass} ${target.ftpHost};
set ssl:verify-certificate no;
mirror -R -e -v . ${target.remotePath};
bye;
"

echo "Deployment to ${target.name} complete!"
`;
    writeFileSync(deployScriptPath, deployScript);
    
    // Make the script executable
    execSync(`chmod +x ${deployScriptPath}`);
    
    // Ask if the user wants to proceed with automatic upload
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`\nDo you want to proceed with automatic FTP upload? (y/n): `, (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        try {
          console.log(`\nUploading files to ${target.name}...`);
          
          // Check if lftp is installed
          try {
            execSync('lftp --version', { stdio: 'ignore' });
          } catch (error) {
            console.error('Error: lftp is not installed. Please install it first:');
            console.error('  - macOS: brew install lftp');
            console.error('  - Ubuntu/Debian: sudo apt-get install lftp');
            console.error('  - Windows: Use WinSCP or install lftp via WSL/Cygwin');
            
            console.log(`\nAlternatively, you can manually upload the files from:`);
            console.log(`  ${path.resolve(targetTempDir)}`);
            console.log(`to your server at ${target.remotePath}`);
            return;
          }
          
          // Execute the upload script
          execSync(`cd ${targetTempDir} && ./deploy.sh`, { 
            stdio: 'inherit' 
          });
          
          console.log(`\nDeployment to ${target.name} completed successfully!`);
        } catch (uploadError) {
          console.error(`\nError during FTP upload:`, uploadError);
          console.log(`\nYou can still manually upload the files from:`);
          console.log(`  ${path.resolve(targetTempDir)}`);
          console.log(`to your server at ${target.remotePath}`);
        }
      } else {
        console.log(`\nAutomatic upload skipped. To deploy manually:`);
        console.log(`1. Navigate to: ${path.resolve(targetTempDir)}`);
        console.log(`2. Run: ./deploy.sh`);
        console.log(`   (Requires lftp to be installed)`);
        console.log(`Or upload the contents of this directory to your Hostinger site manually via FTP.`);
      }
    });
  } catch (error) {
    console.error(`Error deploying to ${target.name}:`, error);
  }
}

// Main function
function main() {
  switch (command) {
    case 'pre-build':
      preBuild();
      break;
      
    case 'post-build':
      postBuild();
      break;
      
    case 'build':
      preBuild();
      buildApp();
      postBuild();
      break;
      
    case 'deploy':
      if (!existsSync(config.distDir)) {
        console.error('Error: Dist directory not found! Run build first.');
        process.exit(1);
      }
      
      // Create temp directory if it doesn't exist
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }
      
      if (targetName === 'all') {
        // Deploy to all targets
        for (const target of config.targets) {
          deployToTarget(target);
        }
      } else {
        // Deploy to a specific target
        const target = config.targets.find(t => t.name === targetName);
        if (target) {
          deployToTarget(target);
        } else {
          console.error(`Error: Target "${targetName}" not found!`);
          console.log('Available targets:');
          config.targets.forEach(t => console.log(`- ${t.name}`));
          process.exit(1);
        }
      }
      break;
      
    case 'full':
      preBuild();
      buildApp();
      postBuild();
      
      // Create temp directory if it doesn't exist
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true });
      }
      
      if (targetName === 'all') {
        // Deploy to all targets
        for (const target of config.targets) {
          deployToTarget(target);
        }
      } else {
        // Deploy to a specific target
        const target = config.targets.find(t => t.name === targetName);
        if (target) {
          deployToTarget(target);
        } else {
          console.error(`Error: Target "${targetName}" not found!`);
          console.log('Available targets:');
          config.targets.forEach(t => console.log(`- ${t.name}`));
          process.exit(1);
        }
      }
      break;
      
    case 'help':
    default:
      console.log(`
Deploy Script Usage:
  node deploy.js [command] [target]

Commands:
  pre-build       Clean up and prepare for build
  post-build      Process files after build
  build           Run the full build process (pre-build + build + post-build)
  deploy [target] Deploy to specified target (requires build first)
  full [target]   Run full build and deploy to specified target
  help            Show this help message

Targets:
  all             Deploy to all targets (default)
  [target-name]   Deploy to a specific target

Examples:
  node deploy.js build                 # Build the application
  node deploy.js deploy wa1x.thechief.com  # Deploy to wa1x.thechief.com
  node deploy.js full applefinch.thechief.com  # Build and deploy to applefinch.thechief.com
`);
      break;
  }
}

// Run the main function
main();