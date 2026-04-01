<template>
  <main class="connexion-page">
    <div class="auth-card">
      <header class="card-header">
        <h1>{{ step === 1 ? 'CRÉER UN COMPTE' : 'VÉRIFICATION' }}</h1>
        <div class="separator"></div>
      </header>
      
      <form v-if="step === 1" @submit.prevent="handleRegistration">
        <div class="row">
          <div class="field-group">
            <label>NOM</label>
            <input type="text" v-model="form.nom" :class="{ 'input-error': errors.nom }" placeholder="DUPONT">
            <span class="field-error" v-if="errors.nom">{{ errors.nom }}</span>
          </div>
          <div class="field-group">
            <label>PRÉNOM</label>
            <input type="text" v-model="form.prenomClient" :class="{ 'input-error': errors.prenomClient }" placeholder="JEAN">
            <span class="field-error" v-if="errors.prenomClient">{{ errors.prenomClient }}</span>
          </div>
        </div>

        <div class="field-group">
          <label>DATE DE NAISSANCE</label>
          <input type="date" v-model="form.dateNaissance" :class="{ 'input-error': errors.dateNaissance }">
          <span class="field-error" v-if="errors.dateNaissance">{{ errors.dateNaissance }}</span>
        </div>

        <div class="field-group">
          <label>ADRESSE EMAIL</label>
          <input type="email" v-model="form.email" :class="{ 'input-error': errors.email }" placeholder="NOM@EXEMPLE.COM">
          <span class="field-error" v-if="errors.email">{{ errors.email }}</span>
        </div>
        
        <div class="field-group">
          <label>MOT DE PASSE</label>
          <div class="input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              :class="{ 'input-error': errors.password }"
              placeholder="••••••••" 
            >
            <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'CACHER' : 'VOIR' }}
            </button>
          </div>
          <span class="field-error" v-if="errors.password">{{ errors.password }}</span>
        </div>
        
        <div class="field-group">
          <label>CONFIRMER LE MOT DE PASSE</label>
          <div class="input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="confirmPassword" 
              :class="{ 'input-error': errors.confirmPassword }"
              placeholder="••••••••" 
            >
          </div>
          <span class="field-error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
        </div>

        <div class="field-group">
          <label>TÉLÉPHONE</label>
          <input type="tel" v-model="form.telephone" :class="{ 'input-error': errors.telephone }" placeholder="06 00 00 00 00">
          <span class="field-error" v-if="errors.telephone">{{ errors.telephone }}</span>
        </div>

        <div class="field-group" style="position: relative;">
          <label>RUE (FACTURATION)</label>
          <input 
            type="text" 
            v-model="form.rueFacturation" 
            :class="{ 'input-error': errors.rueFacturation }"
            @input="onAddressInput(form.rueFacturation)"
            placeholder="Tapez votre adresse..." 
            autocomplete="off"
          >
          <span class="field-error" v-if="errors.rueFacturation">{{ errors.rueFacturation }}</span>
          <ul v-if="suggestions.length > 0" class="address-suggestions">
            <li v-for="s in suggestions" :key="s.properties.id" @click="selectAdresse(s, 'facturation')">
              {{ s.properties.label }}
            </li>
          </ul>
        </div>

        <div class="row">
          <div class="field-group">
            <label>CODE POSTAL</label>
            <input type="text" v-model="form.cpFacturation" :class="{ 'input-error': errors.cpFacturation }" placeholder="20000" readonly>
          </div>
          <div class="field-group">
            <label>VILLE</label>
            <input type="text" v-model="form.villeFacturation" :class="{ 'input-error': errors.cpFacturation }" placeholder="Ajaccio" readonly>
          </div>
        </div>
        <span class="field-error" v-if="errors.cpFacturation">{{ errors.cpFacturation }}</span>

        <div class="field-group checkbox-container">
          <input type="checkbox" v-model="sameAddress" id="same">
          <label for="same">L'ADRESSE DE LIVRAISON EST IDENTIQUE</label>
        </div>

        <div v-if="!sameAddress" class="delivery-section">
          <div class="field-group" style="position: relative;">
            <label>RUE (LIVRAISON)</label>
            <input 
              type="text" 
              v-model="form.rueLivraison" 
              :class="{ 'input-error': errors.rueLivraison }"
              @input="onAddressInput(form.rueLivraison)"
              placeholder="Rue de livraison" 
              autocomplete="off"
            >
            <span class="field-error" v-if="errors.rueLivraison">{{ errors.rueLivraison }}</span>
            <ul v-if="suggestions.length > 0" class="address-suggestions">
              <li v-for="s in suggestions" :key="s.properties.id" @click="selectAdresse(s, 'livraison')">
                {{ s.properties.label }}
              </li>
            </ul>
          </div>
          <div class="row">
            <div class="field-group">
              <label>CODE POSTAL (LIVRAISON)</label>
              <input type="text" v-model="form.cpLivraison" :class="{ 'input-error': errors.cpLivraison }" placeholder="74000" readonly>
            </div>
            <div class="field-group">
              <label>VILLE (LIVRAISON)</label>
              <input type="text" v-model="form.villeLivraison" :class="{ 'input-error': errors.cpLivraison }" placeholder="ANNECY" readonly>
            </div>
          </div>
          <span class="field-error" v-if="errors.cpLivraison">{{ errors.cpLivraison }}</span>
        </div>

        <transition name="fade">
          <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">
            {{ feedback }}
          </div>
        </transition>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'ENVOI DU CODE...' : 'RECEVOIR MON CODE' }}
        </button>

        <div class="google-divider">
          <span>OU</span>
        </div>

        <div class="google-auth-container">
          <GoogleSignInButton
            @success="handleGoogleSuccess"
            @error="handleGoogleError"
          />
        </div>
      </form>

      <div v-else class="verification-container">
        <p class="verification-info">
          Un code de sécurité a été envoyé à l'adresse : <br>
          <strong>{{ form.email }}</strong>
        </p>
        
        <div class="field-group">
          <label>CODE À 6 CHIFFRES</label>
          <input 
            type="text" 
            v-model="userEnteredCode" 
            placeholder="000000" 
            maxlength="6" 
            class="code-input"
            required
          >
        </div>

        <transition name="fade">
          <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">
            {{ feedback }}
          </div>
        </transition>

        <div class="button-group">
          <button @click="confirmAndCreateAccount" :disabled="loading" class="submit-btn">
            {{ loading ? 'VÉRIFICATION...' : 'VALIDER L\'INSCRIPTION' }}
          </button>
          <button @click="step = 1" class="back-btn" :disabled="loading">
            RETOUR
          </button>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { GoogleSignInButton, decodeCredential } from 'vue3-google-signin';
