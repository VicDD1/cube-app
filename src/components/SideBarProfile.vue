<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/useStore'
import { useRouter, useRoute } from 'vue-router'

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

// Transforme "Emmanuel Lana" en "emmanuel l."
const displayName = computed(() => {
  if (!appStore.user) return 'Utilisateur'
  const prenom = appStore.user.prenomClient.toLowerCase()
  const nomInitial = appStore.user.nomClient.charAt(0).toLowerCase()
  return `${prenom} ${nomInitial}.`
})

const logout = () => {
  appStore.logout()
  router.push('/')
}

const menuItems = [
  { label: 'TABLEAU DE BORD', path: '/profil', id: 'dashboard' },
  { label: 'MON PROFIL', path: '/profil/infos', id: 'profile' },
  { label: 'MES COMMANDES', path: '/profil/commandes', id: 'orders' },
  { label: 'MES ADRESSES', path: '/profil/adresses', id: 'addresses' },
  { label: 'MES VÉLOS', path: '/profil/velos', id: 'bikes' },
]
</script>

<template>
  <aside class="sidebar-profil">
    <div class="user-greeting">
      <p class="welcome-text">Bienvenue</p>
      <h2 class="user-name">{{ displayName }}</h2>
      <button @click="logout" class="logout-link">Se déconnecter</button>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li v-for="item in menuItems" :key="item.id">
          <router-link :to="item.path" class="nav-item" :class="{ 'active': route.path === item.path }">
            {{ item.label }}
            <span v-if="route.path === item.path" class="active-arrow">›</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <button class="btn-secondary">ANONYMISER MON COMPTE</button>
      <button class="btn-danger">SUPPRIMER MON COMPTE</button>
    </div>
  </aside>
</template>
<style scoped>
.sidebar-profil {
  width: 375px;
  background-color: #0b0b0b;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px 30px;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}

/* BIENVENUE & DECONNEXION */
.user-greeting {
  margin-bottom: 50px;
}

.user-name {
  font-size: 2.2rem;
  font-weight: 900;
  font-style: italic;
  text-transform: lowercase;
  margin: 5px 0;
}

.logout-link {
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  font-style: italic;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

/* NAVIGATION : On enlève les puces (points) */
.sidebar-nav ul {
  list-style: none; /* Crucial pour enlever les points bleus */
  padding: 0;
  margin: 30px 0;
}

.nav-item {
  display: flex;
  justify-content: space-between;
  padding: 18px 0;
  color: #fff;
  text-decoration: none;
  font-weight: 900;
  font-style: italic;
  font-size: 1.1rem;
  border-bottom: 1px solid #1a1a1a;
}

.nav-item.active {
  color: #ff3333;
}

/* BOUTONS DU BAS */
.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-secondary, .btn-danger {
  width: 100%;
  padding: 15px;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  border: none;
  clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%);
}

.btn-secondary { background: #1a1a1a; color: #888; }
.btn-danger { background: #cc0000; color: #fff; }
</style>