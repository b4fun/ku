import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: './src/sw.ts',
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
