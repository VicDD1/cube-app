<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()

// --- GESTION CONNEXION ADMIN ---
const isAuthenticated = ref(false)
const username = ref('')
const password = ref('')
const loginError = ref(false)

const handleLogin = () => {
  if (username.value === 'admin' && password.value === 'admin') {
    isAuthenticated.value = true
    loginError.value = false
  } else {
    loginError.value = true
  }
}

const logout = () => {
  isAuthenticated.value = false
  username.value = ''
  password.value = ''
}

// --- GESTION HISTORIQUE ---
const isOpen = ref(true)

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const reversedLog = computed(() => {
  return [...(appStore.activityLog || [])].reverse()
})

const clearLog = () => {
  appStore.activityLog = []
  localStorage.removeItem('cube_activity_log')
}
</script>

<template>
  <div class="admin-page">
    
    <div v-if="!isAuthenticated" class="login-container">
      <div class="login-box">
        <h2>ACCÈS ADMINISTRATEUR</h2>
        
        <div class="input-group">
          <label>Identifiant</label>
          <input v-model="username" type="text" placeholder="admin" @keyup.enter="handleLogin" />
        </div>
        
        <div class="input-group">
          <label>Mot de passe</label>
          <input v-model="password" type="password" placeholder="admin" @keyup.enter="handleLogin" />
        </div>

        <p v-if="loginError" class="error-msg">Identifiants incorrects.</p>

        <button class="btn-primary" @click="handleLogin">SE CONNECTER</button>
      </div>
    </div>

    <div v-else class="admin-dashboard">
      <div class="dashboard-header">
        <h2>TABLEAU DE BORD</h2>
        <button class="btn-logout" @click="logout">DÉCONNEXION</button>
      </div>

      <div class="log-container">
        <div class="accordion-item">
          
          <div class="accordion-header" @click="isOpen = !isOpen">
            <div class="title-wrapper">
              <span class="icon">{{ isOpen ? '▼' : '▶' }}</span>
              <h3>HISTORIQUE DE NAVIGATION DES UTILISATEURS</h3>
            </div>
            <span class="badge">{{ appStore.activityLog?.length || 0 }} pages visitées</span>
          </div>

          <div class="accordion-body" :class="{ 'is-open': isOpen }">
            <div class="content-inner">
                
              <div class="actions-bar">
                <button @click="clearLog" class="btn-clear">EFFACER L'HISTORIQUE</button>
              </div>

              <div v-if="!appStore.activityLog || appStore.activityLog.length === 0" class="empty-state">
                Aucune activité enregistrée pour le moment.
              </div>

              <ul v-else class="log-list">
                <li v-for="(entry, index) in reversedLog" :key="index" class="log-row">
                  <div class="log-info">
                    <span class="log-path">{{ entry.path }}</span>
                    <span class="log-date">{{ formatDate(entry.timestamp) }}</span>
                  </div>
                  <div class="log-time">
                    <span class="time-badge">{{ formatTime(entry.timeSpentInSeconds) }}</span>
                  </div>
                </li>
              </ul>

            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.admin-page {
  min-height: 80vh;
  padding: 60px 20px;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

/* --- LOGIN --- */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.login-box {
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-box h2 {
  margin-top: 0;
  margin-bottom: 30px;
  font-weight: 900;
  font-style: italic;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #555;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.error-msg {
  color: #ff4444;
  font-size: 0.85rem;
  margin-bottom: 20px;
  font-weight: bold;
}

.btn-primary {
  width: 100%;
  background: #00a8e8;
  color: #fff;
  border: none;
  padding: 15px;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  cursor: pointer;
  clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%);
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #008fbb;
}

/* --- DASHBOARD --- */
.admin-dashboard {
  max-width: 900px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h2 {
  font-weight: 900;
  font-style: italic;
  margin: 0;
}

.btn-logout {
  background: #333;
  color: #fff;
  border: none;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
}

.log-container {
  border: 1px solid #ddd;
  background: #fff;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-wrapper h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  color: #00a8e8;
}

.badge {
  background: #00a8e8;
  color: #fff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
}

.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-in-out;
  background: #fafafa;
}

.accordion-body.is-open {
  grid-template-rows: 1fr;
}

.content-inner {
  overflow: hidden;
}

.actions-bar {
  padding: 10px 20px;
  text-align: right;
  border-bottom: 1px solid #eee;
}

.btn-clear {
  background: none;
  border: none;
  color: #ff4444;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-clear:hover { text-decoration: underline; }

.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 500px;
  overflow-y: auto;
}

.log-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.log-path {
  font-weight: bold;
  color: #333;
  display: block;
}

.log-date {
  font-size: 0.8rem;
  color: #888;
}

.time-badge {
  background: #e0f4fc;
  color: #00a8e8;
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.85rem;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #888;
}
</style>