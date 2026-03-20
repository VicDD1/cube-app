<template>
  <div class="dashboard-grid">
    <div class="card">
      <div class="card-header">
        <h2>MON PROFIL</h2>
      </div>
      <div class="card-content flex-start">
        <p class="user-full-name">{{ appStore.user?.prenomClient }} {{ appStore.user?.nomClient }}</p>
        
        <div class="info-row">
          <span class="label">NOM :</span>
          <span class="value uppercase">{{ appStore.user?.nomClient }}</span>
        </div>
        <div class="info-row">
          <span class="label">PRÉNOM :</span>
          <span class="value">{{ appStore.user?.prenomClient }}</span>
        </div>
        <div class="info-row">
          <span class="label">E-MAIL :</span>
          <span class="value">{{ appStore.user?.emailClient }}</span>
        </div>
        
        <router-link to="/profil/infos" class="edit-link">Modifier mes informations</router-link>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>MES COMMANDES <span class="help-icon">?</span></h2>
      </div>
      <div class="card-content centered">
        <router-link to="/profil/commandes" class="action-link red">
          <span class="arrow">→</span> Voir toutes mes commandes
        </router-link>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>MES VÉLOS <span class="help-icon">?</span></h2>
      </div>
      <div class="card-content centered">
        <p class="empty-text">Vous n'avez pas enregistré de vélo</p>
        <router-link to="/profil/velos" class="register-link">Enregistrer un vélo</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '../stores/useStore'
const appStore = useAppStore()
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  width: 100%;
}

.card {
  background: #ffffff;
  padding: 35px;
  height: 100%; 
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  box-sizing: border-box; 
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 900;
  font-style: italic;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
}

.help-icon {
  background: #00bcd4;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-weight: bold;
}

.card-content.centered {
  flex: 1; /* Prend tout l'espace restant dans la carte */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centre verticalement dans l'espace restant */
  align-items: center;     /* Centre horizontalement */
  text-align: center;
}

/* On fait de même pour la carte Profil pour garder un alignement cohérent */
.card-content.flex-start {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; /* Pour que les infos du profil soient aussi centrées verticalement */
}

.user-full-name {
  font-weight: 700;
  margin-bottom: 25px;
  font-size: 1.1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
}

.label {
  color: #999;
  font-weight: 700;
}

.value {
  font-weight: 800;
  color: #000;
}

.uppercase { text-transform: uppercase; }

.edit-link {
  margin-top: auto; /* Pousse le lien vers le bas */
  padding-top: 20px;
  color: #666;
  font-size: 0.85rem;
  text-decoration: underline;
}

.action-link.red {
  color: #cc0000;
  font-weight: 800;
  text-decoration: none;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.empty-text {
  color: #888;
  font-size: 0.95rem;
  margin-bottom: 25px;
}

.register-link {
  color: #000;
  font-weight: 900;
  text-transform: uppercase;
  text-decoration: none;
  border-bottom: 3px solid #cc0000; /* Ligne rouge épaisse comme Cube */
  padding-bottom: 2px;
  font-size: 1rem;
}

.sub-text {
  color: #888;
  font-size: 1rem;
}
</style>