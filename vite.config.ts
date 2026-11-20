import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate', injectRegister: 'auto',
    includeAssets: ['icon.svg', 'maskable.svg'],
    manifest: {
      name: 'SanaFit Home Workout', short_name: 'SanaFit', description: 'Weekly home workout plan for strength, muscle, and healthy weight gain',
      theme_color: '#211429', background_color: '#211429', display: 'standalone', orientation: 'any',
      start_url: './', scope: './',
      icons: [
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: 'maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,webmanifest,ttf,woff2,gif,jpg,png,webp}'],
      runtimeCaching: [{
        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/JahelCuadrado\/ExerciseGymGifsDB@v1\.1\.0\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'sanafit-exercise-media-v1',
          expiration: { maxEntries: 60, maxAgeSeconds: 31536000 },
          cacheableResponse: { statuses: [0, 200] },
        },
      }],
      cleanupOutdatedCaches: true, navigateFallback: 'index.html', skipWaiting: false, clientsClaim: true,
    },
  })],
})
