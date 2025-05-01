/**
 * Enhanced deployment script for React application
 * - Pre-build: Cleans the dist directory if it exists
 * - Post-build: Copies .htaccess and fixes asset paths
 */
import { copyFileSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';

// Configuration
const distDir = './dist';
const publicDir = './public';

// Determine if we're in pre-build or post-build mode
const mode = process.argv[2] || 'post-build';

if (mode === 'pre-build') {
  preBuild();
} else {
  postBuild();
}

// Pre-build tasks
function preBuild() {
  console.log('=== Running pre-build tasks ===');
  
  // Clean the dist directory if it exists
  if (existsSync(distDir)) {
    console.log('Cleaning dist directory...');
    try {
      // Read all contents of the directory
      const files = readdirSync(distDir);
      
      // Remove each file/directory
      for (const file of files) {
        const filePath = join(distDir, file);
        rmSync(filePath, { recursive: true, force: true });
      }
      console.log('Dist directory cleaned successfully.');
    } catch (error) {
      console.error('Error cleaning dist directory:', error);
    }
  } else {
    console.log('Dist directory doesn\'t exist yet, no cleaning needed.');
  }

  // Ensure public directory exists
  if (!existsSync(publicDir)) {
    console.log('Creating public directory...');
    mkdirSync(publicDir);
  }
  
  console.log('Pre-build tasks completed successfully.');
}

// Post-build tasks
function postBuild() {
  console.log('=== Running post-build tasks ===');

  // Verify that the dist directory exists (it should after build)
  if (!existsSync(distDir)) {
    console.error('Error: Dist directory not found! Make sure the build process completed successfully.');
    process.exit(1);
  }

  // Copy or create .htaccess file
  const htaccessSource = join(publicDir, '.htaccess');
  const htaccessDest = join(distDir, '.htaccess');

  if (existsSync(htaccessSource)) {
    console.log('Copying .htaccess file to dist directory...');
    copyFileSync(htaccessSource, htaccessDest);
  } else {
    console.log('Creating .htaccess file in dist directory...');
    const htaccess = `# Enable rewriting
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /client/
  
  # Don't rewrite if the request is for an existing file or directory
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Don't rewrite for certain file types
  RewriteCond %{REQUEST_URI} !\.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ [NC]
  
  # For all other URLs, rewrite to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Cache control for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  
  # CSS, JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # Fonts
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType application/font-woff "access plus 1 year"
  ExpiresByType application/font-woff2 "access plus 1 year"
</IfModule>

# Add proper security headers
<IfModule mod_headers.c>
  # Disable content sniffing
  Header set X-Content-Type-Options "nosniff"
  
  # Enable XSS protection
  Header set X-XSS-Protection "1; mode=block"
  
  # Prevent clickjacking
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>`;
    writeFileSync(htaccessDest, htaccess);
  }

  // Check index.html
  console.log('Verifying index.html paths...');
  const indexPath = join(distDir, 'index.html');

  if (existsSync(indexPath)) {
    let indexContent = readFileSync(indexPath, 'utf8');
    let wasFixed = false;
    
    // Check if paths start with / and fix them
    if (indexContent.includes('src="/assets/') || 
        indexContent.includes('href="/assets/')) {
      console.log('Fixing asset paths in index.html to use relative paths...');
      indexContent = indexContent.replace(/src="\/assets\//g, 'src="./assets/');
      indexContent = indexContent.replace(/href="\/assets\//g, 'href="./assets/');
      wasFixed = true;
    }
    
    // Check for any other absolute path references
    if (indexContent.includes('src="/') || indexContent.includes('href="/')) {
      console.log('Fixing other absolute paths in index.html...');
      indexContent = indexContent.replace(/src="\//g, 'src="./');
      indexContent = indexContent.replace(/href="\//g, 'href="./');
      wasFixed = true;
    }
    
    // Save changes if any were made
    if (wasFixed) {
      writeFileSync(indexPath, indexContent);
      console.log('Fixed index.html asset paths.');
    } else {
      console.log('index.html already has correct asset paths.');
    }
  } else {
    console.error('Error: index.html not found in the dist directory!');
    process.exit(1);
  }

  // Copy favicon if it exists
  const faviconSource = join(publicDir, 'vite.svg');
  const faviconDest = join(distDir, 'vite.svg');

  if (existsSync(faviconSource)) {
    console.log('Copying favicon to dist directory...');
    copyFileSync(faviconSource, faviconDest);
  }

  console.log('Post-build tasks completed successfully!');
  console.log('Deployment preparation complete! Files are ready to be deployed to the server.');
  console.log('Remember to upload all contents of the dist directory to your /client/ folder on the server.');
}