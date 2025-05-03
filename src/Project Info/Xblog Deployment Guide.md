# XBlog Deployment Guide

This guide explains the complete process for building and deploying the XBlog React application to multiple Hostinger sites.

## Overview

The XBlog deployment system uses a custom Node.js script (`deploy.js`) to build the React application and deploy it to different Hostinger sites. The process is designed to be secure, flexible, and transparent.

## Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────┐
│  React App  │────>│  Build Step  │────>│  Deployment Step   │
│  (Source)   │     │  (dist/)     │     │  (deploy-temp/)    │
└─────────────┘     └──────────────┘     └────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────┐     ┌──────────────────────────────────┐
│ wa1x.thechief.com   │<────│        FTP Upload               │
└─────────────────────┘     │  (Automatic or Manual)          │
┌─────────────────────┐     │                                  │
│ applefinch.thechief.│<────│                                  │
└─────────────────────┘     └──────────────────────────────────┘
```

## Prerequisites

1. **Node.js** (v18+) installed on your local machine
2. **npm** (v8+) to manage dependencies
3. **FTP credentials** for each Hostinger site
4. **lftp** (optional, for automatic uploads)

## Setup Process

### 1. Initial Environment Setup

Create a `.env` file in the root of your project (this file should NOT be committed to Git):

```
# FTP credentials for wa1x.thechief.com
FTP_USER_WA1X=your_actual_username
FTP_PASS_WA1X=your_actual_password

# FTP credentials for applefinch.thechief.com
FTP_USER_APPLEFINCH=your_actual_username
FTP_PASS_APPLEFINCH=your_actual_password
```

### 2. Install Required Dependencies

```bash
# Install dotenv for loading environment variables
npm install dotenv
```

### 3. Public Folder Setup

Place any static files that should be copied as-is to the deployment in the `public` folder:

```
public/
├── .htaccess         # SPA routing configuration
├── robots.txt        # Search engine directives
├── sitemap.xml       # Site structure
├── favicon.ico       # Default favicon
└── ...               # Other static assets
```

The `.htaccess` file is particularly important as it enables SPA routing.

## Build Process

The build process packages your React application for deployment:

```bash
npm run build
```

This command:

1. **Cleans the `dist` directory** (removing any previous build)
2. **Compiles TypeScript** source files
3. **Builds the application** with Vite
4. **Copies all files from the `public` folder** to the `dist` directory

The result is a complete, production-ready application in the `dist` directory.

## Deployment Process

There are several ways to deploy the application:

### Option 1: Full Build and Deploy (Recommended)

```bash
# Build and deploy to wa1x.thechief.com
npm run full:wa1x

# Build and deploy to applefinch.thechief.com
npm run full:applefinch

# Build and deploy to all configured sites
npm run full
```

### Option 2: Build and Deploy Separately

```bash
# First build the application
npm run build

# Then deploy to a specific site
npm run deploy:wa1x
# or
npm run deploy:applefinch
```

### Interactive Deployment

When deploying, you'll be guided through an interactive process:

1. **File preparation**: The script copies the built files to a temporary directory
2. **Deployment options**: You'll be shown the deployment details and asked if you want to proceed
3. **Upload method**: You can choose automatic FTP upload or manual deployment

Example interaction:
```
=== Deploying to wa1x.thechief.com ===
Copying build files to deployment directory...
All public files copied to dist directory

Ready to deploy to wa1x.thechief.com via FTP.
Server: wa1x.thechief.com
Username: your_username
Remote path: /public_html/

