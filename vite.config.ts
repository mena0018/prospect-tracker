import { translatedPathnames } from './src/i18n/lib'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ['react', 'react-dom']
  },

  optimizeDeps: {
    include: ['@tanstack/react-form']
  },

  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/i18n/paraglide',
      outputStructure: 'message-modules',
      cookieName: 'PARAGLIDE_LOCALE',
      strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
      urlPatterns: translatedPathnames
    }),

    // tanstackStart() must come before viteReact()
    // the router plugin runs before JSX transformation.
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact()
  ],

  // Deployment preset: Vercel auto-injects NITRO_PRESET=vercel at build time.
  // We set it explicitly for reproducible local/CI builds.
  nitro: {
    preset: 'vercel'
  }
})
