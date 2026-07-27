import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
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
                enabled: true, // Enable PWA in development
            },
            includeAssets: ['favicon.ico', 'favicon.svg', 'logo-192.png', 'logo-512.png', 'robots.txt'],
            manifest: {
                name: 'Laris Hub',
                short_name: 'Laris Hub',
                description: 'Aplikasi Kasir & Pencatatan Keuangan UMKM',
                theme_color: '#0F766E',
                background_color: '#F5F5F5',
                display: 'standalone',
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
                        purpose: 'any maskable',
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
                // Cache shell aggressively
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
                // Exclude Supabase calls from cache
                navigateFallbackDenylist: [/^\/api/, /^\/auth/],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-webfonts',
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
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
});
