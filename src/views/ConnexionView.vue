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
            
        <div class="field-group">
            <label>MOT DE PASSE</label>
            <input type="password" v-model="password" placeholder="••••••••" required>
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

const store = useAppStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

const handleLogin = async () => {
    if (loading.value) return;
    loading.value = true;
    feedback.value = "";
    isError.value = false;

    try {
        // 1. On récupère le client via son email (puisque la route /Login n'existe pas)
        const response = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Client/GetByEmail/${encodeURIComponent(email.value)}`);

        if (!response.ok) {
            throw new Error("Compte inexistant ou erreur réseau.");
        }

        const userData = await response.json();

        // 2. Vérification hybride du mot de passe
        let isMatch = false;

        // On vérifie si le MDP en base commence par la signature bcrypt "$2a$"
        if (userData.mdp && userData.mdp.startsWith('$2a$')) {
            // COMPTE RÉCENT (Haché)
            isMatch = bcrypt.compareSync(password.value, userData.mdp);
        } else {
            // COMPTE ANCIEN (Texte clair)
            // On compare directement les deux chaînes
            isMatch = (password.value === userData.mdp);
        }

        if (isMatch) {
            // 3. Succès : On met à jour le store global
            store.login(userData);
            
            isError.value = false;
            feedback.value = "CONNEXION RÉUSSIE !";

            setTimeout(() => {
                router.push('/');
            }, 1500);
        } else {
            throw new Error("Mot de passe incorrect.");
        }

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

@media (max-width: 480px) {
  .auth-card {
    padding: 25px;
    width: 95%;
  }
}
</style>