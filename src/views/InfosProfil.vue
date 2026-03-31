<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()

const loading = ref(false)
const feedback = ref('')
const isError = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

const googleId = ref(null)

// Objet pour stocker les erreurs de validation
const errors = reactive({})

const form = reactive({
  nomClient: '',
  prenomClient: '',
  emailClient: '',
  dateNaissance: '',
  tel: '',
  doubleAuth: false 
})

onMounted(() => {
  if (appStore.user) {
    form.nomClient = appStore.user.nomClient || ''
    form.prenomClient = appStore.user.prenomClient || ''
    form.emailClient = appStore.user.emailClient || ''
    form.dateNaissance = appStore.user.dateNaissance ? appStore.user.dateNaissance.split('T')[0] : ''
    form.tel = appStore.user.tel || ''
    form.doubleAuth = !!appStore.user.doubleAuth 
    googleId.value = appStore.user.googleId || null
  }
})

// --- LOGIQUE DE VALIDATION ---
const validateProfile = () => {
  // Réinitialiser les erreurs
  Object.keys(errors).forEach(key => delete errors[key])
  let isValid = true

  // Validation Nom / Prénom
  if (!form.nomClient || form.nomClient.trim().length < 2) {
    errors.nomClient = "Le nom doit contenir au moins 2 caractères."
    isValid = false
  }
  if (!form.prenomClient || form.prenomClient.trim().length < 2) {
    errors.prenomClient = "Le prénom doit contenir au moins 2 caractères."
    isValid = false
  }

  // Validation Date de Naissance (18 ans min)
  if (!form.dateNaissance) {
    errors.dateNaissance = "La date de naissance est requise."
    isValid = false
  } else {
    const birthDate = new Date(form.dateNaissance)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      errors.dateNaissance = "Vous devez avoir au moins 18 ans."
      isValid = false
    }
  }

  // Validation Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.emailClient || !emailRegex.test(form.emailClient)) {
    errors.emailClient = "Veuillez entrer une adresse email valide."
    isValid = false
  }

  // Validation Téléphone (si rempli)
  const phoneRegex = /^(0|\+33|0033)[1-9]([-. ]?[0-9]{2}){4}$/
  if (form.tel && form.tel.trim() !== '' && !phoneRegex.test(form.tel.trim())) {
    errors.tel = "Format invalide (ex: 06 12 34 56 78)."
    isValid = false
  }

  if (newPassword.value) {
    // Si l'utilisateur a commencé à taper un mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    
    if (!passwordRegex.test(newPassword.value)) {
      errors.newPassword = "8 car. min, 1 Maj, 1 Min, 1 Chiffre, 1 Spécial."
      isValid = false
    }

    if (newPassword.value !== confirmPassword.value) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas."
      isValid = false
    }
  }

  return isValid
}

