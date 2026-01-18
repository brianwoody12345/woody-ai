import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Vercel backend (serverless API)
const VERCEL_BACKEND = "https://woody-ai-tutor.vercel.app";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: VERCEL_BACKEND,
        changeOrigin: true,
        secure: true,
      },
    },
  },

  build: {
    // Silence Vite chunk size warning (harmless for AI apps)
    chunkSizeWarningLimit: 1500,
  },

  plugins: [
    react(),
    ...(mode === "development" ? [componentTagger()] : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
