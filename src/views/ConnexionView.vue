<template>
    <main class="login-page">
      <div class="auth-card">
        <header class="card-header">
          <h1>{{ step === 1 ? 'CONNEXION' : 'DOUBLE AUTHENTIFICATION' }}</h1>
          <div class="separator"></div>
        </header>

        <form v-if="step === 1" @submit.prevent="handleLogin">
          <div class="field-group">
            <label>ADRESSE EMAIL</label>
            <input type="email" v-model="email" placeholder="NOM@EXEMPLE.COM" required>
          </div>
          <div class="field-group password-container">
            <label>MOT DE PASSE</label>
            <div class="input-wrapper">
              <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="••••••••" required>
              <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
                {{ showPassword ? 'CACHER' : 'VOIR' }}
              </button>
            </div>
          </div>

          <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">{{ feedback }}</div>
          </transition>

          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'VÉRIFICATION...' : 'SE CONNECTER' }}
          </button>
          
          <div class="google-divider"><span>OU</span></div>
          <div class="google-auth-container">
            <GoogleSignInButton @success="handleGoogleSuccess" @error="handleGoogleError" />
          </div>
        </form>

        <div v-else class="verification-container">
          <p class="verification-info" style="text-align: center; font-size: 11px; margin-bottom: 20px;">
            Un code de sécurité a été envoyé à votre adresse email.
          </p>
          <div class="field-group">
            <label>CODE À 6 CHIFFRES</label>
            <input type="text" v-model="userEnteredCode" placeholder="000000" maxlength="6" style="text-align: center; letter-spacing: 10px; font-size: 20px;" required>
          </div>
          <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">{{ feedback }}</div>
          </transition>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button @click="confirmA2F" :disabled="loading" class="submit-btn">
              {{ loading ? 'VÉRIFICATION...' : 'VALIDER LE CODE' }}
            </button>
            <button @click="step = 1" class="back-btn">RETOUR</button>
          </div>
        </div>
      </div>
    </main>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '../stores/useStore';
import { useRouter } from 'vue-router';
import { GoogleSignInButton, decodeCredential } from 'vue3-google-signin';
import emailjs from '@emailjs/browser';

const store = useAppStore(); // On utilise uniquement 'store'
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false); 
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

const step = ref(1); 
const userEnteredCode = ref('');
const generatedCode = ref('');
const pendingUser = ref(null);

const handleLogin = async () => {
    if (loading.value) return;
    loading.value = true;
    feedback.value = "VÉRIFICATION...";
    isError.value = false;

    const cleanEmail = email.value.trim().toLowerCase();
    const cleanPassword = password.value.trim();

    console.log("LOG 1: Tentative de connexion...");

    try {
        const response = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/Login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: cleanEmail, Password: cleanPassword })
        });

        if (!response.ok) throw new Error("EMAIL OU MOT DE PASSE INCORRECT.");

        const userData = await response.json();
        console.log("LOG 2: Données reçues ->", userData);
        
        // Test large de la propriété doubleAuth (casse différente selon l'API)
        const hasA2F = userData.doubleAuth === true || userData.DoubleAuth === true;

        if (hasA2F) {
            console.log("LOG 3: A2F Détecté ! Envoi mail...");
            pendingUser.value = userData;
            generatedCode.value = Math.floor(100000 + Math.random() * 900000).toString();

            await emailjs.send(
                'service_ues7qi8', 
                'template_by4mad9', 
                {
                    to_name: userData.prenomClient || userData.PrenomClient,
                    to_email: userData.emailClient || userData.EmailClient,
                    code: generatedCode.value
                },
                '9lPdrD2WOpVRdpwJO'
            );

            step.value = 2;
            feedback.value = "CODE ENVOYÉ PAR MAIL.";
            loading.value = false; 
            return; // ON S'ARRÊTE ICI
        } 
        
        console.log("LOG 4: Pas d'A2F, connexion directe.");
        finalizeLogin(userData);

    } catch (err) {
        isError.value = true;
        feedback.value = err.message.toUpperCase();
        console.error("LOG ERREUR:", err);
    } finally {
        loading.value = false;
    }
};

const confirmA2F = () => {
    if (userEnteredCode.value === generatedCode.value) {
        finalizeLogin(pendingUser.value);
    } else {
        isError.value = true;
        feedback.value = "CODE INCORRECT.";
    }
};

const finalizeLogin = (userData) => {
    // On unifie le store ici (on vire appStore qui n'existe pas)
    store.user = userData;
    store.login(userData);
    isError.value = false;
    feedback.value = "CONNEXION RÉUSSIE !";

    setTimeout(() => {
        const role = (userData.role || userData.Role || 'client').toLowerCase();
        router.push(role === 'commercial' ? '/espace-commercial' : '/');
    }, 1500);
};

