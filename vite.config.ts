import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [viteTsConfigPaths(), tailwindcss(), tanstackStart(), nitro(), viteReact()],

  // Deployment preset: Vercel auto-injects NITRO_PRESET=vercel at build time.
  // We set it explicitly for reproducible local/CI builds.
  nitro: {
    preset: 'vercel',
  },
})
