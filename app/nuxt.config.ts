import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import categoryIcons from './app/assets/js/icons.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
        { href: '/favicon.png', rel: 'icon', type: 'image/png' },
      ],
      meta: [
        { content: 'EliteMoney — Personal Finance & Expense Tracker. Track expenses, manage wallets, analyze spending, manage lending and recurring transactions.', name: 'description' },
        { content: 'EliteMoney — Personal Finance Tracker', property: 'og:title' },
        { content: 'EliteMoney gives you complete control over your finances with smart wallets, recurring transactions, lending management, and secure biometric access.', property: 'og:description' },
        { content: 'website', property: 'og:type' },
        { content: 'EliteMoney', property: 'og:site_name' },
        { content: 'summary_large_image', name: 'twitter:card' },
        { content: 'EliteMoney — Personal Finance Tracker', name: 'twitter:title' },
        { content: 'EliteMoney gives you complete control over your finances with smart wallets, recurring transactions, lending management, and secure biometric access.', name: 'twitter:description' },
      ],
      title: 'EliteMoney — Personal Finance Tracker',
    },
  },

  colorMode: {
    classSuffix: '',
    fallback: 'dark',
    preference: 'system',
  },

  compatibilityDate: '2024-07-07',
  css: [join(currentDir, './app/assets/css/main.css')],

  devtools: {
    timeline: {
      enabled: true,
    },
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  fonts: {
    defaults: {
      subsets: ['cyrillic', 'latin', 'latin-ext'],
    },
    families: [
      { global: true, name: 'Roboto', weights: [400, 500, 600, 700] },
      { global: true, name: 'Roboto Condensed', weights: [400, 500, 600, 700] },
      { global: true, name: 'Nunito', weights: [400, 700, 800] },
      { global: true, name: 'Unica One' },
    ],
  },

  future: {
    compatibilityVersion: 4,
  },

  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: {
      cookieKey: 'i18n_redirected',
      useCookie: true,
    },
    locales: [
      {
        code: 'en',
        file: 'en-US.js',
        language: 'en-US',
      },
      {
        code: 'ru',
        file: 'ru-RU.js',
        language: 'ru-RU',
      },
    ],
    strategy: 'no_prefix',
    vueI18n: '../i18n/i18n.config.ts',
  },

  icon: {
    clientBundle: {
      icons: [
        ...categoryIcons.flat(),
        // Runtime iconify fetches pop in after first paint and shift layout.
        'hugeicons:archive-01',
        'hugeicons:bank',
        'hugeicons:folder-library',
        'hugeicons:laptop-programming',
        'hugeicons:menu-01',
        'hugeicons:money-exchange-01',
        'hugeicons:plus-sign-square',
        'hugeicons:settings-01',
        'hugeicons:wallet-01',
        'lucide:chart-no-axes-combined',
        'lucide:folder',
        'lucide:folder-open',
        'lucide:folder-open-dot',
        'lucide:folder-tree',
        'lucide:loader-circle',
        'lucide:network',
      ],
      scan: true,
    },
    collections: ['hugeicons', 'lucide', 'mdi'],
  },

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxt/eslint',
  ],

  nitro: {
    hooks: {
      // Make the entry Tailwind stylesheet (~256KB) non-render-blocking so the SPA loading
      // skeleton (inline-styled) paints on HTML arrival instead of waiting for that CSS to
      // download. The app itself renders only after its JS bundle executes - slower than the
      // CSS fetch - so styles are in place by mount (no FOUC); <noscript> keeps it blocking
      // when JS is off. Rewrites the statically generated HTML (index/200/404).
      'prerender:generate': (route: { contents?: string, fileName?: string }) => {
        if (typeof route.contents !== 'string' || !route.fileName?.endsWith('.html'))
          return
        route.contents = route.contents.replace(
          /<link rel="stylesheet" href="([^"]+)"([^>]*)>/g,
          (_m, href, rest) =>
            `<link rel="stylesheet" href="${href}"${rest} media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="${href}"${rest}></noscript>`,
        )
      },
    },
    preset: 'static',
  },

  pwa: {
    client: {
      installPrompt: true,
      registerPlugin: true,
    },
    devOptions: {
      enabled: false,
      navigateFallback: '/',
      suppressWarnings: false,
    },
    manifest: {
      background_color: '#171717',
      display: 'standalone',
      icons: [{
        sizes: '192x192',
        src: 'pwa-192x192.png',
        type: 'image/png',
      }, {
        sizes: '512x512',
        src: 'pwa-512x512.png',
        type: 'image/png',
      }, {
        purpose: 'any',
        sizes: '512x512',
        src: 'pwa-512x512.png',
        type: 'image/png',
      }, {
        purpose: 'maskable',
        sizes: '192x192',
        src: 'pwa-192x192.png',
        type: 'image/png',
      }],
      id: '/',
      name: 'EliteMoney',
      screenshots: [{
        form_factor: 'wide',
        sizes: '1920x1080',
        src: 'screenshot-desktop.png',
        type: 'image/png',
      }, {
        form_factor: 'narrow',
        sizes: '750x1334',
        src: 'screenshot-mobile.png',
        type: 'image/png',
      }],
      short_name: 'EliteMoney',
      start_url: '/dashboard',
      theme_color: '#171717',
    },
    registerType: 'autoUpdate',
    workbox: {
      globIgnores: ['**/200*', '**/404*'],
      globPatterns: ['**/*.{js,json,css,html,png,svg,ico,woff2}', '**/wa-sqlite-async.*.wasm'],
      importScripts: ['/sw-push.js'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      navigateFallback: '/',
      runtimeCaching: [
        {
          handler: 'CacheFirst',
          options: {
            cacheableResponse: { statuses: [0, 200] },
            cacheName: 'iconify',
            expiration: { maxEntries: 500 },
          },
          urlPattern: /^https:\/\/api\.iconify\.design\/.*/,
        },
        {
          handler: 'CacheFirst',
          options: {
            cacheableResponse: { statuses: [0, 200] },
            cacheName: 'google-fonts',
            expiration: { maxEntries: 30 },
          },
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        },
        {
          handler: 'CacheFirst',
          options: {
            cacheableResponse: { statuses: [0, 200] },
            cacheName: 'user-avatars',
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 30, maxEntries: 20 },
          },
          urlPattern: /^https:\/\/lh3\.googleusercontent\.com\/.*/,
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      powersyncUrl: process.env.VITE_POWERSYNC_URL || process.env.POWERSYNC_URL || 'https://6aae53cc8453e7cf83384914.powersync.journeyapps.com',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbmxkemdhZGtxY2p6d3dkbnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzIwNzAsImV4cCI6MjEwNTMwODA3MH0.E1U2b3tHwDkw3mnabsC5AszwaJNXqkFwNOXeqZFzUaY',
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hknldzgadkqcjzwwdnzy.supabase.co',
      vapidPublicKey: process.env.VITE_VAPID_PUBLIC_KEY || 'BKpPNYWS-P4xd9rbR9k2tOfowDaBWRlmcm011Bd0_TJw1X4AOgtMsgM4yzgapn5owQsUb358_RM9-QjywofUOJU',
    },
  },

  ssr: false,

  telemetry: false,

  vite: {
    optimizeDeps: {
      // @powersync/web ships web workers + WASM that must not be pre-bundled.
      exclude: ['@powersync/web'],
      include: [
        'localforage',
        '@supabase/supabase-js',
        'date-fns',
        'zod/v4',
        'es-toolkit',
        '@internationalized/date',
        'date-fns/locale',
        'reka-ui',
        'reka-ui/namespaced',
      ],
    },
    worker: {
      format: 'es',
    },
  },
})
