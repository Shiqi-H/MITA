import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Proxy WebSocket connections to the backend
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
      },
      // Proxy health check and any REST routes
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
