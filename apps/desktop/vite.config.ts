import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases for shared packages
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@scripture-ai/core': path.resolve(__dirname, '../../packages/core/src'),
      '@scripture-ai/native': path.resolve(__dirname, '../../packages/native/src'),
    },
  },

  // Tauri expects a fixed port
  server: {
    port: 1420,
    strictPort: true,
  },

  // Build configuration
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: ['es2021', 'chrome100', 'safari13'],
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },

  // Clear console on restart
  clearScreen: false,

  // Tauri environment variables
  envPrefix: ['VITE_', 'TAURI_'],
});