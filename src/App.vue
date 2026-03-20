<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import ChatBot from './components/ChatBot.vue'
</script>

<template>
  <Header />
  
  <main class="main-content">
    <router-view />
    <ChatBot />
  </main>

  <Footer />
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