const handleGoogleSuccess = async (response) => {
    if (loading.value) return;
    loading.value = true;
    feedback.value = "VÉRIFICATION GOOGLE...";
    isError.value = false;

    const { credential } = response;
    const googleUser = decodeCredential(credential);
    const cleanEmail = googleUser.email.trim().toLowerCase();

    console.log("LOG GOOGLE 1: Email récupéré ->", cleanEmail);

    try {
        // 1. Chercher l'utilisateur dans ta base de données Azure
        const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(cleanEmail)}`);
        
        if (!res.ok) {
            // Si l'utilisateur n'existe pas en BDD, on l'empêche de se connecter
            // (Ou tu peux le rediriger vers la page de création de compte)
            throw new Error("COMPTE INEXISTANT. VEUILLEZ CRÉER UN COMPTE.");
        }

        const dbUser = await res.json();
        console.log("LOG GOOGLE 2: Données BDD reçues ->", dbUser);

        // 2. Vérifier si l'utilisateur BDD a le 2FA activé
        const hasA2F = dbUser.doubleAuth === true || dbUser.DoubleAuth === true;

        if (hasA2F) {
            console.log("LOG GOOGLE 3: A2F Détecté ! Envoi du mail en cours...");
            pendingUser.value = dbUser;
            generatedCode.value = Math.floor(100000 + Math.random() * 900000).toString();

            // 3. Envoi du mail via EmailJS
            await emailjs.send(
                'service_ues7qi8', 
                'template_by4mad9', 
                {
                    to_name: dbUser.prenomClient || dbUser.PrenomClient || googleUser.given_name,
                    to_email: dbUser.emailClient || dbUser.EmailClient || cleanEmail,
                    code: generatedCode.value
                },
                '9lPdrD2WOpVRdpwJO'
            );

            // 4. On passe à l'interface de saisie du code
            step.value = 2;
            feedback.value = "CODE ENVOYÉ PAR MAIL.";
        } else {
            console.log("LOG GOOGLE 4: Pas d'A2F, connexion directe.");
            finalizeLogin(dbUser);
        }

    } catch (err) {
        isError.value = true;
        feedback.value = err.message.toUpperCase();
        console.error("LOG ERREUR GOOGLE:", err);
    } finally {
        loading.value = false;
    }
};

const handleGoogleError = () => {
    isError.value = true;
    feedback.value = "ÉCHEC DE L'AUTHENTIFICATION GOOGLE.";
    loading.value = false;
};
</script>

<style scoped>
@font-face {
  font-family: 'CubeFont';
  src: url('@/assets/fonts/font.woff2') format('woff2');
}

.login-page {
  height: 100vh; 
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center; 
  padding-top: 100px; 
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
  max-height: calc(100vh - 120px); 
  overflow-y: auto; 
}

.google-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #888;
  font-size: 10px;
  font-weight: 800;
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

.field-group {
  margin-bottom: 18px;
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
  transition: background-color 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #00a8e8;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.message {
  margin-bottom: 20px;
  padding: 12px;
  font-size: 12px;
  text-align: center;
  font-weight: 800;
}

.error { 
  background-color: #fee2e2; 
  color: #dc2626; 
  border: 1px solid #dc2626; 
}

.success { 
  background-color: #ecfdf5; 
  color: #059669; 
  border: 1px solid #059669; 
}

.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.4s; 
}

.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

/* Conteneur pour aligner l'input et le bouton */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* On s'assure que l'input laisse de la place pour le texte à droite */
.input-wrapper input {
  padding-right: 60px; /* Espace pour ne pas que le texte chevauche le bouton */
}

/* Style du bouton "VOIR / CACHER" */
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
  padding: 5px;
  transition: color 0.2s ease;
  z-index: 2;
}

.toggle-btn:hover {
  color: #000;
}

/* Ajustement pour que le champ password s'aligne bien avec les autres */
.field-group {
  margin-bottom: 18px;
}

.back-btn {
  width: 100%;
  padding: 14px;
  background-color: transparent;
  color: #555; /* Gris foncé pour contraster avec ton bouton principal noir */
  border: 2px solid #ddd;
  font-family: 'CubeFont', sans-serif;
  font-size: 13px;
  font-weight: 800;
  font-style: italic;
  text-transform: uppercase;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease; /* Animation fluide au survol */
}

/* Effet au survol : le bouton s'assombrit pour montrer qu'il est cliquable */
.back-btn:hover:not(:disabled) {
  border-color: #000;
  color: #000;
  background-color: #f9f9f9;
}

/* Style si le bouton est désactivé (pendant un chargement) */
.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 25px;
    width: 95%;
  }
}
</style>