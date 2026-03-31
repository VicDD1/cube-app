import { createApp } from 'vue'
import { createPinia } from 'pinia'
import GoogleSignInPlugin from 'vue3-google-signin' 
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Configuration de Google Auth
app.use(GoogleSignInPlugin, {
    clientId: '181758959083-pq1d8lupk0f0sr4eavtrjpmb39fueimg.apps.googleusercontent.com',
})

app.use(router)
app.use(createPinia())

app.mount('#app')