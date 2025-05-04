// deploy.js - Script for building and deploying XBlog React application
/**
 * XBlog Deployment Script - Windows Compatible Version
 * 
 * This script handles the complete build and deployment process for the XBlog application.
 * It can build the React application and deploy it to multiple targets via FTP.
 * 
 * Usage:
 *   node deploy.js build                        # Build only
 *   node deploy.js pre-build                    # Clean build directories only
 *   node deploy.js post-build                   # Run post-build tasks only
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
const SRC_DIR = path.resolve('./src');
const PUBLIC_DIR = path.resolve('./public');
const DEPLOY_TEMP_DIR = path.resolve('./deploy-temp');
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
  // Add more targets as needed
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
async function preBuild() {
  console.log('=== Running pre-build tasks ===');
  
  // Clean the dist directory if it exists
  if (existsSync(DIST_DIR)) {
    console.log('Cleaning dist directory...');
    try {
      // Using fs.rm with recursive option for Node.js
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
  
  // Clean the deploy-temp directory if it exists
  if (existsSync(DEPLOY_TEMP_DIR)) {
    console.log('Cleaning deploy-temp directory...');
    try {
      await fs.rm(DEPLOY_TEMP_DIR, { recursive: true, force: true });
    } catch (err) {
      // Fallback for older Node.js versions
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${DEPLOY_TEMP_DIR}"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${DEPLOY_TEMP_DIR}"`, { stdio: 'ignore' });
      }
    }
  }
  
  console.log('Build directories cleaned successfully!');
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
    
    console.log('Application built successfully!');
    return true;
  } catch (error) {
    console.error('Build failed:', error.message);
    return false;
  }
}

/**
 * Run post-build tasks
 */
async function postBuild() {
  console.log('=== Running post-build tasks ===');

  // Verify that the dist directory exists
  if (!existsSync(DIST_DIR)) {
    console.error('Error: Dist directory not found! Did the build fail?');
    return false;
  }

  try {
    // Copy all files from public folder to dist
    console.log('Copying public files to dist...');
    await copyDirectoryContents(PUBLIC_DIR, DIST_DIR);
    
    console.log('All public files copied to dist directory');
    return true;
  } catch (error) {
    console.error('Post-build tasks failed:', error.message);
    return false;
  }
}

/**
 * Copy all files from one directory to another
 * @param {string} sourceDir - Source directory
 * @param {string} targetDir - Target directory
 */
