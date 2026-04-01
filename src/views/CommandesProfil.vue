<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/useStore'
import { useInvoice } from '../composables/useInvoice'

const appStore = useAppStore()
const { downloadInvoice } = useInvoice()

const commandes = ref([])
const loading = ref(true)
const error = ref('')
const isGeneratingPdf = ref(false)

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

onMounted(() => { fetchCommandes() })

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString))
}

const formatPrice = (price) => {
  if (price == null) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const getStatusDisplay = (statusStr) => {
  const s = (statusStr || '').trim().toLowerCase()
  switch (s) {
    case 'prepare': return { text: 'EN PRÉPARATION', class: 'status-prepare' }
    case 'expedie': return { text: 'EXPÉDIÉE', class: 'status-shipped' }
    case 'livre': return { text: 'LIVRÉE', class: 'status-delivered' }
    case 'annule': return { text: 'ANNULÉE', class: 'status-cancelled' }
    default: return { text: s.toUpperCase() || 'EN COURS', class: 'status-default' }
  }
}

const handleDownload = async (cmd) => {
  isGeneratingPdf.value = true
  await downloadInvoice(cmd, appStore.user)
  isGeneratingPdf.value = false
}
</script>

<template>
  <div class="commandes-container">
    
    <div class="header-section">
      <h2>MES COMMANDES</h2>
      <p>Retrouvez ici l'historique et le suivi de vos achats CUBE.</p>
      <div class="separator"></div>
    </div>

    <div v-if="loading" class="loader-state">CHARGEMENT DE VOS COMMANDES...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else-if="commandes.length === 0" class="empty-state">
      <p>Vous n'avez passé aucune commande pour le moment.</p>
      <router-link to="/velos" class="btn-shop">DÉCOUVRIR NOS VÉLOS</router-link>
    </div>

    <div v-else class="orders-list">
      <div v-for="cmd in commandes" :key="cmd.idCommande" class="order-card">
        
        <div class="order-header">
          <div class="order-id">
            <span>COMMANDE N° {{ String(cmd.idCommande).padStart(6, '0') }}</span>
            <span class="order-date">PASSÉE LE {{ formatDate(cmd.dateCommande) }}</span>
          </div>
          <div :class="['order-badge', getStatusDisplay(cmd.statutLivraison).class]">
            {{ getStatusDisplay(cmd.statutLivraison).text }}
          </div>
        </div>

        <div class="order-body">
          <div class="order-info">
            <span class="info-label">TOTAL TTC</span>
            <span class="info-value price">{{ formatPrice(cmd.montantTotalCommande) }}</span>
          </div>
          
          <div class="order-actions">
            <button class="btn-action pdf" @click="handleDownload(cmd)" :disabled="isGeneratingPdf">
              <span class="icon">📥</span> FACTURE
            </button>
            <router-link :to="{ name: 'order-info', params: { id: cmd.idCommande } }" class="btn-action detail">
              VOIR DÉTAILS »
            </router-link>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,800;0,900;1,800;1,900&display=swap');

* {
  box-sizing: border-box;
}

.commandes-container {
  background: #fff;
  padding: 50px;
  max-width: 1000px;
  margin: 40px auto;
  border-top: 6px solid #000;
  box-shadow: 0 25px 50px rgba(0,0,0,0.05);
  font-family: 'Inter', sans-serif;
}

.header-section h2 {
  font-weight: 900;
  font-style: italic;
  font-size: 2.2rem;
  margin: 0 0 5px 0;
  letter-spacing: -1px;
  color: #000;
}
.header-section p {
  color: #666;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 1px;
  margin-bottom: 20px;
}
.separator {
  width: 80px;
  height: 5px;
  background: #cc0000;
  margin-bottom: 40px;
}

.loader-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  font-weight: 900;
  font-style: italic;
  font-size: 1.2rem;
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
  clip-path: polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%);
  transition: background 0.3s, transform 0.2s;
}
.btn-shop:hover {
  background: #cc0000;
  transform: translateY(-2px);
}

.orders-list { display: flex; flex-direction: column; gap: 20px; }

.order-card {
  border: 1px solid #eee;
  border-left: 4px solid transparent;
  padding: 25px;
  background: #fdfdfd;
  transition: all 0.2s ease-in-out;
}
.order-card:hover {
  border-left-color: #cc0000;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  transform: translateX(5px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.order-id span {
  display: block;
  font-weight: 900;
  font-style: italic;
  font-size: 1.4rem;
  color: #000;
  letter-spacing: -0.5px;
}
.order-id .order-date {
  font-size: 0.75rem;
  font-weight: 800;
  font-style: normal;
  color: #888;
  letter-spacing: 1px;
  margin-top: 4px;
}

.order-badge {
  font-size: 0.75rem;
  font-weight: 900;
  font-style: italic;
  padding: 8px 15px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.status-prepare { background: #eee; color: #333; }
.status-shipped { background: #111; color: #fff; } 
.status-delivered { background: #00a8e8; color: #fff; }
.status-cancelled { background: #cc0000; color: #fff; } 
.status-default { background: #f4f4f4; color: #888; } 

.order-body { display: flex; justify-content: space-between; align-items: center; }

.info-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 900;
  color: #888;
  letter-spacing: 1px;
  margin-bottom: 5px;
}
.info-value.price {
  font-size: 1.6rem;
  font-weight: 900;
  font-style: italic;
  color: #cc0000;
}

.order-actions { display: flex; gap: 15px; align-items: center; }

.btn-action {
  padding: 12px 20px;
  font-weight: 900;
  font-style: italic;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  text-decoration: none;
  letter-spacing: 1px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-action.pdf {
  background: #f4f4f4;
  color: #333;
  border-bottom: 2px solid transparent;
}
.btn-action.pdf:hover {
  background: #e0e0e0;
  border-bottom-color: #cc0000;
}

.btn-action.detail {
  background: #000;
  color: #fff;
  clip-path: polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%);
}
.btn-action.detail:hover {
  background: #cc0000;
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .commandes-container { padding: 30px 20px; }
  .order-header { flex-direction: column; gap: 15px; }
  .order-body { flex-direction: column; align-items: flex-start; gap: 20px; }
  .order-actions { width: 100%; flex-direction: column; }
  .btn-action { width: 100%; }
}
</style>