import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production lives under https://robserver.me/typewithme/, so compiled asset
// URLs are base-prefixed; dev serves from the root with a proxied API.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/typewithme/dist/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
}));
