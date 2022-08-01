import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@b4fun/ku-client'],
  },
  build: {
    commonjsOptions: {
      include: [
        /client/,
        /node_modules/,
      ],
    },
  },
})
