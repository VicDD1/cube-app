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
          <div class="input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="••••••••" 
              required
            >
            <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'CACHER' : 'VOIR' }}
            </button>
          </div>
        </div>
        
        <div class="field-group">
          <label>CONFIRMER LE MOT DE PASSE</label>
          <div class="input-wrapper">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="confirmPassword" 
              placeholder="••••••••" 
              required
            >
          </div>
        </div>

        <div class="field-group">
          <label>TÉLÉPHONE</label>
          <input type="tel" v-model="form.telephone" placeholder="06 00 00 00 00">
        </div>

        <div class="field-group" style="position: relative;">
          <label>RUE (FACTURATION)</label>
          <input 
            type="text" 
            v-model="form.rueFacturation" 
            @input="onAddressInput(form.rueFacturation)"
            placeholder="Tapez votre adresse..." 
            autocomplete="off"
            required
          >
          <ul v-if="suggestions.length > 0" class="address-suggestions">
            <li v-for="s in suggestions" :key="s.properties.id" @click="selectAdresse(s, 'facturation')">
              {{ s.properties.label }}
            </li>
          </ul>
        </div>

        <div class="row">
          <div class="field-group">
            <label>CODE POSTAL</label>
            <input type="text" v-model="form.cpFacturation" placeholder="20000" readonly required>
          </div>
          <div class="field-group">
            <label>VILLE</label>
            <input type="text" v-model="form.villeFacturation" placeholder="Ajaccio" readonly required>
          </div>
        </div>

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
              @input="onAddressInput(form.rueLivraison)"
              placeholder="Rue de livraison" 
              autocomplete="off"
              :required="!sameAddress"
            >
            <ul v-if="suggestions.length > 0" class="address-suggestions">
              <li v-for="s in suggestions" :key="s.properties.id" @click="selectAdresse(s, 'livraison')">
                {{ s.properties.label }}
              </li>
            </ul>
          </div>
          <div class="row">
            <div class="field-group">
              <label>CODE POSTAL (LIVRAISON)</label>
              <input type="text" v-model="form.cpLivraison" placeholder="74000" readonly :required="!sameAddress">
            </div>
            <div class="field-group">
              <label>VILLE (LIVRAISON)</label>
              <input type="text" v-model="form.villeLivraison" placeholder="ANNECY" readonly :required="!sameAddress">
            </div>
          </div>
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
import bcrypt from 'bcryptjs';
import { GoogleSignInButton, decodeCredential } from 'vue3-google-signin';
import emailjs from '@emailjs/browser';

const router = useRouter();

// --- ÉTATS DE L'INTERFACE ---
const step = ref(1); // 1: Formulaire, 2: Saisie du code de validation
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);
const showPassword = ref(false);
const sameAddress = ref(true);
const suggestions = ref([]);
const googleIdValue = ref(null); // Pour stocker le "sub" de Google

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
  googleIdValue.value = userData.sub;  // Décode Nom, Prénom, Email

  loading.value = true;
  isError.value = false;
  feedback.value = "VÉRIFICATION DU COMPTE GOOGLE...";

  try {
    const cleanEmail = userData.email.trim().toLowerCase();
    
    // Vérifier si l'utilisateur existe déjà dans ta base Azure
    const checkRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(cleanEmail)}`);
    
    if (checkRes.ok) {
      // Cas A : L'utilisateur existe, on simule une connexion
      feedback.value = "CONNEXION RÉUSSIE !";
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      // Cas B : Nouvel utilisateur, on pré-remplit le formulaire
      form.email = cleanEmail;
      form.nom = userData.family_name ? userData.family_name.toUpperCase() : '';
      form.prenomClient = userData.given_name || '';
      
      // On génère un mot de passe aléatoire caché puisque c'est du OAuth
      form.password = Math.random().toString(36).slice(-10);
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
  // Validation des mots de passe
  if (form.password !== confirmPassword.value) {
    isError.value = true;
    feedback.value = "LES MOTS DE PASSE NE CORRESPONDENT PAS.";
    return;
  }

  loading.value = true;
  isError.value = false;
  feedback.value = "VÉRIFICATION EN COURS...";

  try {
    const cleanEmail = form.email.trim().toLowerCase();
    
    // 1. Vérifier si l'email existe déjà
    const checkRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(cleanEmail)}`);
    if (checkRes.ok) {
      throw new Error("CETTE ADRESSE EMAIL EST DÉJÀ UTILISÉE.");
    }

    // 2. Générer le code à 6 chiffres
    generatedCode.value = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Préparer les paramètres pour EmailJS
    // C'est ici qu'on ajoute to_name pour ton template !
  const templateParams = {
    to_name: form.prenomClient.trim(), // Correspond à {{to_name}}
    to_email: form.email.toLowerCase(), // Correspond à {{to_email}}
    code: String(generatedCode.value)   // Correspond à {{code}}
  };

    // 4. Envoyer le mail (Remplace par tes IDs réels)
    await emailjs.send(
  'service_ues7qi8', // Ton Service ID (Email Services)
  'template_by4mad9', // Ton Template ID (Email Templates)
  {
    to_name: form.prenomClient.trim(),
    to_email: form.email.trim().toLowerCase(),
    code: String(generatedCode.value)
  },
  '9lPdrD2WOpVRdpwJO' // Ta Public Key (Account > API Keys)
);

    // 5. Passer à l'étape suivante
    step.value = 2;
    feedback.value = "UN CODE DE SÉCURITÉ A ÉTÉ ENVOYÉ.";

  } catch (err) {
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
    // PHASE A : CRÉER L'ADRESSE DE FACTURATION
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
    if (!resAddr.ok) throw new Error("Erreur adresse facturation.");
    const adrFactData = await resAddr.json();

    // PHASE B : CRÉER LE CLIENT (MDP HACHÉ)
    const salt = bcrypt.genSaltSync(10);
    const hashedMdp = bcrypt.hashSync(form.password, salt);

    const clientPayload = {
      idClient: 0,
      idAdresseFacturation: adrFactData.idAdresse,
      nomClient: form.nom.trim().toUpperCase(),
      prenomClient: form.prenomClient.trim(),
      emailClient: form.email.trim().toLowerCase(),
      mdp: hashedMdp,
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
    if (!resClient.ok) throw new Error("Erreur création client.");
    const clientData = await resClient.json();

    // PHASE C : GÉRER L'ADRESSE DE LIVRAISON
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

    // PHASE D : LIAISON LIVRAISON
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
    feedback.value = "COMPTE CRÉÉ AVEC SUCCÈS ! REDIRECTION...";
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (err) {
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

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding-right: 60px; /* Espace pour le bouton à droite */
}

.toggle-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #00a8e8; /* Ton bleu Cube */
  font-family: 'CubeFont', sans-serif;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.2s;
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

/* NOUVEAU : Style pour les suggestions d'adresse */
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

/* Optionnel : Si tu veux les mettre côte à côte sur grand écran */
.button-group {
  display: flex;
  flex-direction: column; /* Par défaut l'un sur l'autre */
  gap: 10px;
  margin-top: 20px;
}

.error { background-color: #fee2e2; color: #dc2626; border: 1px solid #dc2626; }
.success { background-color: #ecfdf5; color: #059669; border: 1px solid #059669; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .row { flex-direction: column; gap: 0; }
}
</style>