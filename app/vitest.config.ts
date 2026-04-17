import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    environment: 'node',
    // Both session test files mutate process.env.SESSION_SECRET; running
    // them in parallel caused sporadic failures.
    fileParallelism: false,
  },
})
