import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    {
      name: 'handle-uri-malformed',
      configureServer(server) {
        // Add middleware to handle malformed URIs before they reach Vite's middleware
        server.middlewares.use((req, res, next) => {
          try {
            // Check if the URL is potentially problematic
            if (req.url && req.url.includes('%')) {
              // Try to safely decode it, if it fails, use the raw URL
              try {
                decodeURI(req.url);
              } catch (e) {
                console.warn(`URI malformed detected: ${req.url}. Using raw URL instead.`);
                // If decoding fails, modify the URL to prevent errors
                req.url = req.url.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
              }
            }
            next();
          } catch (err) {
            console.error('URI middleware error:', err);
            next();
          }
        });
      }
    },
    react(),
    runtimeErrorOverlay(),
    themePlugin()
  ],
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
