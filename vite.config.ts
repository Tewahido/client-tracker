/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Custom service worker (src/sw.ts) so notification clicks open the right loan.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/badge-96.png'],
      manifest: {
        name: 'Lendly',
        short_name: 'Lendly',
        description: "Keep track of money you've lent, who owes what, and when it's due.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0a0c11',
        theme_color: '#0a0c11',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Separate long-lived vendor chunks so app updates don't re-download them.
        // Module ids use forward slashes on every OS.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('@supabase')) return 'supabase'
          if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/node_modules\/(recharts|d3-|victory-vendor|@reduxjs|redux|immer|reselect)/.test(id)) return 'charts'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
})
