<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/useStore'
import { useRouter, useRoute } from 'vue-router'

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')

const displayName = computed(() => {
  if (!appStore.user) return 'Utilisateur'
  const prenom = appStore.user.prenomClient?.toLowerCase() || ''
  const nomInitial = appStore.user.nomClient?.charAt(0).toLowerCase() || ''
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
  { label: 'MES ADRESSES', path: '/profil/adresses', id: 'addresses' }
]

const openDeleteModal = () => {
  showDeleteModal.value = true
  deleteError.value = ''
}

const closeDeleteModal = () => {
  if (isDeleting.value) return 
  showDeleteModal.value = false
}

const confirmDelete = async () => {
  if (!appStore.user || !appStore.user.idClient) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/DeleteClient/${appStore.user.idClient}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      throw new Error("Impossible de supprimer le compte. Veuillez réessayer plus tard.")
    }

    showDeleteModal.value = false
    appStore.logout()
    router.push('/')
    
  } catch (err) {
    deleteError.value = err.message
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="sidebar-profil">
    
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
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <button class="btn-danger" @click="openDeleteModal">SUPPRIMER MON COMPTE</button>
    </div>
    
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content">
        <h3>ATTENTION</h3>
        <p class="warning-text">
          Êtes-vous sûr(e) de vouloir supprimer votre compte ?<br>
          <strong>Cette action est irréversible et vous perdrez l'intégralité de vos données.</strong>
        </p>
        
        <p v-if="deleteError" class="error-msg">{{ deleteError }}</p>
        
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeDeleteModal" :disabled="isDeleting">
            ANNULER
          </button>
          <button class="btn-confirm-delete" @click="confirmDelete" :disabled="isDeleting">
            {{ isDeleting ? 'SUPPRESSION...' : 'OUI, SUPPRIMER' }}
          </button>
        </div>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.sidebar-profil {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 50px 30px 40px 30px; 
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  color: #fff;
}

.user-greeting {
  margin-bottom: 50px;
}

.welcome-text {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 5px;
}

.user-name {
  font-size: 2.2rem;
  font-weight: 900;
  font-style: italic;
  text-transform: lowercase;
  margin: 0 0 10px 0;
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
  transition: color 0.2s;
}
.logout-link:hover { color: #fff; }

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: block;
  padding: 18px 0;
  color: #fff;
  text-decoration: none;
  font-weight: 900;
  font-style: italic;
  font-size: 1.1rem;
  border-bottom: 1px solid #1a1a1a;
  transition: color 0.2s;
}

.nav-item:hover { color: #ff3333; }
.nav-item.active { color: #ff3333; }

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
  transition: background 0.2s, color 0.2s;
}

.btn-secondary { background: #1a1a1a; color: #888; }
.btn-secondary:hover { background: #222; color: #fff; }

.btn-danger { background: #cc0000; color: #fff; }
.btn-danger:hover { background: #aa0000; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #111;
  border-top: 5px solid #cc0000;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: fadeInModal 0.3s ease-out;
}

@keyframes fadeInModal {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-content h3 {
  color: #fff;
  font-weight: 900;
  font-style: italic;
  font-size: 1.6rem;
  margin: 0 0 15px 0;
  letter-spacing: 1px;
}

.warning-text {
  color: #aaa;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 30px;
}

.warning-text strong {
  color: #cc0000;
  display: block;
  margin-top: 15px;
  font-weight: 800;
}

.error-msg {
  color: #ff3333;
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 20px;
  background: rgba(204, 0, 0, 0.1);
  padding: 10px;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-cancel {
  background: transparent;
  border: 2px solid #444;
  color: #aaa;
  padding: 12px 20px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}
.btn-cancel:hover:not(:disabled) {
  border-color: #fff;
  color: #fff;
}

.btn-confirm-delete {
  background: #cc0000;
  color: #fff;
  border: none;
  padding: 12px 20px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}
.btn-confirm-delete:hover:not(:disabled) {
  background: #ff3333;
}

.btn-confirm-delete:disabled, .btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>