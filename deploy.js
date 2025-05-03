// Function to check if WinSCP is installed (Windows)
function isWinScpInstalled() {
  try {
    // Try both common executable names
    try {
      execSync('winscp.exe /version', { stdio: 'ignore' });
      return 'winscp.exe';
    } catch (e1) {
      try {
        execSync('winscp.com /version', { stdio: 'ignore' });
        return 'winscp.com';
      } catch (e2) {
        try {
          execSync('WinSCP.exe /version', { stdio: 'ignore' });
          return 'WinSCP.exe';
        } catch (e3) {
          return false;
        }
      }
    }
  } catch (error) {
    return false;
  }
}

// Function to create WinSCP script (Windows)
function createWinScpScript(targetConfig, deployDir) {
  const scriptPath = path.join(deployDir, 'winscp_script.txt');
  
  // Build script content using the imported settings from FileZilla
  // Format is slightly different to accommodate password special characters
  const scriptContent = `# Automatically generated WinSCP script
# Using FTPS with explicit TLS/SSL
open ftps://${encodeURIComponent(targetConfig.ftpUser)}:${encodeURIComponent(targetConfig.ftpPass)}@${targetConfig.ftpHost}:21 -explicit -timeout=120 -certificate=* -rawsettings TlsCertificateVerification=0
# Navigate to the correct remote directory
cd "${targetConfig.remotePath}"
# Set transfer options
option batch continue
option confirm off
option transfer binary
# Synchronize local to remote with deletion for removed files
synchronize remote -delete -criteria=size,time "${deployDir.replace(/\\/g, '/')}" "."
# Exit when done
exit`;

  writeFileSync(scriptPath, scriptContent);
  return scriptPath;
}// deploy.js - Deployment script for blog-client
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, copyFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Determine current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define directories
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const deployTempDir = path.join(__dirname, 'deploy-temp');

// Define deployment targets
const targets = [
  {
    name: 'wa1x.thechief.com',
    ftpHost: 'wa1x.thechief.com', // Adding ftp. prefix for standard FTP hostname
    ftpUser: process.env.FTP_USER_WA1X || 'YOUR_USERNAME',
    ftpPass: process.env.FTP_PASS_WA1X || 'YOUR_PASSWORD',
    remotePath: '/public_html/'
  },
  {
    name: 'applefinch.thechief.com',
    ftpHost: 'applefinch.thechief.com', // Adding ftp. prefix for standard FTP hostname
    ftpUser: process.env.FTP_USER_APPLEFINCH || 'YOUR_USERNAME',
    ftpPass: process.env.FTP_PASS_APPLEFINCH || 'YOUR_PASSWORD',
    remotePath: '/public_html/'
  }
];

// Create readline interface for user input
const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt for user input
const prompt = (question) => {
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Helper to copy directory recursively
function copyDirRecursive(source, target) {
  // Create target directory if it doesn't exist
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  // Get all files and directories in source
  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      // Recursive call for directories
      copyDirRecursive(sourcePath, targetPath);
    } else {
      // Copy file
      copyFileSync(sourcePath, targetPath);
    }
  }
}

// Function to create batch file (Windows)
function createWindowsBatchScript(targetConfig, deployDir) {
  const batchPath = path.join(deployDir, 'deploy.bat');
  const batchContent = `@echo off
echo === Manual deployment to ${targetConfig.name} ===
echo.
echo You need to upload all files in this directory to:
echo Server: ${targetConfig.ftpHost}
echo Username: ${targetConfig.ftpUser}
echo Remote path: ${targetConfig.remotePath}
echo.
echo You can use any FTP client like FileZilla to do this.
echo.
pause`;

  writeFileSync(batchPath, batchContent);
  console.log(`Created Windows deployment script: deploy.bat`);
  return batchPath;
}

// Function to create shell script (Unix)
function createShellScript(targetConfig, deployDir) {
  const shellPath = path.join(deployDir, 'deploy.sh');
  const shellContent = `#!/bin/bash
echo "=== Manual deployment to ${targetConfig.name} ==="
echo
echo "You need to upload all files in this directory to:"
echo "Server: ${targetConfig.ftpHost}"
echo "Username: ${targetConfig.ftpUser}"
echo "Remote path: ${targetConfig.remotePath}"
echo
echo "You can use any FTP client like FileZilla to do this."
echo
read -p "Press Enter to continue..."`;

  writeFileSync(shellPath, shellContent, { mode: 0o755 });
  console.log(`Created Unix deployment script: deploy.sh`);
  return shellPath;
}

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
}

