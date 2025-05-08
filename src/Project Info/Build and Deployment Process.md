# XBlog Deployment Strategy

## Overview

This document outlines the deployment strategy used for the XBlog React application. The system is designed to facilitate deployment to multiple WordPress sites from a single codebase, with each deployment target potentially having different configuration requirements.

## Key Components

### Build Process

The build process uses Vite to compile the React application with specific environment-based configurations:

1. **Environment Configuration**: Different environment files (`.env.development`, `.env.production`) configure the application for different deployment environments.

2. **Base Path Configuration**: The application can be deployed to either the root of a domain or a subdirectory using the `VITE_BASE_PATH` environment variable.

3. **Optimization**: Production builds include bundling optimizations, code splitting, and asset fingerprinting.

### Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  React App  │────>│  Build Step  │────>│  Multiple Deployment │
│  (Source)   │     │  (dist/)     │     │      Targets         │
└─────────────┘     └──────────────┘     └──────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │ wa1x.thechief.com   │
                                          └─────────────────────┘
                                          ┌─────────────────────┐
                                          │ applefinch.thechief.│
                                          └─────────────────────┘
```

## Public Folder Strategy

A key aspect of the deployment process is the handling of the `public` folder:

- **All files in the `public` folder are copied directly to the `dist` folder** during the build process
- This includes important configuration files like:
  - `.htaccess` for server routing configuration
  - `robots.txt` for search engine directives
  - `favicon.ico` and other static assets

This approach ensures that essential server configuration files are properly included in each deployment.

## The .htaccess File

The `.htaccess` file plays a crucial role in making the SPA (Single Page Application) routing work correctly:

```apache
# Enable rewriting
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Use RewriteBase / for the root domain
  # No trailing slash is needed
  RewriteBase /
  
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
</IfModule>
```

This configuration ensures that all client-side routes properly redirect to `index.html`, allowing React Router to handle the routing.

## Multi-Target Deployment

The system supports deployment to multiple targets:

1. **Target-Specific Commands**:
   - `npm run deploy:wa1x` - Deploy to the wa1x.thechief.com site
   - `npm run deploy:applefinch` - Deploy to the applefinch.thechief.com site
   - `npm run deploy:all` - Deploy to all configured sites

2. **WinSCP Integration**:
   The deployment process leverages WinSCP for FTP file transfers:
   - Automatically uploads files from the `dist` directory to the respective remote server
   - Handles authentication using saved sessions or credentials
   - Ensures files are transferred securely and efficiently

3. **Package.json Scripts**:
   ```json
   {
     "scripts": {
       "build": "node deploy.js build",
       "clean": "node deploy.js pre-build",
       "deploy": "node deploy.js deploy",
       "deploy:wa1x": "node deploy.js deploy wa1x.thechief.com",
       "deploy:applefinch": "node deploy.js deploy applefinch.thechief.com",
       "deploy:all": "node deploy.js deploy all",
       "full": "node deploy.js full",
       "full:wa1x": "node deploy.js full wa1x.thechief.com",
       "full:applefinch": "node deploy.js full applefinch.thechief.com"
     }
   }
   ```

## Deployment Process

The deployment process follows these steps:

1. **Build Preparation**:
   - Clean any previous build artifacts
   - Set up the environment variables for the target environment

2. **Build Step**:
   - Compile TypeScript files
   - Bundle the application with Vite
   - Apply optimizations and generate chunks
   - Copy all public files to the dist directory

3. **Deployment**:
   - Connect to the target server via FTP using WinSCP
   - Upload the contents of the `dist` directory to the specified remote path
   - Handle any server-specific post-deployment tasks

## Vite Configuration for Deployment

The `vite.config.ts` file is configured to optimize the build process for deployment:

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Using Babel for Fast Refresh
// Import visualizer only when needed (commented out to avoid unused import error)
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
   // Load env file based on mode (development or production)
   const env = loadEnv(mode, process.cwd());

   // Get the base path from environment variables
   const basePath = env.VITE_BASE_PATH || '/';
   console.log(`Building with base path: ${basePath} (mode: ${mode})`);

   return {
      plugins: [
         react({
            // Babel configuration options
            babel: {
               plugins: [
                  // Add any Babel plugins you need here
               ],
               // Don't transpile dynamic imports to get proper code splitting
               babelrc: false,
               configFile: false
            },
         }),
         // Uncomment this for bundle analysis (creates stats.html)
         // visualizer({ open: true, gzipSize: true }),
      ],
      // Apply the base path configuration
      base: basePath,
      build: {
         target: 'es2015',
         minify: 'terser',
         terserOptions: {
            compress: {
               // Remove console.log in production
               drop_console: mode === 'production',
               drop_debugger: mode === 'production',
            },
         },
         rollupOptions: {
            output: {
               // Ensure asset filenames include the base directory
               assetFileNames: 'assets/[name]-[hash].[ext]',
               chunkFileNames: 'assets/[name]-[hash].js',
               entryFileNames: 'assets/[name]-[hash].js',
               manualChunks: {
                  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                  'vendor-mui': ['@mui/material', '@mui/system'],
                  'vendor-mui-icons': ['@mui/icons-material'],
                  'vendor-utils': ['date-fns', 'html-react-parser'],
               },
            },
         },
         // Increase the warning limit to avoid noise
         chunkSizeWarningLimit: 1000,
         // Generate source maps for debugging in production
         sourcemap: mode !== 'production',
      },
      server: {
         hmr: true,
         port: 3000,
         open: true,
         // Add CORS settings if needed for API access during development
         cors: true,
      },
      // Improve TypeScript integration
      optimizeDeps: {
         // Force includes for better optimization
         include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@mui/icons-material',
            'date-fns'
         ]
      },
      // Improved error handling
      esbuild: {
         logOverride: { 'this-is-undefined-in-esm': 'silent' }
      }
   };
});
```

