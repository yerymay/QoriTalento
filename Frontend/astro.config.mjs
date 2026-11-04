import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Proxy solo para desarrollo. En despliegue se configurará reverse proxy /api.
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
  },
});
