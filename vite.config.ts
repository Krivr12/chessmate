import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// Keep in sync with APP_NAME in src/constants.ts.
const APP_NAME = "ChessMate"
const NAVY = "#061824"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: APP_NAME,
        short_name: APP_NAME,
        description: "Play chess against a cheeky frog, fully offline.",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        background_color: NAVY,
        theme_color: NAVY,
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache everything, including the Stockfish worker and its WASM.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,wasm}"],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
