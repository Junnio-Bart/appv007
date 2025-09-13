import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/appv007/' : '/'; // << AQUI

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true },
        manifest: {
          name: 'BooK',
          short_name: 'BooK',
          start_url: '/appv007/',  // << AQUI
          scope: '/appv007/',      // << AQUI
          display: 'standalone',
          background_color: '#0b1222',
          theme_color: '#0b1222',
          icons: [
            { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/pwa-512-mask.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/appv007/index.html', // << AQUI
        },
      }),
    ],
  };
});
