<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()
const adresses = ref([])
const loading = ref(true)
const error = ref('')

const showModal = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const form = reactive({
  prenom: '',
  nom: '',
  rue: '',
  cp: '',
  ville: '',
  pays: 'France'
})

const suggestions = ref([])

const onAddressInput = async (query) => {
  if (!query || query.length < 4) {
    suggestions.value = []
    return
  }
  try {
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`)
    const data = await response.json()
    suggestions.value = data.features
  } catch (err) {
    console.error("Erreur API Adresse:", err)
  }
}

const selectAdresse = (feature) => {
  form.rue = feature.properties.name
  form.cp = feature.properties.postcode
  form.ville = feature.properties.city
  suggestions.value = [] 
}

const openModal = () => {
  form.prenom = appStore.user?.prenomClient || ''
  form.nom = appStore.user?.nomClient || ''
  form.rue = ''
  form.cp = ''
  form.ville = ''
  formError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  suggestions.value = []
}

const submitNewAddress = async () => {
  isSubmitting.value = true
  formError.value = ''

  try {
    const resAddr = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Adresse/PostAdresse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idAdresse: 0,
        rue: form.rue,
        codePostal: String(form.cp),
        ville: form.ville,
        pays: form.pays
      })
    })
    
    if (!resAddr.ok) throw new Error("Erreur lors de la création de l'adresse.")
    const adrData = await resAddr.json()

    const resLivraison = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AdresseLivraison/PostAdresseLivraison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idClient: appStore.user.idClient,
        idAdresse: adrData.idAdresse,
        nomDestinataire: form.nom.trim().toUpperCase(),
        prenomDestinataire: form.prenom.trim()
      })
    })

    if (!resLivraison.ok) throw new Error("Erreur lors de la liaison de l'adresse de livraison.")

    adresses.value.push({
      idAdresse: adrData.idAdresse,
      idClient: appStore.user.idClient,
      type: 'LIVRAISON',
      prenom: form.prenom.trim(),
      nom: form.nom.trim().toUpperCase(),
      rue: form.rue,
      cp: form.cp,
      ville: form.ville,
      pays: form.pays,
      isDefault: false,
      canDelete: true
    })

    closeModal()

  } catch (err) {
    formError.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

const fetchAdresses = async () => {
  if (!appStore.user || !appStore.user.idClient) return
  loading.value = true
  error.value = ''
  
  try {
    const listAdresses = []

    if (appStore.user.idAdresseFacturation) {
      const resFact = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Adresse/GetAdresseById/${appStore.user.idAdresseFacturation}`)
      if (resFact.ok) {
        const adrFact = await resFact.json()
        listAdresses.push({
          id: adrFact.idAdresse,
          type: 'FACTURATION',
          prenom: appStore.user.prenomClient,
          nom: appStore.user.nomClient,
          rue: adrFact.rue,
          cp: adrFact.codePostal,
          ville: adrFact.ville,
          pays: adrFact.pays || 'France',
          isDefault: true,
          canDelete: false
        })
      }
    }

    const resLiv = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AdresseLivraison/GetByClient/${appStore.user.idClient}`)
    if (resLiv.ok) {
      const dataLiv = await resLiv.json()
      const livraisons = dataLiv.$values || dataLiv || []
      livraisons.forEach(liv => {
        const adrDetail = liv.adresseNavigation || liv.adresse || liv
        if (adrDetail.idAdresse !== appStore.user.idAdresseFacturation) {
          listAdresses.push({
            idAdresse: adrDetail.idAdresse,
            idClient: appStore.user.idClient,
            type: 'LIVRAISON',
            prenom: liv.prenomDestinataire || appStore.user.prenomClient,
            nom: liv.nomDestinataire || appStore.user.nomClient,
            rue: adrDetail.rue,
            cp: adrDetail.codePostal,
            ville: adrDetail.ville,
            pays: adrDetail.pays || 'France',
            isDefault: false,
            canDelete: true
          })
        }
      })
    }
    adresses.value = listAdresses
  } catch (err) {
    error.value = "Impossible de charger vos adresses."
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchAdresses() })

const supprimerAdresse = async (adr) => {
  if (!confirm("Voulez-vous vraiment supprimer cette adresse de livraison ?")) return
  try {
    const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AdresseLivraison/DeleteAdresseLivraison/${adr.idClient}/${adr.idAdresse}`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error("Erreur lors de la suppression")
    adresses.value = adresses.value.filter(a => a.idAdresse !== adr.idAdresse)
  } catch (err) {
    alert("Impossible de supprimer l'adresse.")
  }
}

