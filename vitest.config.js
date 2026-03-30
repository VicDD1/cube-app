import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Simule un navigateur
      environment: 'jsdom',
      // Permet d'utiliser "describe", "it", "expect" sans import
      globals: true,
      // Exclut Playwright et les dossiers inutiles
      exclude: ['node_modules', 'dist', 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    }
  })
)