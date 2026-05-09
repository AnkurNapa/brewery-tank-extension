import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use './' so the build works on any GitHub Pages subpath (e.g. user.github.io/brewery-tank-extension/).
// Tableau loads index.html as the iframe src; relative asset paths keep that simple.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        // Stable-ish chunk names; safe for cache-busting via the asset hash.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
