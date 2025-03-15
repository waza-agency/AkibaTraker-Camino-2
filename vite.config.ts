import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  server: {
    host: true,
    port: 3000,
    strictPort: true
  },
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, './client/src')
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: [
      // Exclude the problematic chunks that are causing errors
      'chunk-HBJRLGLT',
      'chunk-VKGVKUH7',
      'chunk-FT22PXXA',
      'chunk-FIFRWQGC',
      // Also exclude the ElevenLabs widget itself to prevent optimization issues
      'elevenlabs-convai'
    ]
  },
});
