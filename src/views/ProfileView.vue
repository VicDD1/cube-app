<template>
  <div class="full-page-profil">
    <SideBarProfile class="sidebar-fix" />

    <main class="profil-main-viewport">
      <div class="breadcrumb">ACCUEIL > VOTRE COMPTE</div>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import SideBarProfile from '../components/SideBarProfile.vue'
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()

onMounted(() => {
  appStore.loadPersistedStore()
  // Bloque totalement le scroll de la page web
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  // Libère le scroll quand on quitte le profil
  document.body.style.overflow = ''
})
</script>

<style scoped>
.full-page-profil {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  z-index: 9999;
  background-color: #f2f2f2;
}

.sidebar-fix {
  width: 375px;
  height: 100%;
  flex-shrink: 0;
}

.profil-main-viewport {
  flex: 1;
  height: 100%;
  padding: 60px; /* Un peu plus de padding pour aérer */
  box-sizing: border-box;
  
  /* --- C'EST ICI QUE ÇA SE PASSE --- */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centre verticalement les cartes dans l'écran */
}

.breadcrumb {
  /* On le sort du centrage pour qu'il reste en haut */
  position: absolute;
  top: 40px;
  left: 400px; /* Aligné après la sidebar */
  font-size: 0.7rem;
  font-weight: 700;
  color: #888;
  letter-spacing: 1px;
}
</style>