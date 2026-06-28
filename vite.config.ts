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
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'offline.html'],
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
        navigateFallback: `${base}offline.html`,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
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