import emailjs from '@emailjs/browser';
import { useValidation } from '@/composables/useValidation'; // Ajuste le chemin si besoin

const router = useRouter();

// --- VALIDATION ---
const { errors, validateRegistration } = useValidation();

// --- ÉTATS DE L'INTERFACE ---
const step = ref(1); // 1: Formulaire, 2: Saisie du code de validation
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);
const showPassword = ref(false);
const sameAddress = ref(true);
const suggestions = ref([]);
const googleIdValue = ref(null); 

// --- LOGIQUE DE SÉCURITÉ ---
const generatedCode = ref('');
const userEnteredCode = ref('');
const confirmPassword = ref('');

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

const handleGoogleSuccess = async (response) => {
  const { credential } = response;
  const userData = decodeCredential(credential);

  const extractedId = userData.id || userData.sub;

  if (extractedId) {
    googleIdValue.value = extractedId;
    console.log("ID Google capturé avec succès :", googleIdValue.value);
  } else {
    console.error("Impossible de trouver l'ID. Voici les données complètes :", userData);
  }

  loading.value = true;
  isError.value = false;
  feedback.value = "VÉRIFICATION DU COMPTE GOOGLE...";

  try {
    const cleanEmail = userData.email.trim().toLowerCase();
    
    const checkRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(cleanEmail)}`);
    
    if (checkRes.ok) {
      feedback.value = "CONNEXION RÉUSSIE !";
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      form.email = cleanEmail;
      form.nom = userData.family_name ? userData.family_name.toUpperCase() : '';
      form.prenomClient = userData.given_name || '';
      
      form.password = Math.random().toString(36).slice(-10) + "A1!"; // Génération d'un MDP fort temporaire
      confirmPassword.value = form.password;

      feedback.value = "COMPTE GOOGLE RECONNU. VEUILLEZ COMPLÉTER VOTRE ADRESSE.";
    }
  } catch (err) {
    isError.value = true;
    feedback.value = "ERREUR LORS DE LA LIAISON GOOGLE.";
  } finally {
    loading.value = false;
  }
};

const handleGoogleError = () => {
  isError.value = true;
  feedback.value = "ÉCHEC DE L'AUTHENTIFICATION GOOGLE.";
};

// --- AUTOCOMPLÉTION ADRESSE (API GOUV) ---
const onAddressInput = async (query) => {
  if (!query || query.length < 4) {
    suggestions.value = [];
    return;
  }
  try {
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    suggestions.value = data.features;
  } catch (err) {
    console.error("Erreur API Adresse:", err);
  }
};

const selectAdresse = (feature, type) => {
  if (type === 'facturation') {
    form.rueFacturation = feature.properties.name;
    form.cpFacturation = feature.properties.postcode;
    form.villeFacturation = feature.properties.city;
  } else {
    form.rueLivraison = feature.properties.name;
    form.cpLivraison = feature.properties.postcode;
    form.villeLivraison = feature.properties.city;
  }
  suggestions.value = []; 
};

// --- ÉTAPE 1 : VÉRIFICATION EMAIL ET ENVOI DU CODE ---
const handleRegistration = async () => {


  const isValid = validateRegistration(form, confirmPassword.value, sameAddress.value);


  if (!isValid) {
    isError.value = true;
    feedback.value = "VEUILLEZ CORRIGER LES ERREURS DANS LE FORMULAIRE.";
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    return;
  }

  loading.value = true;
  isError.value = false;
  feedback.value = "VÉRIFICATION EN COURS...";

  try {
    const cleanEmail = form.email.trim().toLowerCase();
    
    const checkRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(cleanEmail)}`);
    
    if (checkRes.ok) {
      throw new Error("CETTE ADRESSE EMAIL EST DÉJÀ UTILISÉE.");
    }

    generatedCode.value = Math.floor(100000 + Math.random() * 900000).toString();

    await emailjs.send(
      'service_ues7qi8', 
      'template_by4mad9', 
      {
        to_name: form.prenomClient.trim(),
        to_email: form.email.trim().toLowerCase(),
        code: String(generatedCode.value)
      },
      '9lPdrD2WOpVRdpwJO' 
    );
    console.log("8. Email envoyé avec succès !");

    step.value = 2;
    feedback.value = "UN CODE DE SÉCURITÉ A ÉTÉ ENVOYÉ.";

  } catch (err) {
    console.error("Erreur attrapée dans le try/catch :", err);
    isError.value = true;
    feedback.value = err.message || "ERREUR LORS DE L'ENVOI DU MAIL.";
  } finally {
    loading.value = false;
  }
};

