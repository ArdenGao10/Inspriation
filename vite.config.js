import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demoPhone: resolve(__dirname, 'demo-phone.html'),
        pitch: resolve(__dirname, 'pitch.html'),
      },
    },
  },
});
