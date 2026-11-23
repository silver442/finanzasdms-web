import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import type { Plugin } from 'vite'

// SW "autodestructivo" que el dev server sirve en /sw.js. Si quedó registrado un SW de
// producción en este origen (ej. un `vite preview` en el mismo puerto), seguiría sirviendo
// el bundle viejo para siempre: sin esto, /sw.js responde HTML y su revisión de update falla.
// Al detectarlo como versión nueva, se activa, borra cachés, se desregistra y recarga la pestaña.
const KILL_SWITCH_SW = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
`

function devServiceWorkerKillSwitch(): Plugin {
  return {
    name: 'dev-sw-kill-switch',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/sw.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript')
        res.setHeader('Cache-Control', 'no-store')
        res.end(KILL_SWITCH_SW)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devServiceWorkerKillSwitch(),
    VitePWA({
      strategies: 'generateSW',
      // 'autoUpdate': el SW nuevo se activa en cuanto se instala (sin quedar en `waiting`) y
      // PwaUpdatePrompt (que registra el SW vía useRegisterSW) recarga la página una vez que toma
      // el control. Así un refresh normal basta para recibir la versión nueva.
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        id: '/dashboard',
        name: 'FinanzasDMS - Portafolio y Crédito',
        short_name: 'FinanzasDMS',
        description: 'Préstamos familiares, portafolio de inversión y finanzas personales.',
        lang: 'es-MX',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0F172A',
        theme_color: '#0F172A',      // surface-base: barra de estado del mismo tono que la app
        categories: ['finance'],
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // El glifo del 512 cabe en la zona segura (círculo del 80 %) con fondo a sangre
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea solo assets estáticos del build. La API vive en otro origen
        // (VITE_API_URL) y no se cachea: los datos financieros siempre van a red.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // El plugin solo los activa con injectRegister 'auto'; aquí el registro es manual (PwaUpdatePrompt)
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        // No servir el App Shell para peticiones de archivos (ej. /og-image.png inexistente)
        navigateFallbackDenylist: [/\/[^/?]+\.[^/]+$/],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Tipografías de Google Fonts (index.css) disponibles sin conexión
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // activar temporalmente para probar el SW con `npm run dev`
      },
    }),
  ],
})
