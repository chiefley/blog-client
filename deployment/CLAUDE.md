# Deployment Strategy

## Overview
Multi-target deployment system for React app to WordPress subdirectories using Unix FTP tools (lftp).

## Deploy Script Architecture
The `deploy-unix.js` script handles:
- **Clean**: Remove dist directory
- **Build**: Vite production build with relative paths
- **Post-build**: Copy .htaccess from public directory
- **Deploy**: FTP upload to target sites using lftp

## Prerequisites
- Unix/Linux environment (or WSL on Windows)
- lftp installed:
  ```bash
  # Ubuntu/Debian/WSL
  sudo apt-get install lftp
  
  # macOS
  brew install lftp
  ```

## Environment Configuration
```bash
# .env file structure
FTP_HOST=your-ftp-host.com

# WA1X site credentials
FTP_USER_WA1X=u598898806.wa1x.thechief.com
FTP_PASS_WA1X=your-password
FTP_WA1X_PATH=/public_html

# AppleFinch site credentials
FTP_USER_APPLEFINCH=u598898806.applefinch.thechief.com
FTP_PASS_APPLEFINCH=your-password
FTP_APPLEFINCH_PATH=/public_html
```

## Deployment Commands
```bash
# Clean dist directory
npm run clean

# Build only (includes clean)
npm run build

# Deploy to specific site
npm run deploy:wa1x
npm run deploy:applefinch

# Deploy to all sites
npm run deploy:all
npm run deploy

# Build + Deploy combined
npm run full:wa1x
npm run full:applefinch
npm run full
```

## Subdirectory Configuration

### Vite Config
```javascript
base: './'  // Relative paths for subdirectory deployment
```

### .htaccess (Critical for SPA routing)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /react-app/
  
  # Skip existing files/directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Skip static assets
  RewriteCond %{REQUEST_URI} !\.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ [NC]
  
  # Route everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Cache control for assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
```

## Build Optimization
```javascript
// vite.config.ts optimizations
build: {
  target: 'es2015',
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,      // Remove console.log in production
      drop_debugger: true,
    },
  },
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-mui': ['@mui/material', '@mui/system'],
        'vendor-mui-icons': ['@mui/icons-material'],
        'vendor-utils': ['date-fns', 'html-react-parser'],
      },
    },
  },
}
```

## Deployment Process Flow
1. **Clean**: Remove old dist files
2. **Build**: TypeScript compile + Vite bundle
3. **Post-process**: Copy .htaccess from public directory
4. **Connect**: Establish FTP connection using lftp
5. **Upload**: Mirror dist/* to remote path with lftp
6. **Verify**: Check deployment success

## lftp Deployment Details
The script uses lftp with the following settings:
- SSL verification disabled (for compatibility with some hosts)
- Mirror mode: uploads only changed files
- Excludes .map files to reduce upload size
- Verbose output for debugging
- Parallel transfers for faster deployment

## Troubleshooting

### 404 Errors on Routes
- Verify .htaccess uploaded correctly
- Check RewriteBase matches deployment path
- Ensure mod_rewrite enabled on server

### Missing Assets
- Check browser network tab for paths
- Verify all files uploaded to correct location
- Ensure base: './' in vite.config.ts

### FTP Issues
- Verify credentials in .env
- Check FTP paths are absolute
- Ensure FTP user has write permissions

### Build Failures
- Clear node_modules and reinstall
- Check for TypeScript errors
- Verify all imports are correct

## Multi-Site Deployment
Each WordPress multisite blog gets its own deployment:
- **wa1x.thechief.com**: Ham radio blog
- **applefinch.thechief.com**: Science blog

Deployments are independent - can update one without affecting others.

## Security Notes
- Never commit .env files
- Use secure FTP (SFTP/FTPS) when possible
- Regularly rotate FTP passwords
- Monitor server logs for unauthorized access