async function copyDirectoryContents(sourceDir, targetDir) {
  // Skip if source directory doesn't exist
  if (!existsSync(sourceDir)) {
    console.log(`Source directory ${sourceDir} does not exist, skipping copy.`);
    return;
  }
  
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
      await copyDirectoryContents(sourcePath, targetPath);
    } else {
      // Copy files
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Create a WinSCP script file for deployment
 * @param {object} target - The deployment target
 * @param {string} localDir - The local directory to deploy from
 * @param {string} tempFilesDir - Directory to store temporary files
 * @returns {Promise<string>} - Path to the created script file
 */
async function createWinScpScript(target, localDir, tempFilesDir) {
  // Create a WinSCP script file IN THE TEMP DIRECTORY (not in the deployment directory)
  const scriptPath = path.join(tempFilesDir, '_winscp_script.txt');
  
  // The connection string format that worked: ftp://username:password@host/public_html/
  // Create WinSCP script content with proper format
  const scriptContent = `# WinSCP script for deployment
# Generated automatically for ${target.name}
option batch abort
option confirm off
open ftp://${target.ftpUser}:${target.ftpPass}@${target.ftpHost}${target.remotePath} -timeout=120 -rawsettings PassiveMode=1
# Simply sync all files from the clean deployment directory
synchronize remote -delete -criteria=time "${localDir.replace(/\\/g, '/')}" "${target.remotePath}"
close
exit
`;
  
  // Write the script to a file IN THE TEMP DIRECTORY
  await fs.writeFile(scriptPath, scriptContent);
  
  return scriptPath;
}

/**
 * Deploy using WinSCP 
 * @param {object} target - The deployment target
 * @param {string} localDir - The local directory to deploy from
 * @param {string} tempFilesDir - Directory to store temporary files
 * @returns {Promise<boolean>} - Success status
 */
async function deployWithWinScp(target, localDir, tempFilesDir) {
  try {
    console.log('\nStarting deployment with WinSCP...');
    
    // Create WinSCP script IN THE TEMP DIRECTORY
    const scriptPath = await createWinScpScript(target, localDir, tempFilesDir);
    
    console.log(`WinSCP script created at: ${scriptPath}`);
    console.log(`Connection string: ftp://${target.ftpUser}:******@${target.ftpHost}${target.remotePath}`);
    
    try {
      // Run WinSCP with the script
      console.log('Executing WinSCP with script...');
      execSync(`winscp.com /script="${scriptPath}"`, { 
        stdio: 'inherit'
      });
      
      console.log(`\n✅ Deployment to ${target.name} completed successfully!`);
      
      // No need to clean up individual files as we'll clean up the entire temp directory later
      
      return true;
    } catch (execError) {
      console.error(`\n❌ WinSCP command failed: ${execError.message}`);
      throw execError;
    }
  } catch (error) {
    console.error('Error using WinSCP:', error.message);
    console.log('\nManual deployment instructions:');
    console.log(`1. Navigate to ${localDir}`);
    console.log(`2. Use WinSCP to upload all files to your server`);
    console.log(`3. Use this connection string: ftp://${target.ftpUser}:PASSWORD@${target.ftpHost}${target.remotePath}`);
    
    return false;
  }
}

/**
 * Deploy to a specific target
 * @param {object} target - The deployment target
 */
async function deployToTarget(target) {
  console.log(`=== Deploying to ${target.name} ===`);
  
  // Create deploy-temp directory for this target
  const targetDir = path.join(DEPLOY_TEMP_DIR, target.name);
  
  // Create a separate directory for temporary deployment files
  const tempFilesDir = path.join(DEPLOY_TEMP_DIR, `_temp_${target.name}`);
  
  try {
    // Create target directory
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    
    // Create temporary files directory
    if (!existsSync(tempFilesDir)) {
      mkdirSync(tempFilesDir, { recursive: true });
    }
    
    // Copy build files to deployment directory
    console.log('Copying build files to deployment directory...');
    await copyDirectoryContents(DIST_DIR, targetDir);
    
    console.log(`Ready to deploy to ${target.name} via FTP.`);
    console.log(`Server: ${target.ftpHost}`);
    console.log(`Username: ${target.ftpUser}`);
    console.log(`Remote path: ${target.remotePath}`);
    
    // Ask for confirmation before FTP upload
    const proceedWithFtp = await askQuestion('\nDo you want to proceed with automatic FTP upload?');
    
    if (proceedWithFtp) {
      // Try with WinSCP
      let success = false;
      
      try {
        success = await deployWithWinScp(target, targetDir, tempFilesDir);
      } catch (error) {
        console.error(`\n❌ WinSCP deployment failed: ${error.message}`);
      }
      
      if (!success) {
        console.log('\nManual deployment instructions:');
        console.log(`1. Navigate to ${targetDir}`);
        console.log(`2. Use your FTP client to upload all files to your server`);
        console.log(`3. Connection string: ftp://${target.ftpUser}:PASSWORD@${target.ftpHost}${target.remotePath}`);
      }
    } else {
      console.log('\nManual deployment instructions:');
      console.log(`1. Navigate to ${targetDir}`);
      console.log(`2. Use your FTP client to upload all files to your server`);
      console.log(`3. Connection string: ftp://${target.ftpUser}:PASSWORD@${target.ftpHost}${target.remotePath}`);
    }
  } catch (error) {
    console.error(`Deployment preparation for ${target.name} failed:`, error.message);
  } finally {
    // Clean up the temporary files directory
    if (existsSync(tempFilesDir)) {
      try {
        await fs.rm(tempFilesDir, { recursive: true, force: true });
      } catch (err) {
        console.log(`Warning: Could not clean up temporary files directory: ${err.message}`);
      }
    }
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
      case 'pre-build':
        await preBuild();
        break;
        
      case 'build':
        await preBuild();
        const buildSuccess = await buildApp();
        if (buildSuccess) {
          await postBuild();
        }
        break;
        
      case 'post-build':
        await postBuild();
        break;
        
      case 'deploy':
        // Check if dist directory exists
        if (!existsSync(DIST_DIR)) {
          console.error('Error: dist directory not found! Run build command first.');
          process.exit(1);
        }
        
        for (const target of selectedTargets) {
          await deployToTarget(target);
        }
        break;
        
      case 'full':
        await preBuild();
        const fullBuildSuccess = await buildApp();
        if (fullBuildSuccess) {
          await postBuild();
          
          for (const target of selectedTargets) {
            await deployToTarget(target);
          }
        }
        break;
        
      case 'help':
      default:
        console.log(`
XBlog Deployment Script

Usage:
  node deploy.js build                        # Build only
  node deploy.js pre-build                    # Clean build directories only
  node deploy.js post-build                   # Run post-build tasks only
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