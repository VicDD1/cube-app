<template>
  <div class="profile-layout">
    
    <aside class="sidebar-wrapper">
      <SideBarProfile />
    </aside>

    <main class="main-viewport">
      <div class="breadcrumb">ACCUEIL > VOTRE COMPTE</div>
      
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
    
  </div>
</template>

<script setup>
import SideBarProfile from '../components/SideBarProfile.vue'
import { onMounted } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()

onMounted(() => {
  appStore.loadPersistedStore()
})
</script>

<style scoped>
.profile-layout {
  display: flex;
  width: 100%;
  margin-top: 95px; 
  min-height: calc(100vh - 95px); 
  background-color: #f2f2f2;
  align-items: stretch; 
}

.sidebar-wrapper {
  width: 375px;
  flex-shrink: 0;
  background-color: #0b0b0b;
}

.main-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 60px; 
}

.breadcrumb {
  font-size: 0.7rem;
  font-weight: 700;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 40px; 
  flex-shrink: 0; 
}

.content-wrapper {
  width: 100%;
  max-width: 1400px;
  margin-top: auto;
  margin-bottom: auto;
}
</style>