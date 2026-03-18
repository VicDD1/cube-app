<template>
    <main class="login-page">
        <div class="auth-card">
            <header class="card-header">
            <h1>CONNEXION</h1>
        <div class="separator"></div>
        </header>
        
        <form @submit.prevent="handleLogin">
            <div class="field-group">
                <label>ADRESSE EMAIL</label>
                <input type="email" v-model="email" placeholder="NOM@EXEMPLE.COM" required>
            </div>
            <div class="field-group password-container">
                <label>MOT DE PASSE</label>
                <div class="input-wrapper">
                    <input 
                        :type="showPassword ? 'text' : 'password'" 
                        v-model="password" 
                        placeholder="••••••••" 
                        required
                    >
                    <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
                        {{ showPassword ? 'CACHER' : 'VOIR' }}
                    </button>
                </div>
            </div>
            
        <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">
                {{ feedback }}
            </div>
        </transition>
            
        <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'VÉRIFICATION...' : 'SE CONNECTER' }}
        </button>
        </form>
    </div>
    </main>
</template>
<script setup>
import { ref } from 'vue';
import { useAppStore } from '../stores/useStore';
import { useRouter } from 'vue-router';
import bcrypt from 'bcryptjs'; // Import crucial pour la comparaison

const store = useAppStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false); 
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

const handleLogin = async () => {
    if (loading.value) return;
    loading.value = true;
    feedback.value = "";
    isError.value = false;

    // Nettoyage des saisies (évite les erreurs de copier-coller)
    const cleanEmail = email.value.trim().toLowerCase();
    const cleanPassword = password.value.trim();

    try {
        // 1. Récupération du client par Email
        const response = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(cleanEmail)}`);

        if (!response.ok) {
            // Si le statut n'est pas 200, l'email n'existe probablement pas
            throw new Error("Compte inexistant ou erreur réseau.");
        }

        const userData = await response.json();

        // 2. Vérification du mot de passe (L'API renvoie le hash $2a$)
        let isMatch = false;

        
        
        isMatch = bcrypt.compareSync(cleanPassword, userData.mdp);
        if (isMatch) {
            // 3. Succès : Stockage dans Pinia et redirection
            store.login(userData);
            
            isError.value = false;
            feedback.value = "CONNEXION RÉUSSIE !";

            setTimeout(() => {
                // REDIRECTION CONDITIONNELLE SELON LE RÔLE
                if (userData.role === 'commercial') {
                    router.push('/espace-commercial');
                } else {
                    router.push('/');
                }
            }, 1500);
        } else {
            // Si l'email existe mais que le hash ne correspond pas
            throw new Error("Mot de passe incorrect.");
        }

    } catch (err) {
        isError.value = true;
        feedback.value = err.message;
        console.error("Détail erreur login:", err);
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

.login-page {
  /* On enlève le 100vh qui créait le grand vide */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  
  /* On garde l'espace pour le header */
  padding-top: 140px; 
  /* On réduit l'espace avec le footer */
  padding-bottom: 60px; 
  
  background-color: #f4f4f4;
  font-family: 'CubeFont', sans-serif;
  box-sizing: border-box;
}

.auth-card {
  background: #fff;
  width: 100%;
  max-width: 500px;
  padding: 40px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  border-top: 5px solid #000;
  position: relative;
  z-index: 1;
  /* Optionnel : ajoute une marge basse pour être sûr de ne pas coller au footer sur mobile */
  margin-bottom: 20px;
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
@media (max-width: 480px) {
  .auth-card {
    padding: 25px;
    width: 95%;
  }
}
</style>