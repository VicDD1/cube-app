<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/useStore'

const router = useRouter()
const appStore = useAppStore()

onMounted(() => {
  // Réinitialisation du panier après le succès du paiement
  localStorage.removeItem('panierVisiteur')
  appStore.cartItemCount = 0
})

const returnToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="confirmation-container">
    <div class="success-card">
      <div class="icon-circle">
        <span class="checkmark">✓</span>
      </div>
      
      <h1>PAIEMENT RÉUSSI</h1>
      <p class="subtitle">Nous vous remercions pour votre commande.</p>
      
      <p class="description">
        Votre transaction a été traitée avec succès. Vous recevrez très prochainement un e-mail contenant les détails de votre facture et le suivi de votre livraison.
      </p>

      <button class="home-btn" @click="returnToHome">
        RETOURNER À L'ACCUEIL
      </button>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

.confirmation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  font-family: 'Inter', sans-serif;
  background-color: #fff;
  padding: 20px;
  margin-top: 30px;
}

.success-card {
  background: #fcfcfc;
  padding: 50px 40px;
  border: 1px solid #eee;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.icon-circle {
  width: 80px;
  height: 80px;
  background: #00a8e8;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 25px;
}

.checkmark {
  color: #fff;
  font-size: 40px;
  font-weight: 900;
}

h1 {
  font-size: 2rem;
  font-weight: 900;
  font-style: italic;
  margin: 0 0 10px 0;
  color: #1a1a1a;
}

.subtitle {
  font-size: 1.1rem;
  font-weight: 800;
  color: #00a8e8;
  margin-bottom: 20px;
}

.description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 35px;
  font-size: 0.95rem;
}

.home-btn {
  background: #000;
  color: #fff;
  border: none;
  padding: 18px 30px;
  font-weight: 900;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.home-btn:hover {
  background: #00a8e8;
  transform: translateY(-2px);
}
</style>