import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // On utilise happy-dom au lieu de jsdom
      environment: 'happy-dom',
      globals: true,
      exclude: ['node_modules', 'dist', 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    }
  })
)