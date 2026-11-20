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
      theme_color: '#030014', background_color: '#030014', display: 'standalone', orientation: 'any',
      start_url: './', scope: './',
      icons: [
        { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: 'maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,webmanifest,ttf,woff2,gif,jpg,png,webp}'],
      cleanupOutdatedCaches: true, navigateFallback: 'index.html', skipWaiting: false, clientsClaim: true,
    },
  })],
})
