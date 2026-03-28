<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/useStore'

const appStore = useAppStore()
const commandes = ref([])
const loading = ref(true)
const error = ref('')

const fetchCommandes = async () => {
  if (!appStore.user || !appStore.user.idClient) {
    error.value = "Utilisateur non identifié."
    loading.value = false
    return
  }

  try {
    const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Commande/GetByClient/${appStore.user.idClient}`)
    
    if (!res.ok) {
      if (res.status === 404) {
        commandes.value = [] 
      } else {
        throw new Error("Impossible de récupérer les commandes.")
      }
    } else {
      const data = await res.json()
      const listeBrute = data.$values || data || []
      
      commandes.value = listeBrute.sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande))
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCommandes()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

const formatPrice = (price) => {
  if (price == null) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}


const getStatusDisplay = (statusStr) => {
  const s = (statusStr || '').trim().toLowerCase()
  switch (s) {
    case 'prepare': 
      return { text: 'EN PRÉPARATION', class: 'status-prepare' }
    case 'expedie': 
      return { text: 'EXPÉDIÉE', class: 'status-shipped' }
    case 'livre': 
      return { text: 'LIVRÉE', class: 'status-delivered' }
    case 'annule': 
      return { text: 'ANNULÉE', class: 'status-cancelled' }
    default: 
      return { text: s.toUpperCase() || 'EN COURS', class: 'status-default' }
  }
}
</script>

<template>
  <div class="commandes-container">
    
    <div class="header-section">
      <h2>MES COMMANDES</h2>
      <p>Retrouvez ici l'historique et le suivi de vos achats CUBE.</p>
      <div class="separator"></div>
    </div>

    <div v-if="loading" class="loader-state">
      Chargement de vos commandes...
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <div v-else-if="commandes.length === 0" class="empty-state">
      <p>Vous n'avez passé aucune commande pour le moment.</p>
      <router-link to="/velos" class="btn-shop">DÉCOUVRIR NOS VÉLOS</router-link>
    </div>

    <div v-else class="orders-list">
      <div v-for="cmd in commandes" :key="cmd.idCommande" class="order-card">
        
        <div class="order-header">
          <div class="order-id">
            <span>COMMANDE N°</span>
            <strong>{{ String(cmd.idCommande).padStart(6, '0') }}</strong>
          </div>
          <div :class="['order-badge', getStatusDisplay(cmd.statutLivraison).class]">
            {{ getStatusDisplay(cmd.statutLivraison).text }}
          </div>
        </div>

        <div class="order-body">
          <div class="order-info">
            <span class="info-label">DATE DE COMMANDE</span>
            <span class="info-value">{{ formatDate(cmd.dateCommande) }}</span>
          </div>
          <div class="order-info">
            <span class="info-label">LIVRAISON PRÉVUE</span>
            <span class="info-value">{{ formatDate(cmd.dateLivraison) }}</span>
          </div>
          <div class="order-info">
            <span class="info-label">MONTANT TOTAL</span>
            <span class="info-value price">{{ formatPrice(cmd.montantTotalCommande) }}</span>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.commandes-container {
  background: #fff;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  animation: fadeIn 0.4s ease-out;
  max-width: 900px;
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
  background: #cc0000; 
  margin-bottom: 40px;
}


.loader-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  font-weight: 800;
  color: #888;
}

.error-state { color: #cc0000; }

.btn-shop {
  display: inline-block;
  margin-top: 20px;
  background: #000;
  color: #fff;
  padding: 15px 30px;
  text-decoration: none;
  font-weight: 900;
  font-style: italic;
  clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%);
  transition: background 0.2s;
}

.btn-shop:hover { background: #00a8e8; }


.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  border: 1px solid #eee;
  padding: 25px;
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  border-color: #ddd;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.order-id {
  display: flex;
  flex-direction: column;
}

.order-id span {
  font-size: 0.7rem;
  font-weight: 800;
  color: #888;
}

.order-id strong {
  font-size: 1.2rem;
  font-weight: 900;
  font-style: italic;
}


.order-badge {
  font-size: 0.7rem;
  font-weight: 900;
  padding: 6px 12px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.status-prepare { background: #fff3cd; color: #856404; }
.status-shipped { background: #d1ecf1; color: #0c5460; } 
.status-delivered { background: #d4edda; color: #155724; } 
.status-cancelled { background: #f8d7da; color: #721c24; } 
.status-default { background: #e2e3e5; color: #383d41; } 


.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #888;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111;
}

.info-value.price {
  font-size: 1.2rem;
  font-weight: 900;
  font-style: italic;
  color: #000;
}

@media (max-width: 600px) {
  .order-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>