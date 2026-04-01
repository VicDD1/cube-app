<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/useStore'
import { useInvoice } from '../composables/useInvoice'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { downloadInvoice } = useInvoice()

const commande = ref(null)
const lignes = ref([])
const loading = ref(true)
const error = ref('')

const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'

const fetchOrderDetail = async () => {
  const idCmd = route.params.id
  if (!appStore.user) {
    router.push('/connexion')
    return
  }

  try {
    const resCmds = await fetch(`${API_BASE}/Commande/GetByClient/${appStore.user.idClient}`)
    const dataCmds = await resCmds.json()
    const allCmds = dataCmds.$values || dataCmds || []
    
    commande.value = allCmds.find(c => String(c.idCommande) === String(idCmd))
    
    if (!commande.value) throw new Error("Commande introuvable ou accès refusé.")

    const resLignes = await fetch(`${API_BASE}/LigneCommande/GetByCommande/${idCmd}`)
    if (resLignes.ok) {
      const dataLignes = await resLignes.json()
      lignes.value = dataLignes.$values || dataLignes || []
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchOrderDetail() })

const formatPrice = (price) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0)
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-'

const handleDownload = () => {
  if (commande.value) downloadInvoice(commande.value, appStore.user)
}

const getLocalImage = (itemRef) => {
  if (!itemRef) return 'https://via.placeholder.com/600x400?text=Image+Indisponible'
  const cleanRef = itemRef.trim()
  const itemFolder = cleanRef.length === 6 ? 'VELOS' : 'ACCESSOIRES'
  try {
    return new URL(`../assets/images/${itemFolder}/${cleanRef}/image_1.webp`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/600x400?text=Image+Indisponible'
  }
}
</script>

<template>
  <div class="detail-container">
    <button @click="router.push('/profil/commandes')" class="back-btn">
      <span class="arrow">«</span> RETOUR AUX COMMANDES
    </button>
    
    <div v-if="loading" class="loader-state">Chargement des détails...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="detail-content">
      
      <div class="header-section">
        <div class="header-left">
          <h2>COMMANDE N° {{ String(commande.idCommande).padStart(6, '0') }}</h2>
          <p class="order-date">PASSÉE LE {{ formatDate(commande.dateCommande) }}</p>
        </div>
        <button class="btn-pdf" @click="handleDownload">
          <span class="icon">📥</span> TÉLÉCHARGER LA FACTURE
        </button>
      </div>
      <div class="separator"></div>

      <div class="layout-grid">
        <div class="items-section">
          <h3 class="section-title">ARTICLES COMMANDÉS</h3>
          <div class="items-list">
            <div v-for="(ligne, index) in lignes" :key="index" class="item-card">
              <div class="item-img-placeholder">
                <img :src="getLocalImage(ligne.reference)" :alt="ligne.referenceNavigation?.nomArticle || 'Produit'" />
              </div>
              <div class="item-info">
                <span class="item-ref">RÉF: {{ ligne.reference.trim() }}</span>
                <h4 class="item-name">{{ ligne.referenceNavigation?.nomArticle.toUpperCase() || 'ARTICLE CUBE' }}</h4>
                <div class="item-meta">
                  <span class="meta-tag">TAILLE: <strong>{{ ligne.tailleSelectionnee.trim() }}</strong></span>
                  <span class="meta-tag">QTÉ: <strong>{{ ligne.quantiteArticleCommande }}</strong></span>
                </div>
              </div>
              <div class="item-price">
                {{ formatPrice(ligne.prixUnitaireArticle * ligne.quantiteArticleCommande) }}
              </div>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-card dark-card">
            <h3 class="summary-title">RÉSUMÉ</h3>
            <div class="summary-line">
              <span>ARTICLES</span>
              <span>{{ formatPrice(commande.montantTotalCommande) }}</span>
            </div>
            <div class="summary-line">
              <span>LIVRAISON</span>
              <span>OFFERTE</span>
            </div>
            
            <div class="total-block">
              <span class="total-label">TOTAL TTC</span>
              <span class="total-value">{{ formatPrice(commande.montantTotalCommande) }}</span>
            </div>
          </div>

          <div class="summary-card light-card mt-20">
            <h3 class="summary-title dark-text">INFORMATIONS</h3>
            <div class="info-block">
              <span class="info-label">STATUT</span>
              <div class="status-badge" :class="{'delivered': commande.statutLivraison?.toLowerCase() === 'livré'}">
                {{ commande.statutLivraison?.toUpperCase() || 'EN COURS' }}
              </div>
            </div>
            <div class="info-block">
              <span class="info-label">MOYEN DE PAIEMENT</span>
              <div class="payment-method">
                {{ commande.moyenPaiement?.toUpperCase() || 'CARTE BANCAIRE' }}
              </div>
            </div>
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

.detail-container {
  background: #fff;
  padding: 50px;
  max-width: 1200px;
  margin: 40px auto;
  border-top: 6px solid #000;
  box-shadow: 0 25px 50px rgba(0,0,0,0.05);
  font-family: 'Inter', sans-serif;
}

.back-btn {
  background: none;
  border: none;
  font-weight: 800;
  color: #888;
  cursor: pointer;
  margin-bottom: 30px;
  font-size: 0.75rem;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
  padding: 0;
}
.back-btn .arrow { font-size: 1.2rem; margin-top: -2px; }
.back-btn:hover { color: #cc0000; }

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 15px;
}
.header-left h2 {
  font-weight: 900;
  font-style: italic;
  font-size: 2.2rem;
  margin: 0 0 5px 0;
  letter-spacing: -1px;
  color: #000;
}
.order-date {
  color: #666;
  font-size: 0.85rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: 1px;
}

.btn-pdf {
  background: #cc0000;
  color: #fff;
  padding: 14px 24px;
  font-weight: 900;
  font-style: italic;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  letter-spacing: 1px;
  clip-path: polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%);
  transition: background 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-pdf:hover {
  background: #000;
  transform: translateY(-2px);
}

.separator {
  width: 80px;
  height: 5px;
  background: #cc0000;
  margin-bottom: 40px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 50px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 900;
  font-style: italic;
  margin-bottom: 25px;
  color: #000;
  text-transform: uppercase;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.item-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #fdfdfd;
  border: 1px solid #eee;
  border-left: 4px solid transparent;
  gap: 20px;
  transition: all 0.2s ease-in-out;
}
.item-card:hover {
  border-left-color: #cc0000;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  transform: translateX(5px);
}

.item-img-placeholder {
  width: 90px;
  height: 90px;
  background: #f4f4f4;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.item-img-placeholder img { width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; }

.item-info { flex-grow: 1; display: flex; flex-direction: column; gap: 6px; }
.item-ref { font-size: 0.65rem; color: #888; font-weight: 900; letter-spacing: 1px; }
.item-name { margin: 0; font-weight: 900; font-style: italic; font-size: 1.1rem; color: #000; }
.item-meta { display: flex; gap: 15px; }
.meta-tag { font-size: 0.75rem; color: #666; }
.meta-tag strong { color: #000; font-weight: 900; }

.item-price {
  font-weight: 900;
  font-size: 1.4rem;
  font-style: italic;
  color: #000;
}

.summary-card {
  padding: 30px;
  position: relative;
}

.summary-title {
  font-size: 1.1rem;
  font-weight: 900;
  font-style: italic;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 15px;
}
.dark-text {
  border-bottom-color: #ddd;
}

.dark-card {
  background: #111;
  color: #fff;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 0.85rem;
  color: #aaa;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.summary-line span:last-child { color: #fff; }

.total-block {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #333;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.total-label {
  font-size: 0.8rem;
  color: #888;
  font-weight: 900;
  margin-bottom: 5px;
}
.total-value {
  font-size: 2.2rem;
  font-weight: 900;
  font-style: italic;
  color: #cc0000;
  line-height: 1;
}

.light-card {
  background: #f8f8f8;
  border-left: 4px solid #000;
}
.mt-20 { margin-top: 30px; }

.info-block {
  margin-bottom: 20px;
}
.info-block:last-child { margin-bottom: 0; }

.info-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 900;
  color: #888;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.status-badge {
  display: inline-block;
  background: #000;
  color: #fff;
  padding: 8px 15px;
  font-size: 0.8rem;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 1px;
}
.status-badge.delivered { background: #00a8e8; }

.payment-method {
  font-size: 0.95rem;
  font-weight: 800;
  color: #111;
}

.loader-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  font-weight: 900;
  font-style: italic;
  font-size: 1.2rem;
  color: #888;
}
.error-state { color: #cc0000; }

@media (max-width: 900px) {
  .layout-grid { grid-template-columns: 1fr; gap: 40px; }
  .header-section { flex-direction: column; align-items: flex-start; gap: 20px; }
  .detail-container { padding: 30px 20px; }
  .item-card { flex-direction: column; align-items: flex-start; }
  .item-img-placeholder { width: 100%; height: 150px; }
  .item-price { align-self: flex-end; }
}
</style>