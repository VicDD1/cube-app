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

        <div class="row">
          <div class="field-group">
            <label>RUE (FACTURATION)</label>
            <input type="text" v-model="form.rueFacturation" placeholder="14 Ave Pascal Paoli" required>
          </div>
        </div>
        <div class="row">
          <div class="field-group">
            <label>CODE POSTAL</label>
            <input type="text" v-model="form.cpFacturation" placeholder="20000" required>
          </div>
          <div class="field-group">
            <label>VILLE</label>
            <input type="text" v-model="form.villeFacturation" placeholder="Ajaccio" required>
          </div>
        </div>

        <div class="field-group checkbox-container">
          <input type="checkbox" v-model="sameAddress" id="same">
          <label for="same">L'ADRESSE DE LIVRAISON EST IDENTIQUE</label>
        </div>

        <div v-if="!sameAddress" class="delivery-section">
          <div class="row">
            <div class="field-group">
              <label>RUE (LIVRAISON)</label>
              <input type="text" v-model="form.rueLivraison" placeholder="123 RUE DE CUBE" :required="!sameAddress">
            </div>
          </div>
          <div class="row">
            <div class="field-group">
              <label>CODE POSTAL (LIVRAISON)</label>
              <input type="text" v-model="form.cpLivraison" placeholder="74000" :required="!sameAddress">
            </div>
            <div class="field-group">
              <label>VILLE (LIVRAISON)</label>
              <input type="text" v-model="form.villeLivraison" placeholder="ANNECY" :required="!sameAddress">
            </div>
          </div>
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

const sameAddress = ref(true);
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

const form = reactive({
  nom: '',
  prenomClient: '',
  dateNaissance: '',
  email: '',
  password: '',
  telephone: '', 
  rueFacturation: '',
  cpFacturation: '',
  villeFacturation: '',
  rueLivraison: '',
  cpLivraison: '',
  villeLivraison: '',
  pays: 'France'
});

const handleRegistration = async () => {
  if (loading.value) return;

  loading.value = true;
  feedback.value = "Création du compte en cours...";
  isError.value = false;

  // Initialisation des variables pour qu'elles soient accessibles dans toute la fonction
  let adrFactData = null;
  let clientData = null;
  let adrLivFinalData = null;

  try {
    // --- PHASE 1 : ADRESSE DE FACTURATION ---
    const resAddr = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Adresse/PostAdresse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idAdresse: 0,
        rue: form.rueFacturation,
        codePostal: String(form.cpFacturation),
        ville: form.villeFacturation,
        pays: "France"
      })
    });
    if (!resAddr.ok) throw new Error("Erreur lors de la création de l'adresse de facturation.");
    adrFactData = await resAddr.json();

    // --- PHASE 2 : CLIENT ---
    const clientPayload = {
      idClient: 0,
      idAdresseFacturation: adrFactData.idAdresse,
      nomClient: form.nom.trim(),
      prenomClient: form.prenomClient.trim(),
      emailClient: form.email.trim(),
      mdp: form.password,
      // Nettoyage téléphone (10 chiffres sans espace pour le SQL)
      tel: String(form.telephone || "").replace(/\s/g, ""), 
      dateInscription: new Date().toISOString().split('T')[0],
      dateNaissance: form.dateNaissance,
      role: "client"
    };

    const resClient = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/PostClient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientPayload)
    });
    if (!resClient.ok) throw new Error("Erreur profil : l'email est peut-être déjà utilisé.");
    clientData = await resClient.json();

    // --- PHASE 3 : ADRESSE DE LIVRAISON ---
    adrLivFinalData = adrFactData; // Par défaut, c'est la même

    if (!sameAddress.value) {
      feedback.value = "Création de l'adresse de livraison...";
      const resAddrLiv = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Adresse/PostAdresse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idAdresse: 0,
          rue: form.rueLivraison,
          codePostal: String(form.cpLivraison),
          ville: form.villeLivraison,
          pays: "France"
        })
      });
      if (resAddrLiv.ok) {
        adrLivFinalData = await resAddrLiv.json();
      }
    }

// --- PHASE 4 : LIAISON (PAYLOAD AVEC VALIDATION ROLE) ---
feedback.value = "Finalisation de la liaison livraison...";

const adresseLivraisonPayload = {
  idClient: parseInt(clientData.idClient),
  idAdresse: parseInt(adrLivFinalData.idAdresse),
  nomDestinataire: form.nom.trim(),
  prenomDestinataire: form.prenomClient.trim(),
  
  // L'API exige ces objets pour la validation, et le Role est requis
  idClientNavigation: {
    idClient: parseInt(clientData.idClient),
    role: "client" // <--- Indispensable pour éviter la 400
  },
  idAdresseNavigation: {
    idAdresse: parseInt(adrLivFinalData.idAdresse)
  }
};

try {
  const resLiaison = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AdresseLivraison/PostAdresseLivraison', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adresseLivraisonPayload)
  });

  if (resLiaison.ok) {
    isError.value = false;
    feedback.value = "INSCRIPTION RÉUSSIE AVEC LIAISON !";
  } else {
    const errorData = await resLiaison.json();
    console.error("Détails des erreurs de validation:", errorData.errors);
    throw new Error("Erreur de validation lors de la liaison.");
  }
} catch (err) {
  console.warn("Liaison impossible, mais les données de base sont en SQL.");
  isError.value = false; // On laisse en succès car le compte client existe
  feedback.value = "Inscription terminée (Liaison livraison à vérifier).";
}

    // SUCCÈS : On arrive ici si les phases 1 et 2 ont réussi
    isError.value = false;
    feedback.value = "INSCRIPTION RÉUSSIE AVEC SUCCÈS !";

  } catch (err) {
    console.error("ERREUR:", err);
    isError.value = true;
    feedback.value = err.message;
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