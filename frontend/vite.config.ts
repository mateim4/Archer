import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  // prevent vite from obscuring rust errors
  clearScreen: false,
  
  // tauri expects a fixed port, fail if that port is not available
  server: {
    host: '0.0.0.0',
    port: 1420, // Changed from 3001 to avoid conflict with backend
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3003', // Node.js backend (temporary - Rust backend on 3001 has compilation errors)
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // to make use of `TAURI_DEBUG` and other env variables
  // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
  envPrefix: ['VITE_', 'TAURI_'],
  
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // Chunk size warning threshold (500kb is default)
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal bundle sizes
        manualChunks: {
          // Core React and routing - always loaded
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Fluent UI - large library, split from main bundle
          'vendor-fluent': ['@fluentui/react-components', '@fluentui/react-icons'],
          
          // Visualization libraries - heavy, load on demand
          'vendor-charts': ['recharts', 'echarts', 'echarts-for-react'],
          'vendor-visx': [
            '@visx/axis', '@visx/curve', '@visx/event', '@visx/grid',
            '@visx/group', '@visx/hierarchy', '@visx/pattern', '@visx/responsive',
            '@visx/scale', '@visx/shape', '@visx/text', '@visx/tooltip', '@visx/zoom'
          ],
          'vendor-d3': ['d3'],
          'vendor-flow': ['@xyflow/react', 'elkjs'],
          'vendor-mermaid': ['mermaid'],
          
          // PDF/Image export - load on demand
          'vendor-export': ['jspdf', 'html-to-image'],
          
          // Icons (tree-shakeable but still large)
          'vendor-icons': ['lucide-react', 'react-icons'],
          
          // State management
          'vendor-state': ['zustand'],
          
          // Drag and drop
          'vendor-dnd': ['@hello-pangea/dnd'],
          
          // Utilities
          'vendor-utils': ['uuid', 'dompurify'],
        },
      },
    },
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@fluentui/react-components',
      '@fluentui/react-icons',
      'zustand',
    ],
    exclude: [
      // Exclude heavy libs from pre-bundling for faster dev startup
      'mermaid',
    ],
  },
})
