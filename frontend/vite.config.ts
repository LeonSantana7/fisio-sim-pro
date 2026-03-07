import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'FisioSim',
        short_name: 'FisioSim',
        description: 'Plataforma de Fisioterapia Intensivista — Calculadoras, Protocolos e Simulador de VM',
        theme_color: '#0a0f1a',
        background_color: '#0a0f1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['medical', 'health', 'utilities'],
        shortcuts: [
          {
            name: 'Calculadoras',
            short_name: 'Calcul.',
            description: 'Abrir módulo de calculadoras clínicas',
            url: '/?module=tools',
            icons: [{ src: 'pwa-192.png', sizes: '192x192' }],
          },
          {
            name: 'Simulador',
            short_name: 'Simul.',
            description: 'Abrir simulador de ventilação mecânica',
            url: '/?module=simulator',
            icons: [{ src: 'pwa-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.render\.com\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
