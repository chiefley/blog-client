// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import visualizer only when needed (commented out to avoid unused import error)
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  // Load env file based on mode (development or production)
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [
      react(),
      // Uncomment this for bundle analysis (creates stats.html)
      // visualizer({ open: true, gzipSize: true }),
    ],
    // Use environment variable for base, with fallback to '/'
    base: env.VITE_BASE_PATH || '/',
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
    },
    // Define environment variables to be available in your code
    define: {
      // If you need to expose all environment variables with VITE_ prefix
      ...Object.keys(env).reduce((acc: Record<string, string>, key) => {
        if (key.startsWith('VITE_')) {
          acc[`import.meta.env.${key}`] = JSON.stringify(env[key]);
        }
        return acc;
      }, {}),
    },
  };
});