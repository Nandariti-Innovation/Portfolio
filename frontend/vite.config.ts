import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("vite/preload-helper")) return "vite-runtime";
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/node_modules/three/") ||
            id.includes("/node_modules/@react-three/fiber/") ||
            id.includes("/node_modules/@react-three/drei/")
          ) {
            return "three-vendor";
          }

          if (id.includes("/node_modules/@supabase/")) {
            return "supabase-vendor";
          }

          if (id.includes("/node_modules/radix-ui/")) {
            return "editor-vendor";
          }

          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router/") ||
            id.includes("/node_modules/react-router-dom/") ||
            id.includes("/node_modules/react-redux/") ||
            id.includes("/node_modules/@reduxjs/toolkit/") ||
            id.includes("/node_modules/redux/") ||
            id.includes("/node_modules/scheduler/") ||
            id.includes("/node_modules/use-sync-external-store/")
          ) {
            return "framework-vendor";
          }
        },
      },
    },
  },
  server: {
    host: true,
    hmr: process.env.CODESPACES
      ? { protocol: "wss", clientPort: 443 }
      : undefined,
  },
});
