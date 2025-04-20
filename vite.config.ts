// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        // Split bundles more efficiently
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/system'],
          'vendor-mui-icons': ['@mui/icons-material'],
          'vendor-utils': ['date-fns', 'html-react-parser'],
        },
      },
    },
    // Increase warning limit to avoid unnecessary warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dev server for faster local development
  server: {
    hmr: true,
    port: 3000,
    open: true,
  },
});