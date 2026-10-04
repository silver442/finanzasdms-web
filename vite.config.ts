import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',   // el SW nuevo se activa solo (skipWaiting + clientsClaim)
      injectRegister: 'auto',       // inyecta el registro del SW en index.html
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'FinanzasDMS - Portafolio y Crédito',
        short_name: 'FinanzasDMS',
        description: 'Préstamos familiares, portafolio de inversión y finanzas personales.',
        lang: 'es-MX',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0F172A',
        theme_color: '#059669',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea solo assets estáticos del build. La API vive en otro origen
        // (VITE_API_URL) y no se cachea: los datos financieros siempre van a red.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        enabled: false, // activar temporalmente para probar el SW con `npm run dev`
      },
    }),
  ],
})