// --- ÉTAPE 2 : VALIDATION DU CODE ET CRÉATION RÉELLE EN BASE ---
const confirmAndCreateAccount = async () => {
  if (userEnteredCode.value !== generatedCode.value) {
    isError.value = true;
    feedback.value = "CODE INCORRECT.";
    return;
  }

  loading.value = true;
  feedback.value = "CRÉATION DE VOTRE COMPTE...";

  try {
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
    if (!resAddr.ok) throw new Error("Erreur lors de l'enregistrement de l'adresse.");
    const adrFactData = await resAddr.json();

    const clientPayload = {
      idClient: 0,
      idAdresseFacturation: adrFactData.idAdresse,
      nomClient: form.nom.trim().toUpperCase(),
      prenomClient: form.prenomClient.trim(),
      emailClient: form.email.trim().toLowerCase(),
      mdp: form.password, 
      tel: String(form.telephone || "").replace(/\s/g, ""),
      dateInscription: new Date().toISOString().split('T')[0], 
      dateNaissance: form.dateNaissance,
      role: "client",
      googleId: googleIdValue.value
    };

    const resClient = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/PostClient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientPayload)
    });
    
    if (!resClient.ok) throw new Error("Erreur lors de la création du profil client.");
    const clientData = await resClient.json();

    let finalLivId = adrFactData.idAdresse;
    if (!sameAddress.value) {
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
        const adrLivData = await resAddrLiv.json();
        finalLivId = adrLivData.idAdresse;
      }
    }

    await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AdresseLivraison/PostAdresseLivraison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idClient: clientData.idClient,
        idAdresse: finalLivId,
        nomDestinataire: form.nom.trim().toUpperCase(),
        prenomDestinataire: form.prenomClient.trim()
      })
    });

    isError.value = false;
    feedback.value = "BIENVENUE CHEZ CUBE ! VOTRE COMPTE EST CRÉÉ.";
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (err) {
    isError.value = true;
    feedback.value = err.message.toUpperCase();
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

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding-right: 60px;
}

