<template>
  <main class="connexion-page">
    <div class="auth-card">
      <header class="card-header">
        <h1>CRÉER UN COMPTE</h1>
        <div class="separator"></div>
      </header>
      
      <form @submit.prevent="handleRegistration">
        <div class="row">
          <div class="field-group">
            <label>NOM</label>
            <input type="text" v-model="form.nom" placeholder="DUPONT" required>
          </div>
          <div class="field-group">
            <label>PRÉNOM</label>
            <input type="text" v-model="form.prenomClient" placeholder="JEAN" required>
          </div>
        </div>

        <div class="field-group">
          <label>DATE DE NAISSANCE</label>
          <input type="date" v-model="form.dateNaissance" required>
        </div>

        <div class="field-group">
          <label>ADRESSE EMAIL</label>
          <input type="email" v-model="form.email" placeholder="NOM@EXEMPLE.COM" required>
        </div>

        <div class="field-group">
          <label>MOT DE PASSE</label>
          <input type="password" v-model="form.password" placeholder="••••••••" required>
        </div>

        <div class="field-group">
          <label>TÉLÉPHONE</label>
          <input type="tel" v-model="form.telephone" placeholder="06 00 00 00 00">
        </div>

        <div class="field-group">
          <label>ADRESSE</label>
          <input type="text" v-model="form.adresse" placeholder="123 RUE DE CUBE, 74000 ANNECY">
        </div>

        <transition name="fade">
          <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">
            {{ feedback }}
          </div>
        </transition>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'ENREGISTREMENT...' : 'S\'INSCRIRE MAINTENANT' }}
        </button>
      </form>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({
  nom: '',
  prenomClient: '',
  dateNaissance: '',
  email: '',
  password: '',
  telephone: '',
  adresse: ''
});

const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

const API_URL = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/PostClient';

const handleRegistration = async () => {
  loading.value = true;
  feedback.value = '';
  isError.value = false;

  // 1. Formatage strict pour DateOnly (YYYY-MM-DD uniquement)
  // L'input type="date" donne déjà ce format, on s'assure juste qu'il est propre.
  const dateOnlyValue = form.dateNaissance; 

  const clientData = {
    nom: form.nom,
    prenomClient: form.prenomClient,
    dateNaissance: dateOnlyValue, // Envoi de "YYYY-MM-DD" sans l'heure
    email: form.email,
    password: form.password,
    telephone: form.telephone || "",
    adresse: form.adresse || "",
    role: "client",
    dateInscription: new Date().toISOString().split('T')[0] // Version DateOnly aussi pour l'inscription
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json' 
      },
      // IMPORTANT: Si l'erreur persiste sur le champ "client", 
      // essayez d'envelopper l'objet comme ceci : body: JSON.stringify({ client: clientData })
      body: JSON.stringify(clientData)
    });

    if (response.ok) {
      feedback.value = "BIENVENUE ! VOTRE COMPTE A ÉTÉ CRÉÉ.";
      Object.keys(form).forEach(key => form[key] = '');
    } else {
      isError.value = true;
      const errorJson = await response.json();
      console.log("Détails Erreurs:", errorJson.errors);
      feedback.value = "ERREUR DE VALIDATION : VÉRIFIEZ LE FORMAT DES CHAMPS.";
    }
  } catch (err) {
    isError.value = true;
    feedback.value = "ERREUR RÉSEAU : L'API EST INACCESSIBLE.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@font-face {
  font-family: 'CubeFont';
  src: url('@/assets/fonts/font.woff2') format('woff2');
}

.connexion-page {
  padding-top: 140px; 
  padding-bottom: 80px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f4;
  font-family: 'CubeFont', sans-serif;
}

.auth-card {
  background: #fff;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  border-top: 5px solid #000;
}

.card-header h1 {
  font-size: 22px;
  font-weight: 800;
  font-style: italic;
  margin: 0;
  text-align: center;
}

.separator {
  width: 40px;
  height: 4px;
  background: #00a8e8;
  margin: 15px auto 30px auto;
}

.row {
  display: flex;
  gap: 15px;
}

.field-group {
  margin-bottom: 18px;
  flex: 1;
}

label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 6px;
  color: #555;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  font-family: 'CubeFont', sans-serif;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
  background: #fcfcfc;
}

/* Style spécifique pour l'input date pour qu'il garde la police */
input[type="date"] {
  font-family: 'CubeFont', sans-serif;
  text-transform: uppercase;
}

input:focus {
  border-color: #00a8e8;
  background: #fff;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background-color: #000;
  color: #fff;
  border: none;
  font-family: 'CubeFont', sans-serif;
  font-weight: 800;
  font-style: italic;
  cursor: pointer;
  margin-top: 10px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #00a8e8;
}

.message {
  margin-bottom: 20px;
  padding: 12px;
  font-size: 12px;
  text-align: center;
  font-weight: 800;
}

.error { background-color: #fee2e2; color: #dc2626; border: 1px solid #dc2626; }
.success { background-color: #ecfdf5; color: #059669; border: 1px solid #059669; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .row { flex-direction: column; gap: 0; }
}
</style>