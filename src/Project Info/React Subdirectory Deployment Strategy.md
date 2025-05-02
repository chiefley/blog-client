# React Subdirectory Deployment Strategy

## Overview

This document outlines the strategy for deploying a React application built with Vite to a subdirectory on a web server. This approach solves common path resolution issues that occur when a React Single Page Application (SPA) is not hosted at the root of a domain.

For example, deploying to:
- `https://example.com/client/` instead of 
- `https://example.com/`

## Challenges with Subdirectory Deployment

React SPAs built with tools like Vite face several challenges when deployed to subdirectories:

1. **Asset Path Resolution**: By default, built files reference assets using absolute paths (starting with `/`), which work when deployed to a domain root but break in subdirectories.

2. **Client-Side Routing**: React Router's client-side routing needs special server configuration to handle direct URL access to routes.

3. **Build Configuration**: The build system needs specific configuration to generate relative paths.

4. **Stale Files**: Without proper cleaning, old build files might remain and cause issues.

## Solution Components

Our approach consists of several key components:

### 1. Vite Configuration

The `vite.config.ts` file is configured to use relative paths for all assets:

```typescript
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development or production)
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [react()],
    // Use relative paths for assets
    base: './',
    build: {
      rollupOptions: {
        output: {
          // Ensure asset filenames include the base directory
          assetFileNames: 'assets/[name]-[hash].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
  };
});
```

### 2. Environment Configuration

The `.env.production` file uses a relative base path:

```
VITE_BASE_PATH=./
VITE_WP_API_BASE_URL=https://wpcms.thechief.com

# Multisite Blog Configuration
VITE_WP_BLOG_MAIN=
VITE_WP_BLOG_HAMRADIO=wa1x
VITE_WP_BLOG_SCIENCE=applefinch
```

### 3. Server Configuration (.htaccess)

The `.htaccess` file handles URL rewrites for client-side routing:

```apache
# Enable rewriting
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
```

### 4. HTML Template

The `index.html` file uses relative paths to reference assets:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>XBlog - Multiple Personal Blogs</title>
    <meta name="description" content="A collection of personal blogs about ham radio, science, and technology" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

### 5. Deployment Script

The `deploy.js` script handles the build process in two phases:

#### Pre-build Phase
- Cleans the `dist` directory
- Prepares the environment for building

#### Post-build Phase
- Copies the `.htaccess` file
- Fixes any absolute paths in generated HTML
- Copies additional required files

```javascript
// Pre-build tasks
function preBuild() {
  console.log('=== Running pre-build tasks ===');
  
  // Clean the dist directory if it exists
  if (existsSync(distDir)) {
    console.log('Cleaning dist directory...');
    // Clean directory logic...
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

  // Copy or create .htaccess file
  // Fix paths in index.html
  // Copy favicon
}
```

### 6. NPM Scripts

The `package.json` scripts simplify the build process:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "node deploy.js pre-build && tsc -b && vite build --mode=production --base=./ && node deploy.js post-build",
    "clean": "node deploy.js pre-build",
    "preview": "vite preview",
    "test": "vitest"
  }
}
```

## Deployment Workflow

The complete deployment process follows these steps:

1. **Clean Previous Build**: Remove any existing files from the `dist` directory
   ```bash
   npm run clean
   ```

2. **Build for Production**: Run the complete build process optimized for subdirectory deployment
   ```bash
   npm run build
   ```

3. **Test Locally** (Optional): Preview the built files locally
   ```bash
   npm run preview
   ```

4. **Upload to Server**: Upload the contents of the `dist` directory to the `/client/` folder on the web server

## Troubleshooting Common Issues

### 404 Errors on Page Refresh

If you encounter 404 errors when refreshing the page, check:
- The `.htaccess` file is properly uploaded and contains the correct `RewriteBase` path
- Your server has mod_rewrite enabled
- Directory permissions allow .htaccess to be read

### Missing Assets

If images, scripts, or stylesheets are missing:
- Verify assets use relative paths in the generated HTML
- Check the network tab in browser dev tools to see what paths are being requested
- Ensure all files were uploaded to the correct location

### Routing Issues

If links within the application don't work:
- Ensure React Router is configured to work with a basename:
  ```jsx
  <Router basename="/client">
    {/* routes */}
  </Router>
  ```

## Advantages of This Approach

1. **Portability**: The application can be deployed to any subdirectory without rebuilding
2. **Clean Builds**: Each build starts fresh, preventing stale file issues
3. **Error Detection**: The build process validates paths and notifies of potential issues
4. **Simplicity**: One command handles the entire build process

## Future Enhancements

Potential improvements to the deployment strategy:

1. **Automatic Deployment**: Add SCP/SFTP capabilities to automatically upload files to the server
2. **Environment-Specific Config**: Add support for multiple deployment environments
3. **Build Versioning**: Include version information in the build output
4. **Performance Monitoring**: Add tools to measure and report on application performance

## Conclusion

This deployment strategy addresses the main challenges of deploying a React SPA to a subdirectory. The combination of relative paths, proper server configuration, and a two-phase build process ensures a reliable deployment experience.

By following this approach, you can maintain a single codebase that works both in local development and when deployed to a subdirectory on your production server.