const modifierAdresse = (adr) => {
  alert(`La modification sera implémentée bientôt pour : ${adr.rue}`)
}
</script>

<template>
  <div class="adresses-container">
    
    <div class="header-section">
      <h2>CARNET D'ADRESSES</h2>
      <p>Gérez vos adresses de facturation et de livraison pour faciliter vos prochaines commandes.</p>
      <div class="separator"></div>
    </div>

    <div v-if="loading" style="padding: 40px; text-align: center; color: #888; font-weight: bold;">
      Chargement de vos adresses...
    </div>

    <div v-else class="addresses-grid">
      
      <div class="address-card add-new-card" @click="openModal">
        <div class="add-icon">+</div>
        <p>AJOUTER UNE ADRESSE DE LIVRAISON</p>
      </div>

      <div v-for="adr in adresses" :key="adr.idAdresse || adr.id" class="address-card">
        <div class="card-header">
          <span :class="['badge-type', adr.type === 'FACTURATION' ? 'badge-fact' : 'badge-liv']">{{ adr.type }}</span>
          <span v-if="adr.isDefault" class="badge-default">PRINCIPALE</span>
        </div>
        <div class="card-body">
          <h4 class="user-name">{{ adr.prenom }} {{ adr.nom?.toUpperCase() }}</h4>
          <p class="address-line">{{ adr.rue }}</p>
          <p class="address-line">{{ adr.cp }} {{ adr.ville?.toUpperCase() }}</p>
          <p class="address-line country">{{ adr.pays?.toUpperCase() }}</p>
        </div>
        <div class="card-footer">
          <button class="btn-action edit" @click="modifierAdresse(adr)">Modifier</button>
          <template v-if="adr.canDelete">
            <span class="divider">|</span>
            <button class="btn-action delete" @click="supprimerAdresse(adr)">Supprimer</button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        
        <button class="close-btn" @click="closeModal">✕</button>
        <h3>NOUVELLE ADRESSE DE LIVRAISON</h3>
        <div class="modal-separator"></div>

        <form @submit.prevent="submitNewAddress" class="modal-form">
          <div class="row">
            <div class="field-group">
              <label>NOM DU DESTINATAIRE</label>
              <input type="text" v-model="form.nom" required>
            </div>
            <div class="field-group">
              <label>PRÉNOM DU DESTINATAIRE</label>
              <input type="text" v-model="form.prenom" required>
            </div>
          </div>

          <div class="field-group" style="position: relative;">
            <label>RECHERCHER UNE RUE</label>
            <input 
              type="text" 
              v-model="form.rue" 
              @input="onAddressInput(form.rue)"
              placeholder="Commencez à taper votre rue..." 
              autocomplete="off"
              required
            >
            <ul v-if="suggestions.length > 0" class="address-suggestions">
              <li v-for="s in suggestions" :key="s.properties.id" @click="selectAdresse(s)">
                {{ s.properties.label }}
              </li>
            </ul>
          </div>

          <div class="row">
            <div class="field-group">
              <label>CODE POSTAL</label>
              <input type="text" v-model="form.cp" readonly required style="background-color: #f4f4f4;">
            </div>
            <div class="field-group">
              <label>VILLE</label>
              <input type="text" v-model="form.ville" readonly required style="background-color: #f4f4f4;">
            </div>
          </div>

          <div v-if="formError" class="error-msg">{{ formError }}</div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal" :disabled="isSubmitting">ANNULER</button>
            <button type="submit" class="btn-save" :disabled="isSubmitting">
              {{ isSubmitting ? 'ENREGISTREMENT...' : 'ENREGISTRER L\'ADRESSE' }}
            </button>
          </div>
        </form>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* --- STYLES EXISTANTS DES CARTES --- */
