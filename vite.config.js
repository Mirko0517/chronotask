import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          vendor: ['react', 'react-dom'],
          
          // Chart libraries
          charts: ['chart.js', 'react-chartjs-2'],
          
          // Animation library
          motion: ['framer-motion'],
          
          // State management and utilities
          store: ['zustand'],
          
          // Form validation
          validation: ['zod'],
          
          // UI utilities
          ui: ['@heroicons/react', 'react-hot-toast', 'react-error-boundary'],
          
          // Utilities
          utils: ['uuid']
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.\w+$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    // Split chunks when they get too large
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: process.env.NODE_ENV === 'development'
  },
  // Optimize dev server
  server: {
    host: true,
    port: 3000,
    open: true
  },
  // Resolve aliases for cleaner imports
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@store': '/src/store',
      '@schemas': '/src/schemas'
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-hot-toast',
      'framer-motion',
      'zustand',
      'zod'
    ]
  }
})
