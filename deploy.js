// deploy.js - Cross-platform deployment script for XBlog
// Supports both Windows and Unix environments

import { existsSync, mkdirSync, rmSync, copyFileSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve, basename, dirname } from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// Load environment variables from .env file if it exists
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (err) {
  console.log('dotenv module not found. Environment variables will not be loaded from .env file.');
}

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const distDir = join(__dirname, 'dist');
const deployTempDir = join(__dirname, 'deploy-temp');
const publicDir = join(__dirname, 'public');

// Deployment targets configuration
const targets = [
  {
    name: 'wa1x.thechief.com',
    ftpHost: 'wa1x.thechief.com',
    ftpUser: process.env.FTP_USER_WA1X || 'YOUR_USERNAME',
    ftpPass: process.env.FTP_PASS_WA1X || 'YOUR_PASSWORD',
    remotePath: '/public_html/'
  },
  {
    name: 'applefinch.thechief.com',
    ftpHost: 'applefinch.thechief.com',
    ftpUser: process.env.FTP_USER_APPLEFINCH || 'YOUR_USERNAME',
    ftpPass: process.env.FTP_PASS_APPLEFINCH || 'YOUR_PASSWORD',
    remotePath: '/public_html/'
  }
];

// Utility function to create readline interface for user prompts
function createPrompt() {
  return createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Utility function to ask yes/no questions
async function askYesNo(question) {
  const rl = createPrompt();
  
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Utility function to copy directory recursively
function copyDir(srcDir, destDir) {
  // Make sure destination directory exists
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  // Read all files/directories in source
  const entries = readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    // Handle directories recursively
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } 
    // Copy files
    else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Check if we're running on Windows
const isWindows = process.platform === 'win32';

// Pre-build tasks
function preBuild() {
  console.log('=== Running pre-build tasks ===');
  
  // Clean the dist directory if it exists
  if (existsSync(distDir)) {
    console.log('Cleaning dist directory...');
    rmSync(distDir, { recursive: true, force: true });
  }
  
  // Clean the deploy-temp directory if it exists
  if (existsSync(deployTempDir)) {
    console.log('Cleaning deploy-temp directory...');
    rmSync(deployTempDir, { recursive: true, force: true });
  }
  
  console.log('Pre-build tasks completed successfully');
}

// Build the app
function buildApp() {
  console.log('=== Building the application ===');
  
  try {
    console.log('Running TypeScript build...');
    execSync('tsc -b', { stdio: 'inherit' });
    
    console.log('Running Vite build...');
    execSync('vite build --mode=production --base=./', { stdio: 'inherit' });
    
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

// Post-build tasks
function postBuild() {
  console.log('=== Running post-build tasks ===');

  // Verify that the dist directory exists
  if (!existsSync(distDir)) {
    console.error('Error: Dist directory not found!');
    process.exit(1);
  }

  // Copy public directory contents to dist
  console.log('Copying public files to dist directory...');
  
  // Make sure public directory exists
  if (!existsSync(publicDir)) {
    console.log('Public directory not found, creating it...');
    mkdirSync(publicDir, { recursive: true });
  }
  
  // Copy all files from public to dist
  const publicFiles = readdirSync(publicDir, { withFileTypes: true });
  for (const file of publicFiles) {
    const srcPath = join(publicDir, file.name);
    const destPath = join(distDir, file.name);
    
    if (file.isDirectory()) {
      console.log(`Copying directory: ${file.name}`);
      copyDir(srcPath, destPath);
    } else {
      console.log(`Copying file: ${file.name}`);
      copyFileSync(srcPath, destPath);
    }
  }
  
  console.log('All public files copied to dist directory');
}

// Deploy to a specific target
async function deployToTarget(targetName) {
  // Find the target configuration
  const target = targets.find(t => t.name === targetName);
  
  if (!target) {
    console.error(`Error: Target "${targetName}" not found`);
    return false;
  }
  
  console.log(`=== Deploying to ${targetName} ===`);
  
  // Make sure dist directory exists
  if (!existsSync(distDir)) {
    console.error('Error: dist directory not found. Run the build process first.');
    return false;
  }
  
  try {
    // Create deployment directory structure
    const deployDir = join(deployTempDir, targetName);
    console.log('Copying build files to deployment directory...');
    
    // Remove existing deploy directory if it exists
    if (existsSync(deployDir)) {
      rmSync(deployDir, { recursive: true, force: true });
    }
    
    // Create new deploy directory
    mkdirSync(deployDir, { recursive: true });
    
    // Copy dist contents to deploy directory
    copyDir(distDir, deployDir);
    
    // Create deployment script based on platform
    if (isWindows) {
      // Create a Windows batch file for deployment
      const deployBat = join(deployDir, 'deploy.bat');
      const ftpCommands = [
        'open ftp://${target.ftpUser}:${target.ftpPass}@${target.ftpHost}',
        'lcd "%~dp0"',
        'cd ${target.remotePath}',
        'mirror --reverse --delete --verbose',
        'bye'
      ].join('\\n');
      
      const batchContent = `@echo off
echo Deploying files to ${targetName}...
echo.
echo This script requires WinSCP to be installed and in your PATH
echo If you don't have WinSCP, you can download it from: https://winscp.net/
echo.
echo Creating temporary script...
echo ${ftpCommands.replace(/\$/g, '%%')} > temp_script.txt
winscp.com /script=temp_script.txt
del temp_script.txt
echo.
echo Deployment complete! Press any key to exit.
pause > nul
`;
      
      writeFileSync(deployBat, batchContent);
      console.log('Created Windows deployment script: deploy.bat');
    } else {
      // Create a Unix shell script for deployment
      const deployScript = join(deployDir, 'deploy.sh');
      const ftpCommands = [
        'open ftp://${target.ftpUser}:${target.ftpPass}@${target.ftpHost}',
        'lcd "$(dirname "$0")"',
        'cd ${target.remotePath}',
        'mirror --reverse --delete --verbose',
        'bye'
      ].join('\\n');
      
      const scriptContent = `#!/bin/bash
echo "Deploying files to ${targetName}..."
echo "Creating temporary script..."
echo "${ftpCommands}" > temp_script.txt
lftp -f temp_script.txt
rm temp_script.txt
echo "Deployment complete!"
`;
      
      writeFileSync(deployScript, scriptContent);
      
      // Make the script executable on Unix
      try {
        execSync(`chmod +x "${deployScript}"`);
      } catch (error) {
        console.log('Warning: Could not make script executable, but this is expected on Windows');
        // This is expected to fail on Windows, so we continue without error
      }
      
      console.log('Created Unix deployment script: deploy.sh');
    }
    
    // Show deployment info and ask for confirmation to use FTP
    console.log(`Ready to deploy to ${targetName} via FTP.`);
    console.log(`Server: ${target.ftpHost}`);
    console.log(`Username: ${target.ftpUser}`);
    console.log(`Remote path: ${target.remotePath}`);
    console.log('');
    
    const useAutoDeploy = await askYesNo('Do you want to proceed with automatic FTP upload?');
    
    if (useAutoDeploy) {
      // Check for required FTP tools
      const ftpToolAvailable = isWindows 
        ? checkCommandExists('winscp.com') 
        : checkCommandExists('lftp');
      
      if (!ftpToolAvailable) {
        if (isWindows) {
          console.log('WinSCP not found. Please install WinSCP and add it to your PATH.');
          console.log('Download WinSCP from: https://winscp.net/');
        } else {
          console.log('lftp not found. Please install lftp to use automatic deployment.');
          console.log('Install with: apt install lftp (Ubuntu) or brew install lftp (macOS)');
        }
        console.log(`\nAlternatively, you can use the manual deployment option:`);
        console.log(`1. Navigate to: ${deployDir}`);
        if (isWindows) {
          console.log('2. Run: deploy.bat');
        } else {
          console.log('2. Run: ./deploy.sh');
        }
        return false;
      }
      
      // Perform automatic upload
      console.log('Starting FTP upload...');
      
      try {
        if (isWindows) {
          // Create a temporary script for WinSCP
          const tempScriptPath = join(deployDir, 'temp_script.txt');
          const ftpCommands = [
            `open ftp://${target.ftpUser}:${target.ftpPass}@${target.ftpHost}`,
            `lcd "${deployDir.replace(/\\/g, '/')}"`,
            `cd ${target.remotePath}`,
            'mirror --reverse --delete --verbose',
            'bye'
          ].join('\n');
          
          writeFileSync(tempScriptPath, ftpCommands);
          
          // Execute WinSCP with script
          execSync(`winscp.com /script="${tempScriptPath}"`, { 
            stdio: process.env.FTP_VERBOSE ? 'inherit' : 'pipe' 
          });
          
          // Delete temporary script
          if (existsSync(tempScriptPath)) {
            rmSync(tempScriptPath);
          }
        } else {
          // Create a temporary script for lftp
          const tempScriptPath = join(deployDir, 'temp_script.txt');
          const ftpCommands = [
            `open ftp://${target.ftpUser}:${target.ftpPass}@${target.ftpHost}`,
            `lcd "${deployDir}"`,
            `cd ${target.remotePath}`,
            'mirror --reverse --delete --verbose',
            'bye'
          ].join('\n');
          
          writeFileSync(tempScriptPath, ftpCommands);
          
          // Execute lftp with script
          execSync(`lftp -f "${tempScriptPath}"`, { 
            stdio: process.env.FTP_VERBOSE ? 'inherit' : 'pipe' 
          });
          
          // Delete temporary script
          if (existsSync(tempScriptPath)) {
            rmSync(tempScriptPath);
          }
        }
        
        console.log('FTP upload completed successfully!');
        return true;
      } catch (error) {
        console.error('FTP upload failed:', error.message);
        return false;
      }
    } else {
      console.log(`To deploy manually, follow these steps:`);
      console.log(`1. Navigate to: ${deployDir}`);
      if (isWindows) {
        console.log('2. Run: deploy.bat');
      } else {
        console.log('2. Run: ./deploy.sh');
      }
      console.log('\nOr use your preferred FTP client to upload the contents of this directory.');
      return false;
    }
  } catch (error) {
    console.error(`Error deploying to ${targetName}:`, error);
    return false;
  }
}

// Helper function to check if a command exists
function checkCommandExists(command) {
  try {
    if (isWindows) {
      // On Windows, we use where command
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      // On Unix, we use which command
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Main function to parse arguments and run the appropriate actions
async function main() {
  const args = process.argv.slice(2);
  const action = args[0]?.toLowerCase();
  const target = args[1];
  
  if (!action) {
    console.log('Please specify an action: build, deploy, or full');
    process.exit(1);
  }
  
  switch (action) {
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
      if (target === 'all') {
        // Deploy to all targets
        for (const t of targets) {
          await deployToTarget(t.name);
        }
      } else if (target) {
        // Deploy to specific target
        await deployToTarget(target);
      } else {
        console.log('Please specify a target to deploy to: wa1x.thechief.com, applefinch.thechief.com, or all');
        console.log('Available targets:');
        targets.forEach(t => console.log(`- ${t.name}`));
      }
      break;
      
    case 'full':
      // Full build and deploy
      preBuild();
      buildApp();
      postBuild();
      
      if (target === 'all') {
        // Deploy to all targets
        for (const t of targets) {
          await deployToTarget(t.name);
        }
      } else if (target) {
        // Deploy to specific target
        await deployToTarget(target);
      } else {
        console.log('Please specify a target to deploy to: wa1x.thechief.com, applefinch.thechief.com, or all');
        console.log('Available targets:');
        targets.forEach(t => console.log(`- ${t.name}`));
      }
      break;
      
    default:
      console.log(`Unknown action: ${action}`);
      console.log('Available actions: pre-build, post-build, build, deploy, full');
  }
}

// Run the main function
main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});