<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/useStore'

import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import ChatBot from './components/ChatBot.vue'
import CookieConsent from './components/CookieConsent.vue'

const route = useRoute()
const appStore = useAppStore()

// --- TRACKER D'ACTIVITÉ INVISIBLE ---
let timerInterval = null
const currentSessionIndex = ref(null)

// Démarre un nouveau chronomètre pour la page actuelle
const startTracking = (path) => {
  const newEntry = {
    path: path,
    timestamp: new Date().toISOString(),
    timeSpentInSeconds: 0
  }
  
  appStore.activityLog.push(newEntry)
  currentSessionIndex.value = appStore.activityLog.length - 1

  // On incrémente le compteur chaque seconde
  timerInterval = setInterval(() => {
    if (currentSessionIndex.value !== null) {
      appStore.activityLog[currentSessionIndex.value].timeSpentInSeconds++
    }
  }, 1000)
}

// Arrête le chronomètre
const stopTracking = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// À chaque changement d'URL (changement de page via Vue Router)
watch(
  () => route.path,
  (newPath) => {
    // 1. On vérifie d'abord si on a le droit de traquer (consentement)
    const savedCookies = localStorage.getItem('cube_cookie_consent')
    let hasConsented = false
    
    if (savedCookies) {
      try {
        const parsed = JSON.parse(savedCookies)
        hasConsented = parsed.audience?.status === 'accepted'
      } catch (e) {
        console.error('Erreur lecture cookies', e)
      }
    }

    // 2. Si l'utilisateur est d'accord, on lance la machine
    if (hasConsented) {
      stopTracking() // On arrête le chrono de l'ancienne page
      startTracking(newPath) // On démarre le chrono de la nouvelle page
      
      // On sauvegarde en temps réel dans le navigateur
      localStorage.setItem('cube_activity_log', JSON.stringify(appStore.activityLog))
    } else {
      // S'il a refusé, on s'assure que rien ne tourne !
      stopTracking()
    }
  },
  { immediate: true } // Se déclenche aussi au premier chargement de l'application
)

// Nettoyage de sécurité si on ferme l'app
onUnmounted(() => {
  stopTracking()
})
</script>

<template>
  <Header />
  
  <main class="main-content">
    <router-view />
    <ChatBot />
  </main>

  <Footer v-if="!['login', 'creer-compte', 'connexion-choice'].includes($route.name)" />

  <CookieConsent />
</template>

<style>
/* Style global pour enlever les marges blanches par défaut du navigateur */
body {
  margin: 0;
  padding: 0;
}

/* Flexbox pour forcer le footer à rester tout en bas */
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}
</style>