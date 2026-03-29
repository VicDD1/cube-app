<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()

const loading = ref(false)
const feedback = ref('')
const isError = ref(false)

const form = reactive({
  nomClient: '',
  prenomClient: '',
  emailClient: '',
  dateNaissance: '',
  tel: ''
})

onMounted(() => {
  if (appStore.user) {
    form.nomClient = appStore.user.nomClient || ''
    form.prenomClient = appStore.user.prenomClient || ''
    form.emailClient = appStore.user.emailClient || ''
    form.dateNaissance = appStore.user.dateNaissance ? appStore.user.dateNaissance.split('T')[0] : ''
    form.tel = appStore.user.tel || ''
  }
})

const handleUpdate = async () => {
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
      tel: String(form.tel || "").replace(/\s/g, "")
    }

    const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/PutClient/${appStore.user.idClient}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })

    if (!res.ok) throw new Error("Erreur lors de la mise à jour.")

    appStore.user = updatedUser
    localStorage.setItem('user', JSON.stringify(updatedUser))

    isError.value = false
    feedback.value = "Vos informations ont été mises à jour avec succès !"

    setTimeout(() => { feedback.value = '' }, 4000)

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
          <input type="text" v-model="form.nomClient" required>
        </div>
        <div class="field-group">
          <label>PRÉNOM</label>
          <input type="text" v-model="form.prenomClient" required>
        </div>
      </div>

      <div class="row">
        <div class="field-group">
          <label>DATE DE NAISSANCE</label>
          <input type="date" v-model="form.dateNaissance" required>
        </div>
        <div class="field-group">
          <label>TÉLÉPHONE</label>
          <input type="tel" v-model="form.tel" placeholder="06 00 00 00 00">
        </div>
      </div>

      <div class="field-group">
        <label>ADRESSE E-MAIL</label>
        <input type="email" v-model="form.emailClient" required>
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
  font-weight: 800;
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
  font-weight: 800;
  text-align: center;
}

.error { background-color: #fee2e2; color: #dc2626; border-left: 4px solid #dc2626; }
.success { background-color: #ecfdf5; color: #059669; border-left: 4px solid #059669; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 600px) {
  .row { flex-direction: column; gap: 20px; }
  .btn-save { width: 100%; }
}
</style>