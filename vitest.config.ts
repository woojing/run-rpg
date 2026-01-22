import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Aliases matching Vite config
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    // Use happy-dom environment for unit tests
    environment: 'happy-dom',

    // Global setup for Phaser mocks
    setupFiles: ['./tests/setup.ts'],

    // Test file patterns - exclude integration tests by default
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'tests/integration/**',
      '**/node_modules/**'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/main.ts'
      ]
    }
  }
})

// Separate config for browser mode integration tests
export const browserConfig = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    include: [
      'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'tests/unit/**',
      '**/node_modules/**'
    ],
    browser: {
      enabled: true,
      headless: true
    }
  }
})
