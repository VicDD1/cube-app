<script setup>
import { reactive, ref } from 'vue'
import { User, Mail, Lock, Phone, MapPin, Send, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

// Modèle de données strict pour correspondre à ton objet Client en C#
const form = reactive({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  adresse: '',
  motDePasse: '',
  // Les champs 'role' et 'dateInscription' seront gérés par le serveur
})

const loading = ref(false)
const status = ref({ type: '', message: '' })

const handleRegister = async () => {
  loading.value = true
  status.value = { type: '', message: '' }

  try {
    // Utilisation de PostClient comme indiqué dans tes contrôleurs
    const response = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/PostClient', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(form)
    })

    if (response.ok) {
      status.value = { type: 'success', message: 'Inscription réussie ! Votre profil est prêt.' }
      // Reset du formulaire après succès
      Object.assign(form, { nom: '', prenom: '', email: '', telephone: '', adresse: '', motDePasse: '' })
    } else {
      const errorText = await response.text()
      status.value = { type: 'error', message: `Erreur ${response.status}: Impossible de créer le compte.` }
    }
  } catch (err) {
    status.value = { type: 'error', message: 'Erreur réseau : Vérifiez votre connexion à l\'API Azure.' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="cube-accent"></div>
        <h2>INSCRIPTION CLIENT</h2>
        <p>Accédez à l'univers CUBE et gérez vos vélos et équipements.</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-grid">
          <div class="input-group">
            <label><User :size="14" /> NOM</label>
            <input v-model="form.nom" type="text" placeholder="Ex: SCHMIDT" required />
          </div>

          <div class="input-group">
            <label><User :size="14" /> PRÉNOM</label>
            <input v-model="form.prenom" type="text" placeholder="Ex: Hans" required />
          </div>

          <div class="input-group full">
            <label><Mail :size="14" /> EMAIL</label>
            <input v-model="form.email" type="email" placeholder="votre@email.com" required />
          </div>

          <div class="input-group">
            <label><Phone :size="14" /> TÉLÉPHONE</label>
            <input v-model="form.telephone" type="tel" placeholder="+33..." />
          </div>

          <div class="input-group">
            <label><MapPin :size="14" /> ADRESSE</label>
            <input v-model="form.adresse" type="text" placeholder="Ville ou adresse complète" />
          </div>

          <div class="input-group full">
            <label><Lock :size="14" /> MOT DE PASSE</label>
            <input v-model="form.motDePasse" type="password" placeholder="Minimum 6 caractères" required />
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">CRÉER MON COMPTE</span>
          <span v-else>COMMUNICATION AVEC AZURE...</span>
          <Send v-if="!loading" :size="18" />
        </button>
      </form>

      <Transition name="slide-up">
        <div v-if="status.message" :class="['status-msg', status.type]">
          <AlertCircle v-if="status.type === 'error'" :size="18" />
          <CheckCircle2 v-else :size="18" />
          {{ status.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@font-face {
  font-family: 'CubeFont'; /* Le nom que tu donneras à ta police */
  src: url('@/assets/fonts/font.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

:root {
  /* On définit la police par défaut pour tout le site */
  font-family: 'CubeFont', Arial, sans-serif;
}
.page-container {
  min-height: 100vh;
  background-color: #111;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 140px 20px 80px;
  /* Utilisation explicite ici si besoin */
  font-family: 'CubeFont', sans-serif;
}

.auth-card {
  background: #fff;
  width: 100%;
  max-width: 600px;
  padding: 50px;
  border-top: 4px solid #00a8e8;
}

.cube-accent {
  width: 40px;
  height: 4px;
  background: #000;
  margin-bottom: 20px;
}

.auth-header h2 {
  font-family: 'CubeFont', sans-serif; /* Applique la police au titre */
  font-weight: 900;
  font-style: italic; /* Très commun pour le style Cube */
  font-size: 28px;
  color: #000;
  text-transform: uppercase;
}

.auth-header p {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 35px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}

.full { grid-column: span 2; }

.input-group label {
  font-family: 'CubeFont', sans-serif;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.5px;
}

input {
  font-family: 'CubeFont', sans-serif; /* Pour que ce que l'utilisateur tape soit aussi dans la police */
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
}

input:focus {
  outline: none;
  border-color: #00a8e8;
  background: #fff;
}

.submit-btn {
  width: 100%;
  margin-top: 40px;
  background: #000;
  color: #fff;
  border: none;
  padding: 18px;
  font-family: 'CubeFont', sans-serif;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #00a8e8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-msg {
  margin-top: 25px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 14px;
}

.error { background: #fee2e2; color: #b91c1c; border-left: 4px solid #b91c1c; }
.success { background: #ecfdf5; color: #047857; border-left: 4px solid #047857; }

/* Transitions */
.slide-up-enter-active { transition: all 0.3s ease-out; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
</style>