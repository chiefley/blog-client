# Deployment Strategy

## Overview
Multi-target deployment system for React app to WordPress subdirectories with automated FTP uploads.

## Deploy Script Architecture
The `deploy.js` script handles:
- **Pre-build**: Clean dist directory
- **Build**: Vite production build with relative paths
- **Post-build**: Copy .htaccess, fix paths
- **Deploy**: FTP upload to target sites

## Environment Configuration
```bash
# .env file structure
FTP_HOST=your-ftp-host.com
FTP_USER=your-username
FTP_PASSWORD=your-password
FTP_WA1X_PATH=/public_html/react-app
FTP_APPLEFINCH_PATH=/public_html/react-app
```

## Deployment Commands
```bash
# Build only
npm run build

# Deploy to specific site
npm run deploy:wa1x
npm run deploy:applefinch

# Deploy to all sites
npm run deploy:all

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
3. **Post-process**: Copy .htaccess, ensure relative paths
4. **Connect**: Establish FTP connection
5. **Upload**: Transfer dist/* to remote path
6. **Verify**: Check deployment success

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