Do you want to proceed with automatic FTP upload? (y/n): 
```

### Manual Deployment

If you choose not to use automatic FTP upload, you have two options:

1. **Use the generated deploy script**:
   ```bash
   cd deploy-temp/wa1x.thechief.com
   ./deploy.sh
   ```

2. **Use an FTP client** (like FileZilla):
   - Connect to your Hostinger site
   - Upload all files from the temporary directory to the remote server

## Security Considerations

This deployment approach prioritizes security:

1. **Credentials are kept local**: FTP credentials are stored only in your `.env` file
2. **No credentials in Git**: The repo contains only placeholder values, never actual credentials
3. **Interactive confirmation**: You must confirm before any FTP upload occurs

## Technical Details

### Directory Structure

- `src/`: Source code for the React application
- `public/`: Static files copied as-is to the build
- `dist/`: Built application (created during build)
- `deploy-temp/`: Temporary deployment files (created during deployment)

### Script Functions

The `deploy.js` script has several main functions:

1. **preBuild()**: Cleans previous build and temporary directories
2. **buildApp()**: Runs TypeScript and Vite to build the application
3. **postBuild()**: Copies public files to the dist directory
4. **deployToTarget()**: Prepares and executes deployment to a specific target
5. **main()**: Orchestrates the entire process based on command line arguments

### NPM Scripts

The `package.json` file contains several scripts for different deployment scenarios:

```json
{
  "scripts": {
    "build": "node deploy.js build",
    "deploy": "node deploy.js deploy",
    "deploy:wa1x": "node deploy.js deploy wa1x.thechief.com",
    "deploy:applefinch": "node deploy.js deploy applefinch.thechief.com",
    "full": "node deploy.js full",
    "full:wa1x": "node deploy.js full wa1x.thechief.com",
    "full:applefinch": "node deploy.js full applefinch.thechief.com"
  }
}
```

## Troubleshooting

### Common Issues

1. **"FTP upload failed"**:
   - Verify FTP credentials in your `.env` file
   - Check if the server is accessible
   - Try using a manual FTP client to connect

2. **"lftp is not installed"**:
   - Install lftp: `brew install lftp` (macOS) or `apt install lftp` (Ubuntu)
   - Or choose manual upload option

3. **"Missing files on the server"**:
   - Check if all files were copied to the `dist` directory
   - Verify that files in the `public` directory are properly organized

4. **"SPA routing doesn't work"**:
   - Verify that `.htaccess` was properly copied to the server
   - Check that the server supports .htaccess configurations

### Logs and Debugging

The deployment script outputs detailed logs. If you encounter issues:

1. Capture the entire console output
2. Check the temporary deployment directory for any issues
3. Try deploying with the verbose flag: `FTP_VERBOSE=true npm run deploy:wa1x`

## Adding New Deployment Targets

To add a new deployment target:

1. Edit the `deploy.js` file:
   ```javascript
   targets: [
     // Existing targets...
     {
       name: 'new-site.thechief.com',
       ftpHost: 'new-site.thechief.com',
       ftpUser: process.env.FTP_USER_NEW_SITE || 'YOUR_USERNAME',
       ftpPass: process.env.FTP_PASS_NEW_SITE || 'YOUR_PASSWORD',
       remotePath: '/public_html/'
     }
   ]
   ```

2. Add new environment variables to your `.env` file:
   ```
   FTP_USER_NEW_SITE=your_actual_username
   FTP_PASS_NEW_SITE=your_actual_password
   ```

3. Add new npm scripts to `package.json`:
   ```json
   {
     "scripts": {
       "deploy:new-site": "node deploy.js deploy new-site.thechief.com",
       "full:new-site": "node deploy.js full new-site.thechief.com"
     }
   }
   ```

## Development Workflow

For regular development:

1. **Work on your feature branches or main branch**
2. **Test locally** with `npm run dev`
3. **Build and test the production version** with `npm run build` and `npm run preview`
4. **Deploy to production** with `npm run full:target`

## Conclusion

This deployment system provides a secure, flexible way to deploy your React application to multiple Hostinger sites. By keeping credentials local and providing clear, interactive steps, it ensures that you have complete control over the deployment process.

For any issues or questions, refer to the troubleshooting section or check the deployment script itself for detailed comments.