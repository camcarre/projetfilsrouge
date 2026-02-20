import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

// PWA uniquement en build (optionnel). En dev désactivé pour réduire l’usage CPU.
const usePWA = process.env.NODE_ENV === 'production' && process.env.VITE_BUILD_PWA === '1'

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      usePolling: false,
    },
  },
  plugins: [
    preact(),
    ...(usePWA ? [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Finance PWA - Visualisation Financière',
        short_name: 'Finance PWA',
        description: 'Visualisez vos finances, analysez votre portefeuille et recevez des recommandations ETF',
        theme_color: '#1e3a5f',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
