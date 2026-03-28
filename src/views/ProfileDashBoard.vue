<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()

// On sécurise l'affichage au cas où la page charge avant le store
const user = computed(() => appStore.user || {
  nomClient: 'OPRINSEN',
  prenomClient: 'Tristan',
  emailClient: 'tristanoprinsenlachenal@gmail.com'
})
</script>

<template>
  <div class="dashboard-container">
    
    <div class="cards-grid">
      
      <div class="dash-card">
        <h3>MON PROFIL</h3>
        
        <h4 class="full-name">{{ user.prenomClient }} {{ user.nomClient?.toUpperCase() }}</h4>
        
        <div class="info-list">
          <div class="info-row">
            <span class="label">NOM :</span>
            <span class="value">{{ user.nomClient?.toUpperCase() }}</span>
          </div>
          <div class="info-row">
            <span class="label">PRÉNOM :</span>
            <span class="value">{{ user.prenomClient }}</span>
          </div>
          <div class="info-row">
            <span class="label">E-MAIL :</span>
            <span class="value">{{ user.emailClient?.toLowerCase() }}</span>
          </div>
        </div>

        <router-link to="/profil/infos" class="edit-link">
          Modifier mes informations
        </router-link>
      </div>

      <div class="dash-card flex-center">
        <h3>MES COMMANDES <span class="help-circle">?</span></h3>
        
        <div class="card-content-center">
          <router-link to="/profil/commandes" class="red-link">
            → Voir toutes mes commandes
          </router-link>
        </div>
      </div>

      <div class="dash-card flex-center">
        <h3>MES ADRESSES</h3>
        
        <div class="card-content-center">
          <router-link to="/profil/adresses" class="red-link">
            → Gérer mes adresses
          </router-link>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.cards-grid {
  display: flex;
  gap: 30px;
  flex-wrap: wrap; 
}

/* --- STYLE DES CARTES --- */
.dash-card {
  background: #fff;
  flex: 1;
  min-width: 300px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
}

.dash-card h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
}

.help-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #00a8e8;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-style: normal;
  font-weight: bold;
  cursor: help;
}

/* --- CARTE PROFIL --- */
.full-name {
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 30px 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #888;
  letter-spacing: 1px;
}

.value {
  font-size: 0.9rem;
  font-weight: 800;
  color: #111;
}

.edit-link {
  margin-top: auto;
  font-size: 0.85rem;
  color: #888;
  text-decoration: underline;
  font-style: italic;
  transition: color 0.2s;
}

.edit-link:hover {
  color: #000;
}

/* --- CARTES COMMANDES & ADRESSES --- */
.flex-center {
  display: flex;
  flex-direction: column;
}

.card-content-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.red-link {
  color: #cc0000;
  font-weight: 800;
  font-size: 1rem;
  text-decoration: none;
  transition: color 0.2s;
}

.red-link:hover {
  color: #990000;
  text-decoration: underline;
}
</style>