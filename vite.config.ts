import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // TanStack Router MUST be before React plugin
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'logo-192.png', 'logo-512.png', 'robots.txt'],
      manifest: {
        name: 'Laris Hub',
        short_name: 'Laris Hub',
        description: 'Aplikasi Kasir & Pencatatan Keuangan UMKM',
        theme_color: '#285eaf',
        background_color: '#F5F5F5',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'id',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Catat Penjualan',
            short_name: 'Penjualan',
            description: 'Catat transaksi penjualan baru',
            url: '/kasir',
            icons: [{ src: 'logo-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        inlineWorkboxRuntime: true,
        // Cache shell aggressively
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        // Exclude API calls from fallback routing
        navigateFallbackDenylist: [/^\/api/, /^\/auth/],
        runtimeCaching: [
          // Cache Supabase REST API for true Offline-First support
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 3, // Fail fast if offline/poor connection
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Cache Supabase Storage Images (Product photos, etc)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // General image fallback
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2022',
    // Increase chunk size warning to 600kb
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor into logical groups
          'react-vendor': ['react', 'react-dom'],
          'tanstack-query': ['@tanstack/react-query'],
          'tanstack-router': ['@tanstack/react-router'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          forms: ['react-hook-form', 'zod'],
          date: ['date-fns'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