.adresses-container {
  background: #fff;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  animation: fadeIn 0.4s ease-out;
  max-width: 1100px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-section h2 { font-family: 'Inter', sans-serif; font-weight: 900; font-style: italic; font-size: 1.8rem; margin: 0 0 10px 0; text-transform: uppercase; }
.header-section p { color: #888; font-size: 0.9rem; margin-bottom: 20px; }
.separator { width: 50px; height: 4px; background: #000; margin-bottom: 40px; }

.addresses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }

.address-card { border: 1px solid #eaeaea; padding: 25px; display: flex; flex-direction: column; background: #fff; transition: box-shadow 0.2s, border-color 0.2s; }
.address-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.06); border-color: #ccc; }

.add-new-card { border: 2px dashed #ccc; background: #fafafa; align-items: center; justify-content: center; cursor: pointer; text-align: center; min-height: 250px; }
.add-new-card:hover { border-color: #cc0000; background: #fff5f5; }
.add-new-card:hover .add-icon, .add-new-card:hover p { color: #cc0000; }
.add-icon { font-size: 3rem; font-weight: 300; color: #888; margin-bottom: 15px; transition: color 0.2s; }
.add-new-card p { font-weight: 800; font-style: italic; color: #888; margin: 0; transition: color 0.2s; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.badge-type { font-size: 0.65rem; font-weight: 900; padding: 5px 10px; letter-spacing: 1px; }
.badge-fact { background: #eee; color: #333; }
.badge-liv { background: #000; color: #fff; }
.badge-default { font-size: 0.65rem; font-weight: 800; color: #cc0000; font-style: italic; }

.card-body { flex-grow: 1; margin-bottom: 25px; }
.user-name { font-size: 1.1rem; font-weight: 900; margin: 0 0 15px 0; }
.address-line { font-size: 0.9rem; color: #555; margin: 0 0 5px 0; line-height: 1.4; }
.country { font-weight: 800; color: #111; margin-top: 10px; }

.card-footer { border-top: 1px solid #eaeaea; padding-top: 15px; display: flex; align-items: center; gap: 15px; }
.btn-action { background: none; border: none; padding: 0; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: color 0.2s; }
.btn-action.edit { color: #888; text-decoration: underline; }
.btn-action.edit:hover { color: #000; }
.btn-action.delete { color: #cc0000; }
.btn-action.delete:hover { text-decoration: underline; color: #990000; }
.divider { color: #ccc; font-size: 0.8rem; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(3px);
}

.modal-content {
  background: #fff;
  width: 100%;
  max-width: 600px;
  padding: 40px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  border-top: 5px solid #000;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}

.close-btn:hover { color: #cc0000; }

.modal-content h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 1.4rem;
  margin: 0 0 10px 0;
}

.modal-separator {
  width: 40px;
  height: 4px;
  background: #00a8e8;
  margin-bottom: 30px;
}

.modal-form { display: flex; flex-direction: column; gap: 15px; }
.row { display: flex; gap: 15px; }
.field-group { flex: 1; display: flex; flex-direction: column; }

.field-group label {
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 8px;
  color: #555;
  letter-spacing: 1px;
}

.field-group input {
  padding: 12px;
  border: 1px solid #ddd;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  background: #fcfcfc;
}

.field-group input:focus {
  border-color: #00a8e8;
  background: #fff;
}

.address-suggestions {
  position: absolute;
  z-index: 1001;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  list-style: none;
  padding: 0;
  margin: 0;
  box-shadow: 0 10px 15px rgba(0,0,0,0.1);
  max-height: 200px;
  overflow-y: auto;
}

.address-suggestions li {
  padding: 12px;
  cursor: pointer;
  font-size: 0.85rem;
  border-bottom: 1px solid #f0f0f0;
}

.address-suggestions li:hover { background-color: #f9f9f9; color: #00a8e8; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.btn-cancel {
  background: none;
  border: none;
  font-weight: 800;
  color: #888;
  cursor: pointer;
  padding: 10px 20px;
}
.btn-cancel:hover { color: #000; text-decoration: underline; }

.btn-save {
  background: #000;
  color: #fff;
  border: none;
  padding: 12px 25px;
  font-weight: 900;
  font-style: italic;
  cursor: pointer;
  clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%);
  transition: background 0.2s;
}

.btn-save:hover:not(:disabled) { background: #00a8e8; }
.btn-save:disabled { background: #888; cursor: not-allowed; }

.error-msg {
  color: #cc0000;
  font-size: 0.85rem;
  font-weight: bold;
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
}
</style>