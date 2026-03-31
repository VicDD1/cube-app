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
    // 1. Récupérer la commande (On fetch toutes les commandes du client et on filtre)
    const resCmds = await fetch(`${API_BASE}/Commande/GetByClient/${appStore.user.idClient}`)
    const dataCmds = await resCmds.json()
    const allCmds = dataCmds.$values || dataCmds || []
    
    commande.value = allCmds.find(c => String(c.idCommande) === String(idCmd))
    
    if (!commande.value) throw new Error("Commande introuvable ou accès refusé.")

    // 2. Récupérer les lignes de la commande
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
  const itemFolder = itemRef?.trim().length === 6 ? 'VELOS' : 'ACCESSOIRES'
  try {
    return new URL(`../assets/images/${itemFolder}/${itemRef?.trim()}/image_1.webp`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/600x400?text=Image+Indisponible'
  }
}
</script>

<template>
  <div class="detail-container">
    <button @click="router.push('/profil/commandes')" class="back-btn">« Retour aux commandes</button>
    
    <div v-if="loading" class="loader-state">Chargement des détails...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>

    <div v-else class="detail-content">
      
      <div class="header-section">
        <div class="header-left">
          <h2>COMMANDE N° {{ String(commande.idCommande).padStart(6, '0') }}</h2>
          <p>Passée le {{ formatDate(commande.dateCommande) }}</p>
        </div>
        <button class="btn-pdf" @click="handleDownload">📥 TÉLÉCHARGER LA FACTURE</button>
      </div>
      <div class="separator"></div>

      <div class="layout-grid">
        <div class="items-section">
          <h3>ARTICLES COMMANDÉS</h3>
          <div class="items-list">
            <div v-for="(ligne, index) in lignes" :key="index" class="item-card">
              <div class="item-img-placeholder">
                <img
                    :src="getLocalImage(reference)" 
                     alt="Produit" />
              </div>
              <div class="item-info">
                <span class="item-ref">Réf: {{ ligne.reference.trim() }}</span>
                <h4 class="item-name">{{ ligne.referenceNavigation?.nomArticle || 'Article CUBE' }}</h4>
                <span class="item-meta">Taille : {{ ligne.tailleSelectionnee.trim() }} | Qté : {{ ligne.quantiteArticleCommande }}</span>
              </div>
              <div class="item-price">
                {{ formatPrice(ligne.prixUnitaireArticle * ligne.quantiteArticleCommande) }}
              </div>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-card">
            <h3>RÉSUMÉ</h3>
            <div class="summary-line">
              <span>Articles</span>
              <span>{{ formatPrice(commande.montantTotalCommande) }}</span>
            </div>
            <div class="summary-line">
              <span>Livraison</span>
              <span>Offerte</span>
            </div>
            <div class="summary-line total">
              <span>TOTAL TTC</span>
              <span>{{ formatPrice(commande.montantTotalCommande) }}</span>
            </div>
          </div>

          <div class="summary-card mt-20">
            <h3>INFORMATIONS</h3>
            <div class="info-block">
              <strong>Statut :</strong> {{ commande.statutLivraison?.toUpperCase() || 'EN COURS' }}
            </div>
            <div class="info-block">
              <strong>Moyen de paiement :</strong> {{ commande.moyenPaiement?.toUpperCase() || 'CB' }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.detail-container {
  background: #fff; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); max-width: 1100px; margin: 0 auto;
}

.back-btn { background: none; border: none; font-weight: 800; color: #888; cursor: pointer; margin-bottom: 20px; font-size: 0.85rem; }
.back-btn:hover { color: #000; text-decoration: underline; }

.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; }
.header-left h2 { font-family: 'Inter', sans-serif; font-weight: 900; font-style: italic; font-size: 1.8rem; margin: 0 0 5px 0; }
.header-left p { color: #888; font-size: 0.9rem; margin: 0; font-weight: 600; }
.btn-pdf { background: #000; color: #fff; padding: 12px 20px; font-weight: 900; font-style: italic; border: none; cursor: pointer; border-radius: 4px; transition: 0.2s; }
.btn-pdf:hover { background: #00a8e8; }

.separator { width: 50px; height: 4px; background: #000; margin-bottom: 40px; }

.layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }

h3 { font-size: 1.1rem; font-weight: 900; font-style: italic; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }

.items-list { display: flex; flex-direction: column; gap: 15px; }
.item-card { display: flex; align-items: center; padding: 15px; border: 1px solid #eaeaea; border-radius: 8px; gap: 20px; }
.item-img-placeholder { width: 80px; height: 80px; background: #f9f9f9; display: flex; justify-content: center; align-items: center; border-radius: 6px; font-size: 24px; overflow: hidden;}
.item-img-placeholder img { width: 100%; height: 100%; object-fit: contain; }
.item-info { flex-grow: 1; display: flex; flex-direction: column; gap: 4px; }
.item-ref { font-size: 0.7rem; color: #888; font-weight: 800; }
.item-name { margin: 0; font-weight: 900; font-size: 1rem; }
.item-meta { font-size: 0.85rem; color: #666; font-weight: 600; }
.item-price { font-weight: 900; font-size: 1.2rem; font-style: italic; }

.summary-card { background: #fcfcfc; border: 1px solid #eaeaea; padding: 25px; border-radius: 8px; }
.mt-20 { margin-top: 20px; }
.summary-line { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem; color: #555; font-weight: 600; }
.summary-line.total { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 10px; font-size: 1.2rem; font-weight: 900; font-style: italic; color: #000; }

.info-block { font-size: 0.9rem; margin-bottom: 10px; color: #444; }

@media (max-width: 800px) {
  .layout-grid { grid-template-columns: 1fr; }
  .header-section { flex-direction: column; align-items: flex-start; gap: 20px; }
}
</style>