// Post-build tasks
function postBuild() {
  console.log('=== Running post-build tasks ===');

  // Verify that the dist directory exists
  if (!existsSync(distDir)) {
    console.error('Error: Dist directory not found!');
    process.exit(1);
  }

  // Copy all files from public directory to dist
  console.log('Copying public files to dist directory...');
  
  if (existsSync(publicDir)) {
    const entries = readdirSync(publicDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(publicDir, entry.name);
      const targetPath = path.join(distDir, entry.name);
      
      if (entry.isDirectory()) {
        copyDirRecursive(sourcePath, targetPath);
      } else {
        copyFileSync(sourcePath, targetPath);
      }
    }
    
    console.log('All public files copied to dist directory');
  } else {
    console.log('Public directory not found, skipping copy operation');
  }
}

// Deploy to target using Node.js FTP
async function deployToTarget(targetName) {
  // If targetName is "all", deploy to all targets
  if (targetName === 'all') {
    for (const target of targets) {
      await deployToTarget(target.name);
    }
    return;
  }

  // Find the target configuration
  const targetConfig = targets.find(t => t.name === targetName);
  if (!targetConfig) {
    console.error(`Error: Target "${targetName}" not found!`);
    process.exit(1);
  }

  console.log(`=== Deploying to ${targetName} ===`);

  // Verify that the dist directory exists
  if (!existsSync(distDir)) {
    console.error('Error: Dist directory not found! Run build first.');
    process.exit(1);
  }

  // Create target-specific deployment directory
  const deployDir = path.join(deployTempDir, targetName);
  if (existsSync(deployDir)) {
    rmSync(deployDir, { recursive: true, force: true });
  }
  
  // Copy build files to deployment directory
  console.log('Copying build files to deployment directory...');
  copyDirRecursive(distDir, deployDir);

  // Create deployment scripts
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    createWindowsBatchScript(targetConfig, deployDir);
  } else {
    createShellScript(targetConfig, deployDir);
  }

  // Print deployment info
  console.log(`Ready to deploy to ${targetName} via FTP.`);
  console.log(`Server: ${targetConfig.ftpHost}`);
  console.log(`Username: ${targetConfig.ftpUser}`);
  console.log(`Remote path: ${targetConfig.remotePath}`);

  // Print environment variable debug info
  console.log('\nEnvironment variable check:');
  console.log(`FTP_USER_WA1X defined: ${process.env.FTP_USER_WA1X ? 'Yes' : 'No'}`);
  console.log(`FTP_PASS_WA1X defined: ${process.env.FTP_PASS_WA1X ? 'Yes' : 'No'}`);
  console.log(`FTP_USER_APPLEFINCH defined: ${process.env.FTP_USER_APPLEFINCH ? 'Yes' : 'No'}`);
  console.log(`FTP_PASS_APPLEFINCH defined: ${process.env.FTP_PASS_APPLEFINCH ? 'Yes' : 'No'}`);

  // Ask user if they want to proceed with automatic upload
  const answer = await prompt('Do you want to proceed with automatic FTP upload? (y/n): ');
  
  if (answer.toLowerCase() === 'y') {
    console.log('Starting FTP upload via Node.js...');
    
    try {
      // Check if we're on Windows and use WinSCP directly (since we know it's installed)
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        console.log('Using WinSCP for deployment on Windows...');
        
        // Create WinSCP script file
        const scriptPath = createWinScpScript(targetConfig, deployDir);
        console.log(`WinSCP script created at: ${scriptPath}`);
        
        try {
          // Try different WinSCP executable names
          const winscpExecutables = ['winscp.exe', 'winscp.com', 'WinSCP.exe'];
          let winscpExec = null;
          
          // Try to find which executable works
          for (const exe of winscpExecutables) {
            try {
              console.log(`Trying WinSCP executable: ${exe}`);
              execSync(`${exe} /version`, { stdio: 'pipe' });
              winscpExec = exe;
              console.log(`Found working WinSCP executable: ${winscpExec}`);
              break;
            } catch (e) {
              console.log(`Executable ${exe} not found or not working`);
            }
          }
          
          if (!winscpExec) {
            throw new Error('No working WinSCP executable found');
          }
          
          // Execute WinSCP with the script
          console.log('Starting WinSCP transfer...');
          console.log(`Running command: ${winscpExec} /script="${scriptPath}"`);
          
          execSync(`${winscpExec} /script="${scriptPath}"`, { 
            stdio: 'inherit',
            timeout: 300000 // 5 minute timeout
          });
          console.log('WinSCP transfer completed successfully!');
          return; // Exit the upload function after successful WinSCP operation
        } catch (winscpError) {
          console.error('WinSCP transfer failed:', winscpError.message);
          console.log('Trying alternative FTP method...');
        }
      }
      
      // Import basic-ftp dynamically to avoid requiring it for build-only operations
      const { Client } = await import('basic-ftp');
      const client = new Client();
      client.ftp.verbose = true; // Enable verbose logging
      
      try {
        console.log(`Connecting to FTP server: ${targetConfig.ftpHost}`);
        
        // Use explicit FTPS (FTP with TLS) like FileZilla does
        await client.access({
          host: targetConfig.ftpHost,
          user: targetConfig.ftpUser,
          password: targetConfig.ftpPass,
          secure: true, // Use FTPS (FTP with TLS)
          secureOptions: {
            rejectUnauthorized: false // Accept self-signed certificates
          },
          port: 21
        });
        
        console.log(`Connected to FTP server. Changing to directory: ${targetConfig.remotePath}`);
        await client.ensureDir(targetConfig.remotePath);
        
        console.log('Starting upload of files...');
        // Use the transfer mode that worked for the connection
        // (passive or active, depending on which connection attempt succeeded)
        await client.uploadFromDir(deployDir);
        
        console.log('FTP upload completed successfully!');
      } catch (ftpError) {
        console.error('FTP Error:', ftpError.message);
        console.error('Please check your FTP credentials and server settings.');
        
        // Log details about the connection attempt
        console.log('\nConnection details used:');
        console.log(`- Host: ${targetConfig.ftpHost}`);
        console.log(`- Username: ${targetConfig.ftpUser}`);
        console.log('- Password: [hidden]');
        console.log(`- Remote directory: ${targetConfig.remotePath}`);
        console.log('- Security: FTPS (Explicit TLS/SSL)');
        
        console.log('\nTroubleshooting tips:');
        console.log('1. Double-check that the .env file is in the project root directory');
        console.log('2. Verify credentials match exactly what works in FileZilla');
        console.log('3. Make sure you\'re using FTPS (Explicit TLS/SSL) in FileZilla');
        console.log('4. Try modifying deploy.js to use a different TLS/SSL configuration');
      } finally {
        client.close();
      }
    } catch (importError) {
      console.error('Error importing basic-ftp module:', importError.message);
      console.log('Please install the basic-ftp package with:');
      console.log('npm install basic-ftp');
    }
  } else {
    console.log('Automatic FTP upload skipped. To deploy manually:');
    console.log(`1. Open the deploy-temp/${targetName} directory`);
    console.log('2. Use an FTP client like FileZilla to upload all files to your server');
  }
}

// Build the app
async function buildApp() {
  console.log('=== Building application ===');
  
  try {
    // Run TypeScript compiler
    console.log('Running TypeScript compiler...');
    execSync('tsc -b', { stdio: 'inherit' });
    
    // Run Vite build
    console.log('Running Vite build...');
    execSync('vite build --mode=production', { stdio: 'inherit' });
    
    console.log('Build completed successfully!');
    return true;
  } catch (error) {
    console.error('Build failed:', error.message);
    return false;
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'build';
  const targetName = process.argv[3] || targets[0].name;
  
  try {
    switch (command) {
      case 'pre-build':
        preBuild();
        break;
        
      case 'build':
        preBuild();
        const buildSuccess = await buildApp();
        if (buildSuccess) {
          postBuild();
        }
        break;
        
      case 'deploy':
        await deployToTarget(targetName);
        break;
        
      case 'full':
        preBuild();
        const fullBuildSuccess = await buildApp();
        if (fullBuildSuccess) {
          postBuild();
          await deployToTarget(targetName);
        }
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: pre-build, build, deploy, full');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Close readline interface
    readline.close();
  }
}

// Run the main function
main();