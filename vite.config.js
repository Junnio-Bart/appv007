import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/appv007/',   // 👈 FIXO com o nome do repositório
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'BooK',
        short_name: 'BooK',
        start_url: '/appv007/',   // 👈 bate com o base
        scope: '/appv007/',       // 👈 bate com o base
        display: 'standalone',
        background_color: '#0b1222',
        theme_color: '#0b1222',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512-mask.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/appv007/index.html', // 👈 importante p/ não dar tela branca
      },
    }),
  ],
})
