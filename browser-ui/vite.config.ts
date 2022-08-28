import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
