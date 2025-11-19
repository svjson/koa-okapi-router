import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',

    typecheck: {
      enabled: true,
      include: ['test/**/*.test.ts'],
      tsconfig: './tsconfig.json',
      checker: 'tsc',
    },
  },
})