.toggle-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #00a8e8;
  font-family: 'CubeFont', sans-serif;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.2s;
}

.checkbox-container {
  display: flex;
  flex-direction: row; /* Aligne horizontalement */
  align-items: center; /* Centre verticalement */
  gap: 10px; /* Espace entre la case et le texte */
  margin-top: 10px;
  margin-bottom: 20px;
}

.checkbox-container input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  cursor: pointer;
}

.checkbox-container label {
  display: inline-block;
  margin-bottom: 0;
  cursor: pointer;
}

.google-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #888;
  font-size: 10px;
}

.google-divider::before, .google-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.google-divider span {
  padding: 0 10px;
}

.google-auth-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.toggle-btn:hover {
  color: #000;
}

.connexion-page {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center; 
  padding-top: 100px; 
  padding-bottom: 20px; 
  
  background-color: #f4f4f4;
  font-family: 'CubeFont', sans-serif;
  box-sizing: border-box;
  overflow: hidden; 
}

.auth-card {
  background: #fff;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  border-top: 5px solid #000;
  box-sizing: border-box; 
  max-height: 100%; 
  overflow-y: auto; 
}

.address-suggestions {
  position: absolute;
  z-index: 1000;
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
  font-size: 11px;
  border-bottom: 1px solid #f0f0f0;
  text-transform: uppercase;
}

.address-suggestions li:hover {
  background-color: #f9f9f9;
  color: #00a8e8;
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

.back-btn {
  width: 100%;
  padding: 14px;
  background-color: transparent;
  color: #555;
  border: 2px solid #ddd;
  font-family: 'CubeFont', sans-serif;
  font-weight: 800;
  font-style: italic;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.back-btn:hover:not(:disabled) {
  border-color: #000;
  color: #000;
  background-color: #f9f9f9;
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.error { background-color: #fee2e2; color: #dc2626; border: 1px solid #dc2626; }
.success { background-color: #ecfdf5; color: #059669; border: 1px solid #059669; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Styles de validation */
.field-error {
  display: block;
  color: #dc2626;
  font-size: 10px;
  margin-top: 4px;
  font-weight: 600;
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

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-container input {
  width: auto;
}

@media (max-width: 480px) {
  .row { flex-direction: column; gap: 0; }
}
</style>