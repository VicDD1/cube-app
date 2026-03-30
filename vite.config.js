import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      // C'est ici que l'on définit le racourci "@" vers le dossier "src"
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    watch: {
      ignored: ['**/src/assets/images/VELOS/**'],
    },
  
    proxy: {
      '/api-azure': {
        target: 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-azure/, '')
      }
    }
  }
})