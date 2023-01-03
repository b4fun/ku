import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts()],

  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@b4fun/ku-ui",
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@mantine/core",
        "@mantine/react",
        "@mantine/react",
        "@tabler/icons",
      ],
      output: {
        globals: {
          react: "React",
        },
      },
    },
  },
});
