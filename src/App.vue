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

const showCookies = ref(false)
const showChatbot = ref(false)


let timerInterval = null
const currentSessionIndex = ref(null)



const startTracking = (path) => {
  const newEntry = {
    path: path,
    timestamp: new Date().toISOString(),
    timeSpentInSeconds: 0
  }
  
  appStore.activityLog.push(newEntry)
  currentSessionIndex.value = appStore.activityLog.length - 1

  
  timerInterval = setInterval(() => {
    if (currentSessionIndex.value !== null) {
      appStore.activityLog[currentSessionIndex.value].timeSpentInSeconds++
    }
  }, 1000)
}


const stopTracking = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}


watch(
  () => route.path,
  (newPath) => {
    
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

    
    if (hasConsented) {
      stopTracking() 
      startTracking(newPath) 
      
      
      localStorage.setItem('cube_activity_log', JSON.stringify(appStore.activityLog))
    } else {
      
      stopTracking()
    }
  },
  { immediate: true } 
)

onMounted(() => {
  
  const hasAnswered = localStorage.getItem('cube_cookie_consent')
  
  if (!hasAnswered) {
    
    
    setTimeout(() => {
      showCookies.value = true
      showChatbot.value = true
    }, 3000)
  } else {
    
    showCookies.value = true
    showChatbot.value = true
  }
})


onUnmounted(() => {
  stopTracking()
})
</script>

<template>
  <Header />
  
  <main class="main-content">
    <router-view />
    <ChatBot v-if="showChatbot" />
  </main>

  <Footer v-if="!['login', 'creer-compte', 'connexion-choice'].includes($route.name)" />

  <CookieConsent v-if="showCookies" />
</template>

<style>

body {
  margin: 0;
  padding: 0;
}


#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}
</style>