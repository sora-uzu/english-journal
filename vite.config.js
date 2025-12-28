import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            manifest: false,
            includeAssets: [
                'icons/icon-192.png',
                'icons/icon-512.png',
                'icons/icon-192-maskable.png',
                'icons/icon-512-maskable.png',
                'icons/apple-touch-icon.png',
                'manifest.webmanifest',
            ],
            devOptions: {
                enabled: false,
            },
            workbox: {
                globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest}'],
                navigateFallback: null,
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) =>
                            request.destination === 'image',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images',
                            expiration: {
                                maxEntries: 60,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'font',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
        }),
    ],
});
