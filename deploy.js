// deploy.js - Simplified deployment script for XBlog
/**
 * XBlog Deployment Script - Simplified Version
 * 
 * This script builds the React application and deploys it directly from the dist directory.
 * 
 * Usage:
 *   node deploy.js build                        # Build only
 *   node deploy.js deploy [target]              # Deploy to one or all targets
 *   node deploy.js full [target]                # Full build and deploy
 */

import { promises as fs, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import dotenv from 'dotenv';

// Load environment variables from .env file if present
dotenv.config();

// Define constants
const DIST_DIR = path.resolve('./dist');
const PUBLIC_DIR = path.resolve('./public');
const DEPLOY_SCRIPTS_DIR = path.resolve('./deploy-scripts');
const RL = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define deployment targets
const targets = [
  {
    name: 'wa1x.thechief.com',
    ftpHost: 'wa1x.thechief.com',
    ftpUser: process.env.FTP_USER_WA1X || 'u598898806.wa1x.thechief.com',
    ftpPass: process.env.FTP_PASS_WA1X || 'YOUR_PASSWORD',
    remotePath: '/public_html/'
  },
  {
    name: 'applefinch.thechief.com',
    ftpHost: 'applefinch.thechief.com',
    ftpUser: process.env.FTP_USER_APPLEFINCH || 'u598898806.applefinch.thechief.com',
    ftpPass: process.env.FTP_PASS_APPLEFINCH || 'YOUR_PASSWORD',
    remotePath: '/public_html/'
  }
];

/**
 * Ask a yes/no question in the console
 * @param {string} question - The question to ask
 * @returns {Promise<boolean>} - True if the answer is 'y' or 'yes'
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    RL.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Clean up the build directories
 */
async function cleanDirectories() {
  console.log('=== Cleaning directories ===');
  
  // Clean the dist directory if it exists
  if (existsSync(DIST_DIR)) {
    console.log('Cleaning dist directory...');
    try {
      await fs.rm(DIST_DIR, { recursive: true, force: true });
    } catch (err) {
      // Fallback for older Node.js versions - use execSync
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${DIST_DIR}"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${DIST_DIR}"`, { stdio: 'ignore' });
      }
    }
  }
  
  // Clean the deploy-scripts directory if it exists
  if (existsSync(DEPLOY_SCRIPTS_DIR)) {
    console.log('Cleaning deploy-scripts directory...');
    try {
      await fs.rm(DEPLOY_SCRIPTS_DIR, { recursive: true, force: true });
    } catch (err) {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${DEPLOY_SCRIPTS_DIR}"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${DEPLOY_SCRIPTS_DIR}"`, { stdio: 'ignore' });
      }
    }
  }
  
  // Create deploy-scripts directory
  mkdirSync(DEPLOY_SCRIPTS_DIR, { recursive: true });
  
  console.log('Directories cleaned successfully!');
}

/**
 * Build the application
 */
async function buildApp() {
  console.log('=== Building application ===');
  
  try {
    // Compile TypeScript
    console.log('Compiling TypeScript...');
    execSync('tsc -b', { stdio: 'inherit' });
    
    // Build with Vite
    console.log('Running Vite build...');
    execSync('vite build --mode=production', { stdio: 'inherit' });
    
    // Verify that the dist directory exists
    if (!existsSync(DIST_DIR)) {
      console.error('Error: Dist directory not found after build!');
      return false;
    }
    
    // Copy all files from public folder to dist
    console.log('Copying public files to dist...');
    await copyPublicFiles();
    
    console.log('Application built successfully!');
    return true;
  } catch (error) {
    console.error('Build failed:', error.message);
    return false;
  }
}

/**
 * Copy files from public directory to dist
 */
async function copyPublicFiles() {
  // Skip if public directory doesn't exist
  if (!existsSync(PUBLIC_DIR)) {
    console.log(`Public directory ${PUBLIC_DIR} does not exist, skipping copy.`);
    return;
  }
  
  // Ensure dist directory exists
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }
  
  // Read the public directory
  const entries = await fs.readdir(PUBLIC_DIR, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(PUBLIC_DIR, entry.name);
    const targetPath = path.join(DIST_DIR, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy directories
      await copyDirectory(sourcePath, targetPath);
    } else {
      // Copy files
      await fs.copyFile(sourcePath, targetPath);
    }
  }
  
  console.log('All public files copied to dist directory');
}

