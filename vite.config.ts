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