const handleUpdate = async () => {
  if (!validateProfile()) {
    isError.value = true
    feedback.value = "VEUILLEZ CORRIGER LES ERREURS."
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  loading.value = true
  feedback.value = 'Mise à jour en cours...'
  isError.value = false

  try {
    const updatedUser = {
      ...appStore.user,
      nomClient: form.nomClient.trim().toUpperCase(),
      prenomClient: form.prenomClient.trim(),
      emailClient: form.emailClient.trim().toLowerCase(),
      dateNaissance: form.dateNaissance,
      tel: String(form.tel || "").replace(/\s/g, ""),
      doubleAuth: form.doubleAuth,
      googleId: googleId.value
    }

    if (newPassword.value) {
      updatedUser.mdp = newPassword.value
    }

    const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/PutClient/${appStore.user.idClient}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })

    if (!res.ok) throw new Error("Erreur lors de la mise à jour.")

    appStore.user = { ...updatedUser }
    delete appStore.user.mdp 
    localStorage.setItem('user', JSON.stringify(appStore.user))

    newPassword.value = ''
    confirmPassword.value = ''

    isError.value = false
    feedback.value = "Vos informations ont été mises à jour avec succès !"
  } catch (err) {
    isError.value = true
    feedback.value = err.message || "Impossible de mettre à jour le profil."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="infos-container">
    <div class="header-section">
      <h2>MON PROFIL</h2>
      <p>Modifiez vos informations personnelles ci-dessous.</p>
      <div class="separator"></div>
    </div>

    <form @submit.prevent="handleUpdate" class="profil-form">
      
      <div class="row">
        <div class="field-group">
          <label>NOM</label>
          <input type="text" v-model="form.nomClient" :class="{ 'input-error': errors.nomClient }">
          <span class="field-error" v-if="errors.nomClient">{{ errors.nomClient }}</span>
        </div>
        <div class="field-group">
          <label>PRÉNOM</label>
          <input type="text" v-model="form.prenomClient" :class="{ 'input-error': errors.prenomClient }">
          <span class="field-error" v-if="errors.prenomClient">{{ errors.prenomClient }}</span>
        </div>
      </div>

      <div class="row">
        <div class="field-group">
          <label>DATE DE NAISSANCE</label>
          <input type="date" v-model="form.dateNaissance" :class="{ 'input-error': errors.dateNaissance }">
          <span class="field-error" v-if="errors.dateNaissance">{{ errors.dateNaissance }}</span>
        </div>
        <div class="field-group">
          <label>TÉLÉPHONE</label>
          <input type="tel" v-model="form.tel" :class="{ 'input-error': errors.tel }" placeholder="06 00 00 00 00">
          <span class="field-error" v-if="errors.tel">{{ errors.tel }}</span>
        </div>
      </div>

      <div class="field-group">
        <label>ADRESSE E-MAIL</label>
        <input type="email" v-model="form.emailClient" :class="{ 'input-error': errors.emailClient }">
        <span class="field-error" v-if="errors.emailClient">{{ errors.emailClient }}</span>
      </div>

      <div class="password-change-section" v-if="!googleId">
        <p class="section-title">CHANGER LE MOT DE PASSE (Optionnel)</p>
        <div class="row">
          <div class="field-group">
            <label>NOUVEAU MOT DE PASSE</label>
            <div class="input-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="newPassword" 
                :class="{ 'input-error': errors.newPassword }"
                placeholder="Optionnel"
              >

            </div>
            <span class="field-error" v-if="errors.newPassword">{{ errors.newPassword }}</span>
          </div>

          <div class="field-group">
            <label>CONFIRMER LE MOT DE PASSE</label>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="confirmPassword" 
              :class="{ 'input-error': errors.confirmPassword }"
            >
            <span class="field-error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
          </div>
        </div>
      </div>

      <div class="a2f-section">
        <div class="checkbox-group">
          <input 
            type="checkbox" 
            id="a2f-toggle" 
            v-model="form.doubleAuth"
          >
          <label for="a2f-toggle">
            Activer l'authentification à deux facteurs (A2F)
          </label>
        </div>
        <p class="help-text">
          Ajoutez une couche de sécurité supplémentaire à votre compte.
        </p>
      </div>

      <transition name="fade">
        <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">
          {{ feedback }}
        </div>
      </transition>

      <div class="actions">
        <button type="submit" :disabled="loading" class="btn-save">
          {{ loading ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS' }}
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>

.infos-container {
  background: #fff;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  animation: fadeIn 0.4s ease-out;
  max-width: 800px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-section h2 {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  text-transform: uppercase;
}

.header-section p {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.separator {
  width: 50px;
  height: 4px;
  background: #00a8e8;
  margin-bottom: 40px;
}

.profil-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.row {
  display: flex;
  gap: 20px;
}

.field-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

label {
  font-size: 0.75rem;
  font-weight: 900;
  margin-bottom: 8px;
  color: #555;
  letter-spacing: 1px;
}

input {
  padding: 15px;
  border: 1px solid #ddd;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  background: #fcfcfc;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

input:focus {
  border-color: #000;
  background: #fff;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  background-color: #000;
  color: #fff;
  border: none;
  padding: 16px 30px;
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%);
}

.btn-save:hover:not(:disabled) {
  background-color: #00a8e8;
}

.btn-save:disabled {
  background-color: #888;
  cursor: not-allowed;
}

.message {
  padding: 15px;
  font-size: 0.85rem;
  font-weight: 900;
  text-align: center;
}

.a2f-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-group label {
  font-weight: 900;
  margin: 0;
  cursor: pointer;
}

.help-text {
  font-size: 0.85rem;
  color: #666;
  margin-top: 5px;
  margin-left: 28px;
}

.error { background-color: #fee2e2; color: #dc2626; border-left: 4px solid #dc2626; }
.success { background-color: #ecfdf5; color: #059669; border-left: 4px solid #059669; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- NOUVELLES CLASSES POUR LES ERREURS --- */
.field-error {
  display: block;
  color: #dc2626;
  font-size: 0.65rem;
  margin-top: 6px;
  font-weight: 900;
  text-transform: uppercase;
}

.input-error {
  border-color: #dc2626 !important;
  background-color: #fef2f2 !important;
}

.input-error:focus {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.password-change-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
}

.section-title {
  font-size: 0.7rem;
  font-weight: 900;
  color: #888;
  margin-bottom: 15px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #00a8e8;
  font-size: 10px;
  font-weight: 900;
  cursor: pointer;
}

@media (max-width: 600px) {
  .row { flex-direction: column; gap: 20px; }
  .btn-save { width: 100%; }
}
</style>