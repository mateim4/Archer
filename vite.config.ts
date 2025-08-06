import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 1420,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