/**
 * Recursively copy a directory
 * @param {string} sourceDir - Source directory
 * @param {string} targetDir - Target directory
 */
async function copyDirectory(sourceDir, targetDir) {
  // Create target directory if it doesn't exist
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  
  // Read the source directory
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy directories
      await copyDirectory(sourcePath, targetPath);
    } else {
      // Copy files
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Create a WinSCP script file for deployment
 * @param {object} target - The deployment target
 * @returns {Promise<string>} - Path to the created script file
 */
async function createWinScpScript(target) {
  const scriptPath = path.join(DEPLOY_SCRIPTS_DIR, `winscp_${target.name.replace(/\./g, '_')}.txt`);
  
  const scriptContent = `# WinSCP script for deployment
# Generated automatically for ${target.name}
option batch abort
option confirm off
open ftp://${target.ftpUser}:${target.ftpPass}@${target.ftpHost}${target.remotePath} -timeout=120 -rawsettings PassiveMode=1
# Simply sync all files from the dist directory directly
synchronize remote -delete -criteria=time "${DIST_DIR.replace(/\\/g, '/')}" "${target.remotePath}"
close
exit
`;
  
  await fs.writeFile(scriptPath, scriptContent);
  return scriptPath;
}

/**
 * Deploy using WinSCP
 * @param {object} target - The deployment target
 * @returns {Promise<boolean>} - Success status
 */
async function deployWithWinScp(target) {
  try {
    console.log('\nStarting deployment with WinSCP...');
    
    // Create WinSCP script
    const scriptPath = await createWinScpScript(target);
    
    console.log(`WinSCP script created at: ${scriptPath}`);
    console.log(`Connection string: ftp://${target.ftpUser}:******@${target.ftpHost}${target.remotePath}`);
    
    try {
      // Run WinSCP with the script
      console.log('Executing WinSCP with script...');
      execSync(`winscp.com /script="${scriptPath}"`, { 
        stdio: 'inherit'
      });
      
      console.log(`\n✅ Deployment to ${target.name} completed successfully!`);
      return true;
    } catch (execError) {
      console.error(`\n❌ WinSCP command failed: ${execError.message}`);
      throw execError;
    }
  } catch (error) {
    console.error('Error using WinSCP:', error.message);
    console.log('\nManual deployment instructions:');
    console.log(`1. Navigate to ${DIST_DIR}`);
    console.log(`2. Use WinSCP to upload all files to your server`);
    console.log(`3. Use this connection string: ftp://${target.ftpUser}:PASSWORD@${target.ftpHost}${target.remotePath}`);
    
    return false;
  }
}

/**
 * Create a manual deployment batch file
 * @param {object} target - The deployment target 
 * @returns {Promise<string>} - Path to the created batch file
 */
async function createManualDeploymentFile(target) {
  const batchPath = path.join(DEPLOY_SCRIPTS_DIR, `manual_deploy_${target.name.replace(/\./g, '_')}.bat`);
  
  const batchContent = `@echo off
echo ===================================================
echo Manual Deployment Script for ${target.name}
echo ===================================================
echo.
echo This script will help you deploy the files to your server.
echo.
echo 1. Open your FTP client (like FileZilla)
echo 2. Use these connection details:
echo    Host: ${target.ftpHost}
echo    Username: ${target.ftpUser}
echo    Password: (use the password from your .env file)
echo    Port: 21
echo.
echo 3. Local directory to upload: 
echo    ${DIST_DIR}
echo.
echo 4. Remote directory:
echo    ${target.remotePath}
echo.
echo ===================================================
echo.
pause
`;
  
  await fs.writeFile(batchPath, batchContent);
  return batchPath;
}

/**
 * Deploy to a specific target
 * @param {object} target - The deployment target
 */
async function deployToTarget(target) {
  console.log(`=== Deploying to ${target.name} ===`);
  
  // Check if dist directory exists
  if (!existsSync(DIST_DIR)) {
    console.error('Error: dist directory not found! Run build command first.');
    return false;
  }
  
  try {
    console.log(`Ready to deploy to ${target.name} via FTP.`);
    console.log(`Server: ${target.ftpHost}`);
    console.log(`Username: ${target.ftpUser}`);
    console.log(`Remote path: ${target.remotePath}`);
    console.log(`Source directory: ${DIST_DIR}`);
    
    // Ask for confirmation before FTP upload
    const proceedWithFtp = await askQuestion('\nDo you want to proceed with automatic FTP upload?');
    
    if (proceedWithFtp) {
      let success = false;
      
      try {
        success = await deployWithWinScp(target);
      } catch (error) {
        console.error(`\n❌ WinSCP deployment failed: ${error.message}`);
      }
      
      if (!success) {
        console.log('\nManual deployment instructions:');
        console.log(`1. Navigate to ${DIST_DIR}`);
        console.log(`2. Use your FTP client to upload all files to your server`);
        console.log(`3. Connection string: ftp://${target.ftpUser}:PASSWORD@${target.ftpHost}${target.remotePath}`);
      }
    } else {
      console.log('\nManual deployment instructions:');
      console.log(`1. Navigate to ${DIST_DIR}`);
      console.log(`2. Use your FTP client to upload all files to your server`);
      console.log(`3. Connection string: ftp://${target.ftpUser}:PASSWORD@${target.ftpHost}${target.remotePath}`);
    }
    
    return success;
  } catch (error) {
    console.error(`Deployment for ${target.name} failed:`, error.message);
    return false;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const targetName = args[1];
    
    // If specific target is provided, verify it exists
    let selectedTargets = [];
    if (targetName && targetName !== 'all') {
      const target = targets.find(t => t.name === targetName);
      if (!target) {
        console.error(`Error: Target "${targetName}" not found!`);
        console.log('Available targets:');
        targets.forEach(t => console.log(`  - ${t.name}`));
        process.exit(1);
      }
      selectedTargets = [target];
    } else {
      selectedTargets = targets;
    }
    
    // Execute the appropriate command
    switch (command) {
      case 'build':
        await cleanDirectories();
        await buildApp();
        break;
        
      case 'deploy':
        // Check if dist directory exists
        if (!existsSync(DIST_DIR)) {
          console.error('Error: dist directory not found! Run build command first.');
          process.exit(1);
        }
        
        // Ensure deploy-scripts directory exists and is clean
        if (existsSync(DEPLOY_SCRIPTS_DIR)) {
          await fs.rm(DEPLOY_SCRIPTS_DIR, { recursive: true, force: true });
        }
        mkdirSync(DEPLOY_SCRIPTS_DIR, { recursive: true });
        
        // Deploy to each selected target
        for (const target of selectedTargets) {
          await deployToTarget(target);
          
          // Create manual deployment file for reference
          const manualBatchPath = await createManualDeploymentFile(target);
          console.log(`Manual deployment batch file created: ${manualBatchPath}`);
        }
        break;
        
      case 'full':
        await cleanDirectories();
        const buildSuccess = await buildApp();
        
        if (buildSuccess) {
          // Deploy to each selected target
          for (const target of selectedTargets) {
            await deployToTarget(target);
            
            // Create manual deployment file for reference
            const manualBatchPath = await createManualDeploymentFile(target);
            console.log(`Manual deployment batch file created: ${manualBatchPath}`);
          }
        }
        break;
        
      case 'help':
      default:
        console.log(`
XBlog Deployment Script - Simplified Version

Usage:
  node deploy.js build                        # Build only
  node deploy.js deploy [target]              # Deploy to one or all targets
  node deploy.js full [target]                # Full build and deploy

Examples:
  node deploy.js deploy wa1x.thechief.com     # Deploy to wa1x.thechief.com
  node deploy.js full applefinch.thechief.com # Build and deploy to applefinch
  node deploy.js full                         # Build and deploy to all targets

Available targets:
${targets.map(t => `  - ${t.name}`).join('\n')}
        `);
        break;
    }
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  } finally {
    // Close the readline interface
    RL.close();
  }
}

// Run the script
main();