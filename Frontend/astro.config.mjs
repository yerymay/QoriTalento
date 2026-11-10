import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Proxy solo para desarrollo. En despliegue se configu
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      port: 3009,
      host: true,
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
    preview: {
      port: 3009,
      host: true,
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
  },
});