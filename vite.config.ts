import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// When building for GitHub Pages the app is served from a repo subpath
// (https://<user>.github.io/BM-Health-Companion/). `npm run build` sets
// DEPLOY_TARGET=pages via the workflow; locally base stays '/'.
const base = process.env.DEPLOY_TARGET === 'pages' ? '/BM-Health-Companion/' : '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'BM Health Companion',
        short_name: 'Health',
        description:
          'Your daily health coach — track medications, symptoms, glucose and more. Works offline.',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        // Relative so the manifest resolves correctly under any base path.
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Serve the precached app shell for every in-app navigation/reload.
        // This is what makes the SPA work offline AND avoids GitHub Pages 404s
        // on deep-route reloads under the repo subpath. The app then loads its
        // data from IndexedDB. (Previously this pointed at offline.html, which
        // hijacked normal reloads and showed the "You're offline" screen.)
        navigateFallback: `${base}index.html`,
        // Don't let the SPA fallback swallow requests for the OCR assets.
        navigateFallbackDenylist: [/\/tesseract\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The on-demand OCR engine (~14MB) must not bloat the install precache;
        // it's cached at runtime the first time the photo-import feature is used.
        globIgnores: ['**/tesseract/**'],
        // Allow the largest core wasm to be runtime-cached.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            // Self-hosted Tesseract worker + wasm engine.
            urlPattern: ({ url }) => url.pathname.includes('/tesseract/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-engine',
              expiration: { maxEntries: 12 },
            },
          },
          {
            // Language model fetched once from the tessdata CDN, then cached.
            urlPattern: ({ url }) => url.hostname.includes('tessdata'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ocr-langdata',
              expiration: { maxEntries: 4 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
