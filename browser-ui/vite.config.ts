import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import wasm from "vite-plugin-wasm";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    react(),
  ],
  resolve: {
    alias: {
      util: 'util',
      events: 'events',
      process: "process/browser",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    }
  },
  build: {
    commonjsOptions: {
      include: [
        /node_modules/,
      ],
    },
    target: 'es2020',
  },
})