## WordPress Multisite Configuration

The application includes configuration for multiple WordPress blogs, each with its own deployment target:

```javascript
// Environment variables for different blog sites
VITE_WP_BLOG_MAIN=
VITE_WP_BLOG_HAMRADIO=wa1x
VITE_WP_BLOG_SCIENCE=applefinch
```

This allows the React application to connect to the appropriate WordPress API endpoint based on the deployment target.

## Security Considerations

The deployment strategy includes several security measures:

1. **Credential Management**: FTP credentials are stored securely and not committed to version control
2. **HTTPS Enforcement**: The application is configured to use HTTPS in production
3. **Content Security Policies**: Security headers are configured in the `.htaccess` file
4. **Cache Control**: Appropriate cache headers are set for static assets

## Typical Deployment Workflow

A typical deployment workflow follows these steps:

1. **Develop and Test**:
   ```bash
   npm run dev     # Development mode with hot module replacement
   ```

2. **Build for Production**:
   ```bash
   npm run build   # Builds the application for production
   ```

3. **Deploy to Specific Target**:
   ```bash
   npm run deploy:wa1x   # Deploy to wa1x.thechief.com
   # OR
   npm run deploy:applefinch   # Deploy to applefinch.thechief.com
   # OR
   npm run deploy:all   # Deploy to all targets
   ```

4. **Combined Build and Deploy**:
   ```bash
   npm run full:wa1x   # Build and deploy to wa1x.thechief.com
   ```

## Troubleshooting Common Issues

1. **404 Errors on Routes**: Ensure the `.htaccess` file is properly uploaded and configured
2. **Missing Assets**: Verify that the build process completed successfully and all files were uploaded
3. **FTP Connection Issues**: Check WinSCP configuration and credentials
4. **API Connection Problems**: Verify the WordPress API configuration for the specific target

## Conclusion

The XBlog deployment strategy provides a flexible, maintainable approach to deploying a React application to multiple WordPress sites. By leveraging Vite's build system, environment-specific configuration, and WinSCP for file transfers, the process is streamlined and reliable.

The strategy's key strength is its ability to maintain a single codebase while supporting deployment to multiple targets, each with its own configuration requirements.