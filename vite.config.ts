import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket support
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify("1.0.0"),
  },
});
