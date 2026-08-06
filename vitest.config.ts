import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true
  },
  test: {
    // Default stays `node` so pure-logic tests keep their speed; component tests
    // opt into jsdom with a `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true
  }
})
